import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';
import { SoapClassifierService } from './services/soap-classifier.service';
import { AnonymizationService } from './services/anonymization.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, SoapClassifierService, AnonymizationService],
})
export class NotesModule {}
