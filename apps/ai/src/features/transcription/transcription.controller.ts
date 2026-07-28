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
  ): Promise<TranscriptionResponseDto> {
    return this.transcriptionService.transcribe({
      file,
      language: language?.trim() || 'fr',
      sessionId: sessionId?.trim() || undefined,
    });
  }
}
