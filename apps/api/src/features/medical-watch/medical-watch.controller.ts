import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MedicalWatchService } from './services/medical-watch.service';
import { MedicalWatchArticleResponseDto } from './dtos/responses/medical-watch-article.response.dto';
import { GetMedicalWatchQueryDto } from './dtos/requests/get-medical-watch-query.dto';

@ApiTags('medical-watch')
@ApiBearerAuth()
@Controller({ path: 'medical-watch', version: '1' })
export class MedicalWatchController {
  constructor(private readonly medicalWatchService: MedicalWatchService) {}

  @Get()
  getArticles(@Query() query: GetMedicalWatchQueryDto): Promise<MedicalWatchArticleResponseDto[]> {
    return this.medicalWatchService.getArticles(query.specialty, query.limit);
  }

  @Post('trigger')
  @HttpCode(HttpStatus.NO_CONTENT)
  async triggerManually(): Promise<void> {
    void this.medicalWatchService.runManually();
  }
}
