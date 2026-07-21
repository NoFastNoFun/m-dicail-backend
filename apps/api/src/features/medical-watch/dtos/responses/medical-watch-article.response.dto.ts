import { ApiProperty } from '@nestjs/swagger';
import { ArticleResponseDto } from '../../../pubmed/dtos/responses/article.response.dto';
import { MedicalWatchSpecialty } from '../../enums/medical-watch-specialty.enum';

export class MedicalWatchArticleResponseDto extends ArticleResponseDto {
  @ApiProperty({ enum: MedicalWatchSpecialty })
  declare specialty: MedicalWatchSpecialty;

  @ApiProperty()
  declare searchQuery: string;

  @ApiProperty()
  declare fetchedAt: Date;
}
