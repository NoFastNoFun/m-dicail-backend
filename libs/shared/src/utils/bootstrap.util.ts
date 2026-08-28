import helmet from 'helmet';
import { INestApplication } from '@nestjs/common';

export function resolveCorsOrigins(): string[] | false {
  const raw = process.env.CORS_ORIGINS || process.env.APP_PUBLIC_URL || '';
  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : false;
}

export function shouldEnableSwagger(): boolean {
  if (process.env.ENABLE_SWAGGER === 'true') return true;
  if (process.env.ENABLE_SWAGGER === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export function applySecurityMiddleware(app: INestApplication): void {
  app.use(helmet());
  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
  });
}
