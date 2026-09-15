import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranscriptionResponseDto {
  @ApiProperty({ description: 'Enhanced transcript text' })
  text!: string;

  @ApiPropertyOptional({ description: 'Recording session id when provided by the client' })
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Zero-based chunk index when uploading progressive segments' })
  chunkIndex?: number;

  @ApiPropertyOptional({ description: 'Whether this was the final chunk of the session' })
  isFinal?: boolean;
}
