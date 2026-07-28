import { BadGatewayException, GatewayTimeoutException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';

@Injectable()
export class WhisperClientService {
  private readonly logger = new Logger(WhisperClientService.name);

  constructor(private readonly config: ConfigService) {}

  async transcribeFile(params: { filePath: string; originalName: string; mimeType: string; language: string }): Promise<string> {
    const baseUrl = this.config.getOrThrow<string>('WHISPER_BASE_URL').replace(/\/$/, '');
    const timeoutMs = this.config.get<number>('WHISPER_TIMEOUT_MS') ?? 600_000;
    const url = `${baseUrl}/v1/audio/transcriptions`;

    const bytes = await readFile(params.filePath);
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(bytes)], {
        type: params.mimeType || 'application/octet-stream',
      }),
      params.originalName || 'audio.wav',
    );
    form.append('language', params.language || 'fr');
    form.append('response_format', 'json');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        this.logger.error(`Whisper upstream ${response.status}: ${body.slice(0, 500)}`);
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
      this.logger.error(`Whisper request failed: ${String(error)}`);
      throw new ServiceUnavailableException('Service de transcription injoignable');
    } finally {
      clearTimeout(timer);
    }
  }
}
