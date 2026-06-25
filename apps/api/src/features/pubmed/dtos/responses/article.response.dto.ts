import { ApiProperty } from '@nestjs/swagger';

export class ArticleResponseDto {
  @ApiProperty() declare pmid: string;
  @ApiProperty() declare title: string;
  @ApiProperty() declare abstract: string;
  @ApiProperty({ type: [String] }) declare authors: string[];
  @ApiProperty({ nullable: true }) declare publication_date: string | null;
  @ApiProperty({ nullable: true }) declare doi: string | null;
}
