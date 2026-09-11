import { ApiProperty } from '@nestjs/swagger';

class SoapNoteDto {
  @ApiProperty() declare subjective: string;
  @ApiProperty() declare objective: string;
  @ApiProperty() declare assessment: string;
  @ApiProperty() declare plan: string;
  @ApiProperty() declare other: string;
}

export class NoteProcessResponseDto {
  @ApiProperty() declare session_id: string;
  @ApiProperty() declare processed_text: string;
  @ApiProperty() declare soap_note: SoapNoteDto;
}
