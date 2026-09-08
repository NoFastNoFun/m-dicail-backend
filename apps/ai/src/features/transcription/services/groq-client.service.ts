import { BadGatewayException, GatewayTimeoutException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'whisper-large-v3-turbo';
const DEFAULT_TIMEOUT_MS = 120_000;

const FR_MEDICAL_PROMPT =
  'Consultation de kinesitherapie. Orthographe: lombalgie, cervicalgie, sciatalgie, rotulien, ischio-jambiers, gonalgie, tendinopathie, rachis.';

@Injectable()
export class GroqClientService {
  private readonly logger = new Logger(GroqClientService.name);

  constructor(private readonly config: ConfigService) {}

  async transcribeFile(params: { filePath: string; originalName: string; mimeType: string; language: string }): Promise<string> {
    const apiKey = this.config.getOrThrow<string>('GROQ_API_KEY');
    const baseUrl = (this.config.get<string>('GROQ_BASE_URL') || DEFAULT_GROQ_BASE_URL).replace(/\/$/, '');
    const model = this.config.get<string>('GROQ_TRANSCRIPTION_MODEL') || DEFAULT_MODEL;
    const timeoutMs = this.config.get<number>('GROQ_TIMEOUT_MS') ?? DEFAULT_TIMEOUT_MS;
    const url = `${baseUrl}/audio/transcriptions`;

    const bytes = await readFile(params.filePath);
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(bytes)], {
        type: params.mimeType || 'application/octet-stream',
      }),
      params.originalName || 'audio.wav',
    );
    form.append('model', model);
    form.append('language', params.language || 'fr');
    form.append('response_format', 'json');
    form.append('temperature', '0');
    if ((params.language || 'fr') === 'fr') {
      form.append('prompt', FR_MEDICAL_PROMPT);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.error(`Groq upstream ${response.status}: ${body.slice(0, 500)}`);
        throw new BadGatewayException('Service de transcription indisponible');
      }

      const payload = (await response.json()) as { text?: string };
      if (typeof payload.text !== 'string') {
        throw new BadGatewayException('Reponse de transcription invalide');
      }
      return payload.text.trim();
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('Delai de transcription depasse');
      }
      this.logger.error(`Groq request failed: ${String(error)}`);
      throw new ServiceUnavailableException('Service de transcription injoignable');
    } finally {
      clearTimeout(timer);
    }
  }
}
