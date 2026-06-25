import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SessionPatientUpdateRequestDto {
  @ApiProperty()
  @IsString()
  declare patient_id: string;
}
