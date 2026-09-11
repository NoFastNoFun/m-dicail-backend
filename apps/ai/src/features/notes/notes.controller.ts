import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard, UserRole } from '@app/shared';
import { NotesService } from './services/notes.service';
import { NoteProcessRequestDto } from './dtos/requests/note-process.request.dto';
import { NoteProcessResponseDto } from './dtos/responses/note-process.response.dto';

@ApiTags('notes')
@ApiBearerAuth()
@Roles(UserRole.PRATICIEN)
@UseGuards(RolesGuard)
@Controller({ path: 'notes', version: '1' })
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  process(@Body() dto: NoteProcessRequestDto): Promise<NoteProcessResponseDto> {
    return this.notesService.process(dto);
  }
}
