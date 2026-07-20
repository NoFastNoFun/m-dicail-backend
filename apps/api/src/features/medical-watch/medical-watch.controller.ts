import { Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MedicalWatchService } from './services/medical-watch.service';
import { MedicalWatchArticleResponseDto } from './dtos/responses/medical-watch-article.response.dto';
import { MedicalWatchSpecialty } from './enums/medical-watch-specialty.enum';

@ApiTags('medical-watch')
@ApiBearerAuth()
@Controller({ path: 'medical-watch', version: '1' })
export class MedicalWatchController {
  constructor(private readonly medicalWatchService: MedicalWatchService) {}

  @Get()
  @ApiQuery({ name: 'specialty', required: false, enum: MedicalWatchSpecialty })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getArticles(@Query('specialty') specialty?: MedicalWatchSpecialty, @Query('limit') limit?: number): Promise<MedicalWatchArticleResponseDto[]> {
    return this.medicalWatchService.getArticles(specialty, limit);
  }

  @Post('trigger')
  @HttpCode(HttpStatus.NO_CONTENT)
  async triggerManually(): Promise<void> {
    void this.medicalWatchService.runManually();
  }
}
