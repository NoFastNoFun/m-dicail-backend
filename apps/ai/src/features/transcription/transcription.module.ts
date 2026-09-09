import { Module } from '@nestjs/common';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './services/transcription.service';
import { GroqClientService } from './services/groq-client.service';

@Module({
  controllers: [TranscriptionController],
  providers: [TranscriptionService, GroqClientService],
})
export class TranscriptionModule {}
