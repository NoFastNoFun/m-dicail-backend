import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from '@features/patients/patients.module';
import { AnonymizationModule } from '@features/notes/anonymization.module';
import { RecordingSession } from './entities/recording-session.entity';
import { RecordingSessionRepository } from './repositories/recording-session.repository';
import { SessionsService } from './services/sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecordingSession]), PatientsModule, AnonymizationModule],
  controllers: [SessionsController],
  providers: [SessionsService, RecordingSessionRepository],
})
export class SessionsModule {}
