import { Injectable, Logger } from '@nestjs/common';
import { NoteProcessRequestDto } from '../dtos/requests/note-process.request.dto';
import { NoteProcessResponseDto } from '../dtos/responses/note-process.response.dto';
import { GroqSoapService } from './groq-soap.service';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly groqSoap: GroqSoapService) {}

  async process(dto: NoteProcessRequestDto): Promise<NoteProcessResponseDto> {
    const start = Date.now();
    const language = dto.language || 'fr';
    const soapNote = await this.groqSoap.generate({ transcript: dto.raw_text, language });

    this.logger.log(`[TIMER] process() session=${dto.session_id} total=${Date.now() - start}ms`);

    return {
      session_id: dto.session_id,
      processed_text: dto.raw_text,
      soap_note: soapNote,
    };
  }
}
