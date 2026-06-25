import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class PubmedSearchRequestDto {
  @ApiProperty({ example: 'arm pain physiotherapy' })
  @IsString()
  @MinLength(1)
  declare query: string;

  @ApiProperty({ default: 3, minimum: 1, maximum: 50 })
  @IsInt()
  @Min(1)
  @Max(50)
  max_results: number = 3;
}
