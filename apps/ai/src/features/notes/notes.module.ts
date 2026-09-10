import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';
import { GroqSoapService } from './services/groq-soap.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService, GroqSoapService],
})
export class NotesModule {}
