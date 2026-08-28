import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PubmedService } from './services/pubmed.service';
import { PubmedMeshSearchRequestDto } from './dtos/requests/pubmed-mesh-search.request.dto';
import { PubmedSearchRequestDto } from './dtos/requests/pubmed-search.request.dto';
import { MeshDescriptorResponseDto } from './dtos/responses/mesh-descriptor.response.dto';
import { ArticleResponseDto } from './dtos/responses/article.response.dto';

@ApiTags('pubmed')
@ApiBearerAuth()
@Controller({ path: 'pubmed', version: '1' })
export class PubmedController {
  constructor(private readonly pubmedService: PubmedService) {}

  @Post('search')
  @HttpCode(HttpStatus.OK)
  search(@Body() dto: PubmedSearchRequestDto): Promise<ArticleResponseDto[]> {
    return this.pubmedService.search(dto.query, dto.max_results);
  }

  @Post('mesh')
  @HttpCode(HttpStatus.OK)
  searchMesh(@Body() dto: PubmedMeshSearchRequestDto): Promise<MeshDescriptorResponseDto[]> {
    return this.pubmedService.searchMesh(dto.query, dto.max_results);
  }
}
