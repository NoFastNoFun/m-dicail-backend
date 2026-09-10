import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/shared';
import { TelemetryService } from './services/telemetry.service';
import { RecordTelemetryRequestDto } from './dtos/requests/record-telemetry.request.dto';

@ApiTags('telemetry')
@ApiBearerAuth()
@Controller({ path: 'telemetry', version: '1' })
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('metrics')
  @HttpCode(HttpStatus.NO_CONTENT)
  record(@CurrentUser('id') userId: string, @Body() dto: RecordTelemetryRequestDto): Promise<void> {
    return this.telemetryService.record(userId, dto);
  }
}
