import { Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { TranscriptionService } from './services/transcription.service';
import { TranscriptionResponseDto } from './dtos/responses/transcription.response.dto';
import { UploadedAudioFile } from './interfaces/uploaded-audio-file.interface';

@ApiTags('transcriptions')
@ApiBearerAuth()
@Controller({ path: 'transcriptions', version: '1' })
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        language: { type: 'string', example: 'fr' },
        session_id: { type: 'string' },
        chunk_index: { type: 'integer', example: 0 },
        is_final: { type: 'boolean', example: false },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  transcribe(
    @UploadedFile() file: UploadedAudioFile,
    @Body('language') language?: string,
    @Body('session_id') sessionId?: string,
    @Body('chunk_index') chunkIndexRaw?: string,
    @Body('is_final') isFinalRaw?: string,
  ): Promise<TranscriptionResponseDto> {
    return this.transcriptionService.transcribe({
      file,
      language: language?.trim() || 'fr',
      sessionId: sessionId?.trim() || undefined,
      chunkIndex: this.parseOptionalInt(chunkIndexRaw),
      isFinal: this.parseOptionalBool(isFinalRaw),
    });
  }

  private parseOptionalInt(value?: string): number | undefined {
    if (value == null || value.trim() === '') {
      return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseOptionalBool(value?: string): boolean | undefined {
    if (value == null || value.trim() === '') {
      return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    return undefined;
  }
}
