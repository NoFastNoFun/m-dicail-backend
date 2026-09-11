import { Injectable, Logger } from '@nestjs/common';
import { NoteProcessRequestDto } from '../dtos/requests/note-process.request.dto';
import { NoteSummarizeRequestDto } from '../dtos/requests/note-summarize.request.dto';
import { NoteProcessResponseDto } from '../dtos/responses/note-process.response.dto';
import { NoteSummarizeResponseDto } from '../dtos/responses/note-summarize.response.dto';
import { SoapClassifierService } from './soap-classifier.service';
import { AnonymizationService } from './anonymization.service';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly soapClassifier: SoapClassifierService,
    private readonly anonymization: AnonymizationService,
  ) {}

  process(dto: NoteProcessRequestDto): NoteProcessResponseDto {
    const start = Date.now();
    // Anonymize before classify so keyword/regex rules never see raw PII.
    const { anonymizedText } = this.anonymization.anonymize(dto.raw_text);
    const soapNote = this.soapClassifier.classify(anonymizedText);

    this.logger.log(`[TIMER] process() session=${dto.session_id} total=${Date.now() - start}ms`);

    return {
      session_id: dto.session_id,
      processed_text: anonymizedText,
      soap_note: soapNote,
    };
  }

  summarize(dto: NoteSummarizeRequestDto): NoteSummarizeResponseDto {
    // Placeholder until a real summarizer lands — still anonymize so the stub cannot leak PII.
    const { anonymizedText } = this.anonymization.anonymize(dto.processed_text);
    return { summary: anonymizedText.slice(0, 20) };
  }
}
