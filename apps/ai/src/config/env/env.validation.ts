import { plainToInstance } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65000)
  declare AI_PORT: number;

  @IsString()
  @IsNotEmpty()
  declare SECRET_KEY: string;

  @IsString()
  @IsNotEmpty()
  declare GROQ_API_KEY: string;

  @IsOptional()
  @IsString()
  declare GROQ_BASE_URL?: string;

  @IsOptional()
  @IsString()
  declare GROQ_TRANSCRIPTION_MODEL?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  declare GROQ_TIMEOUT_MS?: number;
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
