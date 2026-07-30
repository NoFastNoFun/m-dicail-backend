import { ApiProperty } from '@nestjs/swagger';
import { Appointment } from '../../entities/appointment.entity';
import { AppointmentStatus } from '../../enums/appointment-status.enum';

export class AppointmentResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare user_id: string;
  @ApiProperty() declare patient_id: string;
  @ApiProperty() declare starts_at: Date;
  @ApiProperty({ nullable: true }) declare ends_at: Date | null;
  @ApiProperty({ enum: AppointmentStatus }) declare status: AppointmentStatus;
  @ApiProperty({ nullable: true }) declare notes: string | null;
  @ApiProperty() declare created_at: Date;
  @ApiProperty() declare updated_at: Date;

  constructor(appointment: Appointment) {
    this.id = appointment.id;
    this.user_id = appointment.userId;
    this.patient_id = appointment.patientId;
    this.starts_at = appointment.startsAt;
    this.ends_at = appointment.endsAt;
    this.status = appointment.status;
    this.notes = appointment.notes;
    this.created_at = appointment.createdAt;
    this.updated_at = appointment.updatedAt;
  }
}
