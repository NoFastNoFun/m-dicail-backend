import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@app/shared';
import { AiConfigModule } from './config/config.module';

@Module({
  imports: [AiConfigModule],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AiModule {}
