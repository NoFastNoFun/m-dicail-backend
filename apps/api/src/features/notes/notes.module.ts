import { Module } from '@nestjs/common';
import { AnonymizationModule } from './anonymization.module';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';
import { SoapClassifierService } from './services/soap-classifier.service';

@Module({
  imports: [AnonymizationModule],
  controllers: [NotesController],
  providers: [NotesService, SoapClassifierService],
})
export class NotesModule {}
