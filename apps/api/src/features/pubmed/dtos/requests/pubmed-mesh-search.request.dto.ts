import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class PubmedMeshSearchRequestDto {
  @ApiProperty({ example: 'low back pain' })
  @IsString()
  @MinLength(1)
  declare query: string;

  @ApiProperty({ default: 15, minimum: 1, maximum: 30 })
  @IsInt()
  @Min(1)
  @Max(30)
  max_results: number = 15;
}
