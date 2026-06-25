import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  declare SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  declare DATABASE_URL: string;

  @IsString()
  @IsOptional()
  declare NCBI_API_KEY?: string;

  @IsString()
  @IsOptional()
  declare CORS_ORIGINS?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validated;
}
