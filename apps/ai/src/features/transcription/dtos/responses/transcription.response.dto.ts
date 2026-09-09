import { ApiProperty } from '@nestjs/swagger';

export class TranscriptionResponseDto {
  @ApiProperty({ description: 'Enhanced transcript text' })
  text!: string;
}
