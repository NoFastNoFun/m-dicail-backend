import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class NoteProcessRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare session_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  declare raw_text: string;

  @ApiProperty({ default: 'fr' })
  @IsString()
  @IsOptional()
  declare language: string;
}
