import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from '../../../pubmed/dtos/responses/article.response.dto';
import { MedicalWatchArticle } from '../../entities/medical-watch-article.entity';
import { MedicalWatchSpecialty } from '../../enums/medical-watch-specialty.enum';

export class MedicalWatchArticleResponseDto extends ArticleResponseDto {
  @ApiProperty({ enum: MedicalWatchSpecialty })
  declare specialty: MedicalWatchSpecialty;

  @ApiProperty()
  declare search_query: string;

  @ApiProperty()
  declare fetched_at: Date;

  constructor(article: MedicalWatchArticle) {
    super();
    this.pmid = article.pmid;
    this.title = article.title;
    this.abstract = article.abstract;
    this.authors = article.authors;
    this.publication_date = article.publicationDate;
    this.doi = article.doi;
    this.specialty = article.specialty;
    this.search_query = article.searchQuery;
    this.fetched_at = article.fetchedAt;
  }
}
