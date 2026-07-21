import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65000)
  declare PORT: number;

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
  @IsNotEmpty()
  declare ACCESS_TOKEN_TTL: string;

  @IsInt()
  @Min(1)
  declare REFRESH_TOKEN_TTL_DAYS: number;
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
