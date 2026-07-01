import { ApiProperty } from '@nestjs/swagger';

export class MedicalWatchArticleResponseDto {
  @ApiProperty()
  declare pmid: string;

  @ApiProperty()
  declare title: string;

  @ApiProperty()
  declare abstract: string;

  @ApiProperty({ type: [String] })
  declare authors: string[];

  @ApiProperty({ nullable: true })
  declare publicationDate: string | null;

  @ApiProperty({ nullable: true })
  declare doi: string | null;

  @ApiProperty()
  declare searchQuery: string;

  @ApiProperty()
  declare fetchedAt: Date;
}
