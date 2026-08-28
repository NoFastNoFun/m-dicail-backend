import { Controller, Get, HttpCode, HttpStatus, Patch, Post, Query, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/shared';
import { MedicalWatchService } from './services/medical-watch.service';
import { MedicalWatchArticleResponseDto } from './dtos/responses/medical-watch-article.response.dto';
import { GetMedicalWatchQueryDto } from './dtos/requests/get-medical-watch-query.dto';
import {
  MedicalWatchPreferencesResponseDto,
  UpdateMedicalWatchPreferencesRequestDto,
} from './dtos/requests/medical-watch-preferences.request.dto';

@ApiTags('medical-watch')
@ApiBearerAuth()
@Controller({ path: 'medical-watch', version: '1' })
export class MedicalWatchController {
  constructor(private readonly medicalWatchService: MedicalWatchService) {}

  @Get()
  getArticles(@Query() query: GetMedicalWatchQueryDto): Promise<MedicalWatchArticleResponseDto[]> {
    return this.medicalWatchService.getArticles(query.specialty, query.limit);
  }

  @Get('preferences')
  getPreferences(@CurrentUser('id') userId: string): Promise<MedicalWatchPreferencesResponseDto> {
    return this.medicalWatchService.getPreferences(userId);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMedicalWatchPreferencesRequestDto,
  ): Promise<MedicalWatchPreferencesResponseDto> {
    return this.medicalWatchService.updatePreferences(userId, dto.digestOptIn);
  }

  @Post('trigger')
  @HttpCode(HttpStatus.NO_CONTENT)
  async triggerManually(): Promise<void> {
    void this.medicalWatchService.runManually();
  }
}
