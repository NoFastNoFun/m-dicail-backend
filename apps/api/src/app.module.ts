import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from '@app/shared';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { PatientsModule } from './features/patients/patients.module';
import { AppointmentsModule } from './features/appointments/appointments.module';
import { SessionsModule } from './features/sessions/sessions.module';
import { PubmedModule } from './features/pubmed/pubmed.module';
import { NotesModule } from './features/notes/notes.module';
import { MedicalWatchModule } from './features/medical-watch/medical-watch.module';
import { HealthModule } from './features/health/health.module';
import { DeeplinkModule } from './features/deeplink/deeplink.module';
import { ExercisesModule } from './features/exercises/exercises.module';
import { TelemetryModule } from './features/telemetry/telemetry.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    // Default 60 req/min; auth and deeplink handlers override with a tighter @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    HealthModule,
    DeeplinkModule,
    UsersModule,
    AuthModule,
    PatientsModule,
    AppointmentsModule,
    SessionsModule,
    PubmedModule,
    NotesModule,
    MedicalWatchModule,
    ExercisesModule,
    TelemetryModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
