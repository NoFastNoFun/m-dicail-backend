import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, MinLength, validateSync } from 'class-validator';

const PRODUCTION_REQUIRED_KEYS = ['APP_PUBLIC_URL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'WEBAUTHN_RP_ID', 'WEBAUTHN_ORIGIN'] as const;

class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65000)
  declare PORT: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  declare SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  declare DATABASE_URL: string;

  @IsString()
  @IsOptional()
  declare NCBI_API_KEY?: string;

  @IsString()
  @IsOptional()
  declare NCBI_EMAIL?: string;

  @IsString()
  @IsNotEmpty()
  declare ACCESS_TOKEN_TTL: string;

  @IsInt()
  @Min(1)
  declare REFRESH_TOKEN_TTL_DAYS: number;

  @IsString()
  @IsOptional()
  declare SMTP_HOST?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(65000)
  declare SMTP_PORT?: number;

  @IsString()
  @IsOptional()
  declare SMTP_USER?: string;

  @IsString()
  @IsOptional()
  declare SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  declare SMTP_FROM?: string;

  @IsString()
  @IsOptional()
  declare MAIL_SKIP?: string;

  @IsString()
  @IsOptional()
  declare APP_PUBLIC_URL?: string;

  @IsString()
  @IsOptional()
  declare CORS_ORIGINS?: string;

  @IsString()
  @IsOptional()
  declare REGISTRATION_INVITE_CODE?: string;

  @IsString()
  @IsOptional()
  declare ENABLE_SWAGGER?: string;

  @IsString()
  @IsOptional()
  declare WEBAUTHN_RP_ID?: string;

  @IsString()
  @IsOptional()
  declare WEBAUTHN_RP_NAME?: string;

  @IsString()
  @IsOptional()
  declare WEBAUTHN_ORIGIN?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  if (!validated.SMTP_FROM && validated.SMTP_USER) {
    validated.SMTP_FROM = validated.SMTP_USER;
  }

  if (process.env.NODE_ENV === 'production') {
    const missing = PRODUCTION_REQUIRED_KEYS.filter((key) => {
      const value = validated[key];
      return value === undefined || value === null || value === '';
    });
    if (missing.length > 0) {
      throw new Error(`Production env missing: ${missing.join(', ')}`);
    }
  }

  return validated;
}
