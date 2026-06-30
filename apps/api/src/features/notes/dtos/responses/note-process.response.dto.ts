import { ApiProperty } from '@nestjs/swagger';

export class NoteProcessResponseDto {
  @ApiProperty() declare session_id: string;
  @ApiProperty() declare processed_text: string;
}
