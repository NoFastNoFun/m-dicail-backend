import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '../../entities/patient.entity';

export class PatientResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare user_id: string;
  @ApiProperty() declare mrn: string;
  @ApiProperty() declare first_name: string;
  @ApiProperty() declare last_name: string;
  @ApiProperty({ nullable: true }) declare birth_date: string | null;
  @ApiProperty({ nullable: true }) declare sex: string | null;
  @ApiProperty({ nullable: true }) declare contact: Record<string, unknown> | null;
  @ApiProperty({ nullable: true }) declare notes: string | null;
  @ApiProperty({ nullable: true }) declare patient_metadata: Record<string, unknown> | null;
  @ApiProperty({ nullable: true }) declare archived_at: Date | null;
  @ApiProperty() declare created_at: Date;
  @ApiProperty() declare updated_at: Date;

  constructor(patient: Patient) {
    this.id = patient.id;
    this.user_id = patient.userId;
    this.mrn = patient.mrn;
    this.first_name = patient.firstName;
    this.last_name = patient.lastName;
    this.birth_date = patient.birthDate;
    this.sex = patient.sex;
    this.contact = patient.contact as Record<string, unknown> | null;
    this.notes = patient.notes;
    this.patient_metadata = patient.patientMetadata as Record<string, unknown> | null;
    this.archived_at = patient.archivedAt;
    this.created_at = patient.createdAt;
    this.updated_at = patient.updatedAt;
  }
}
