import { Module } from '@nestjs/common';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './services/transcription.service';
import { WhisperClientService } from './services/whisper-client.service';

@Module({
  controllers: [TranscriptionController],
  providers: [TranscriptionService, WhisperClientService],
})
export class TranscriptionModule {}
