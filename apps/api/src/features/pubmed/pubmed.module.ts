import { Module } from '@nestjs/common';
import { PubmedService } from './services/pubmed.service';
import { PubmedController } from './pubmed.controller';

@Module({
  controllers: [PubmedController],
  providers: [PubmedService],
  exports: [PubmedService],
})
export class PubmedModule {}
