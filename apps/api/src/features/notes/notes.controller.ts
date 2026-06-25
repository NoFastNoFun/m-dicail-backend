import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotesService } from './services/notes.service';
import { NoteProcessRequestDto } from './dtos/requests/note-process.request.dto';
import { NoteSummarizeRequestDto } from './dtos/requests/note-summarize.request.dto';
import { NoteProcessResponseDto } from './dtos/responses/note-process.response.dto';
import { NoteSummarizeResponseDto } from './dtos/responses/note-summarize.response.dto';

@ApiTags('notes')
@ApiBearerAuth()
@Controller({ path: 'notes', version: '1' })
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  process(@Body() dto: NoteProcessRequestDto): NoteProcessResponseDto {
    return this.notesService.process(dto);
  }

  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  summarize(@Body() dto: NoteSummarizeRequestDto): NoteSummarizeResponseDto {
    return this.notesService.summarize(dto);
  }
}
