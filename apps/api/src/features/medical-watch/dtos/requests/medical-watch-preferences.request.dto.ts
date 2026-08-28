import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MedicalWatchPreferencesResponseDto {
  @ApiProperty() declare digestOptIn: boolean;
}

export class UpdateMedicalWatchPreferencesRequestDto {
  @ApiProperty()
  @IsBoolean()
  declare digestOptIn: boolean;
}
