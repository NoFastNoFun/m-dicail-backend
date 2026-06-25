import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingSession } from './entities/recording-session.entity';
import { RecordingSessionRepository } from './repositories/recording-session.repository';
import { SessionsService } from './services/sessions.service';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RecordingSession])],
  controllers: [SessionsController],
  providers: [SessionsService, RecordingSessionRepository],
})
export class SessionsModule {}
