import { Controller, Get, Query, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '@app/shared';
import { DeeplinkService } from './deeplink.service';

@Controller({ version: VERSION_NEUTRAL })
export class DeeplinkController {
  constructor(private readonly deeplinkService: DeeplinkService) {}

  @Public()
  @Get('reset-password')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  resetPassword(@Query('token') token: string | undefined, @Res() res: Response): void {
    const html = this.deeplinkService.buildBounceHtml('reset-password', token);
    res.type('html').send(html);
  }

  @Public()
  @Get('recovery')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  recovery(@Query('token') token: string | undefined, @Res() res: Response): void {
    const html = this.deeplinkService.buildBounceHtml('recovery', token);
    res.type('html').send(html);
  }
}
