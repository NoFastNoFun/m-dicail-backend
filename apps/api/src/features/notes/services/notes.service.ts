import { Injectable } from '@nestjs/common';
import { NoteProcessRequestDto } from '../dtos/requests/note-process.request.dto';
import { NoteSummarizeRequestDto } from '../dtos/requests/note-summarize.request.dto';
import { NoteProcessResponseDto } from '../dtos/responses/note-process.response.dto';
import { NoteSummarizeResponseDto } from '../dtos/responses/note-summarize.response.dto';
import { SoapClassifierService } from './soap-classifier.service';
import { AnonymizationService } from './anonymization.service';

@Injectable()
export class NotesService {
  constructor(
    private readonly soapClassifier: SoapClassifierService,
    private readonly anonymization: AnonymizationService,
  ) {}

  process(dto: NoteProcessRequestDto): NoteProcessResponseDto {
    const { anonymizedText } = this.anonymization.anonymize(dto.raw_text);

    return {
      session_id: dto.session_id,
      processed_text: anonymizedText,
      soap_note: this.soapClassifier.classify(anonymizedText),
    };
  }

  summarize(dto: NoteSummarizeRequestDto): NoteSummarizeResponseDto {
    return { summary: dto.processed_text.slice(0, 20) };
  }
}
