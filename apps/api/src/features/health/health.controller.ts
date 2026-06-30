import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '@app/shared';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Public()
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
