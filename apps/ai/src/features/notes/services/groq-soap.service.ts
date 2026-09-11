import { BadGatewayException, GatewayTimeoutException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SoapNote } from '../interfaces/soap-note.interface';
import { DEFAULT_GROQ_BASE_URL, DEFAULT_GROQ_SOAP_MODEL, DEFAULT_GROQ_TIMEOUT_MS, SOAP_SECTIONS } from '../constants/groq-soap.constants';
import { buildSoapSystemPrompt } from '../utils/soap-prompt.util';

@Injectable()
export class GroqSoapService {
  private readonly logger = new Logger(GroqSoapService.name);

  constructor(private readonly config: ConfigService) {}

  /** Calls Groq chat completions with forced JSON; maps abort to GatewayTimeout. */
  async generate(params: { transcript: string; language: string }): Promise<SoapNote> {
    const apiKey = this.config.getOrThrow<string>('GROQ_API_KEY');
    const baseUrl = (this.config.get<string>('GROQ_BASE_URL') || DEFAULT_GROQ_BASE_URL).replace(/\/$/, '');
    const model = this.config.get<string>('GROQ_SOAP_MODEL') || DEFAULT_GROQ_SOAP_MODEL;
    const timeoutMs = this.config.get<number>('GROQ_TIMEOUT_MS') ?? DEFAULT_GROQ_TIMEOUT_MS;
    const url = `${baseUrl}/chat/completions`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: buildSoapSystemPrompt(params.language) },
            { role: 'user', content: params.transcript },
          ],
        }),
        signal: controller.signal,
      });

      this.logger.log(`[TIMER] Groq fetch model=${model} duration=${Date.now() - start}ms status=${response.status}`);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.error(`Groq upstream ${response.status}: ${body.slice(0, 500)}`);
        throw new BadGatewayException('Service de generation SOAP indisponible');
      }

      const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const content = payload.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new BadGatewayException('Reponse de generation SOAP invalide');
      }

      return this.parseSoapNote(content);
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('Delai de generation SOAP depasse');
      }
      this.logger.error(`Groq request failed: ${String(error)}`);
      throw new ServiceUnavailableException('Service de generation SOAP injoignable');
    } finally {
      clearTimeout(timer);
    }
  }

  private parseSoapNote(content: string): SoapNote {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new BadGatewayException('Reponse de generation SOAP invalide');
    }

    if (typeof parsed !== 'object' || parsed === null) {
      throw new BadGatewayException('Reponse de generation SOAP invalide');
    }

    const record = parsed as Record<string, unknown>;
    const note = {} as SoapNote;
    for (const section of SOAP_SECTIONS) {
      const value = record[section];
      if (typeof value !== 'string') {
        throw new BadGatewayException('Reponse de generation SOAP invalide');
      }
      note[section] = value;
    }
    return note;
  }
}
