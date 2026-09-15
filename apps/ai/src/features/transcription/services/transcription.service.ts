import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { GroqClientService } from './groq-client.service';
import { TranscriptionResponseDto } from '../dtos/responses/transcription.response.dto';
import { UploadedAudioFile } from '../interfaces/uploaded-audio-file.interface';

@Injectable()
export class TranscriptionService {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(private readonly groqClient: GroqClientService) {}

  async transcribe(params: {
    file: UploadedAudioFile;
    language?: string;
    sessionId?: string;
    chunkIndex?: number;
    isFinal?: boolean;
  }): Promise<TranscriptionResponseDto> {
    const { file, language = 'fr', sessionId, chunkIndex, isFinal } = params;
    if (!file?.buffer && !file?.path && !file?.stream) {
      throw new BadRequestException('Fichier audio manquant');
    }
    if (!file.size && file.buffer && file.buffer.length === 0) {
      throw new BadRequestException('Fichier audio vide');
    }

    const tempPath = await this.persistUpload(file);
    try {
      if (sessionId) {
        const chunkLabel = chunkIndex === undefined ? 'single' : `chunk=${chunkIndex}${isFinal ? ' final' : ''}`;
        this.logger.log(`Transcribing session=${sessionId} ${chunkLabel} bytes=${file.size}`);
      }
      const text = await this.groqClient.transcribeFile({
        filePath: tempPath,
        originalName: file.originalname || 'audio.wav',
        mimeType: file.mimetype || 'audio/wav',
        language,
      });
      return {
        text,
        ...(sessionId !== undefined ? { sessionId } : {}),
        ...(chunkIndex !== undefined ? { chunkIndex } : {}),
        ...(isFinal !== undefined ? { isFinal } : {}),
      };
    } finally {
      await unlink(tempPath).catch(() => undefined);
    }
  }

  private async persistUpload(file: UploadedAudioFile): Promise<string> {
    const dir = join(tmpdir(), 'medicail-transcriptions');
    await mkdir(dir, { recursive: true });
    const ext = this.extensionFor(file.originalname, file.mimetype);
    const tempPath = join(dir, `${randomUUID()}${ext}`);

    if (file.buffer) {
      await writeFile(tempPath, file.buffer);
      return tempPath;
    }

    const source = file.stream ?? Readable.from([]);
    await pipeline(source, createWriteStream(tempPath));
    return tempPath;
  }

  private extensionFor(originalName?: string, mimeType?: string): string {
    if (originalName?.includes('.')) {
      return originalName.slice(originalName.lastIndexOf('.'));
    }
    if (mimeType === 'audio/mpeg' || mimeType === 'audio/mp3') {
      return '.mp3';
    }
    if (mimeType === 'audio/webm') {
      return '.webm';
    }
    if (mimeType === 'audio/ogg') {
      return '.ogg';
    }
    return '.wav';
  }
}
