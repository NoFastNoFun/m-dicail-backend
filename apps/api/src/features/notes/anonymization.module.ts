import { Module } from '@nestjs/common';
import { AnonymizationService } from './services/anonymization.service';

@Module({
  providers: [AnonymizationService],
  exports: [AnonymizationService],
})
export class AnonymizationModule {}
