import { ApiProperty } from '@nestjs/swagger';

export class NoteSummarizeResponseDto {
  @ApiProperty() declare summary: string;
}
