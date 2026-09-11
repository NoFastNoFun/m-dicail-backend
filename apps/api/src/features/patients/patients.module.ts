import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingSession } from '@features/sessions/entities/recording-session.entity';
import { RecordingSessionRepository } from '@features/sessions/repositories/recording-session.repository';
import { Patient } from './entities/patient.entity';
import { PatientRepository } from './repositories/patient.repository';
import { PatientsService } from './services/patients.service';
import { PatientsController } from './patients.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, RecordingSession])],
  controllers: [PatientsController],
  providers: [PatientsService, PatientRepository, RecordingSessionRepository],
  exports: [PatientsService, PatientRepository, TypeOrmModule],
})
export class PatientsModule {}
