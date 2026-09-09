import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/shared';
import { AiConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { TranscriptionModule } from './features/transcription/transcription.module';

@Module({
  imports: [AiConfigModule, AuthModule, TranscriptionModule],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AiModule {}
