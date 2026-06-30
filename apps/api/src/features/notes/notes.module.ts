import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './services/notes.service';

@Module({
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
