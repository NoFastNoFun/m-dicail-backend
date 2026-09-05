import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Public } from '@app/shared';

export type HealthResponse = {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
};

function readAppVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  private readonly version = readAppVersion();
  private readonly startedAt = Date.now();

  @Public()
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      version: this.version,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
