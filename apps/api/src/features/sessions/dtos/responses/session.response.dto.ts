import { ApiProperty } from '@nestjs/swagger';
import { RecordingSession, SessionPathology, SoapNote } from '../../entities/recording-session.entity';

export class SessionResponseDto {
  @ApiProperty() declare id: string;
  @ApiProperty() declare user_id: string;
  @ApiProperty({ nullable: true }) declare patient_id: string | null;
  @ApiProperty({ nullable: true }) declare started_at: Date | null;
  @ApiProperty({ nullable: true }) declare ended_at: Date | null;
  @ApiProperty() declare status: string;
  @ApiProperty({ nullable: true }) declare transcript: string | null;
  @ApiProperty({ nullable: true }) declare soap_note: SoapNote | null;
  @ApiProperty({ nullable: true }) declare summary: string | null;
  @ApiProperty({ nullable: true }) declare template_id: string | null;
  @ApiProperty({ nullable: true }) declare template_name: string | null;
  @ApiProperty({ nullable: true, type: 'array' })
  declare pathologies: SessionPathology[] | null;
  @ApiProperty() declare created_at: Date;
  @ApiProperty() declare updated_at: Date;

  constructor(session: RecordingSession) {
    this.id = session.id;
    this.user_id = session.userId;
    this.patient_id = session.patientId;
    this.started_at = session.startedAt;
    this.ended_at = session.endedAt;
    this.status = session.status;
    this.transcript = session.transcript;
    this.soap_note = session.soapNote;
    this.summary = session.summary;
    this.template_id = session.templateId;
    this.template_name = session.templateName;
    this.pathologies = session.pathologies;
    this.created_at = session.createdAt;
    this.updated_at = session.updatedAt;
  }
}
