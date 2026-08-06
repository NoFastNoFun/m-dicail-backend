import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';
import { SoapClassifierService } from './services/soap-classifier.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, SoapClassifierService],
})
export class NotesModule {}
