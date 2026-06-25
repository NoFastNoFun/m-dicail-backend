import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from '@app/shared';
import { AuthModule } from './features/auth/auth.module';
import { UsersModule } from './features/users/users.module';
import { PatientsModule } from './features/patients/patients.module';
import { SessionsModule } from './features/sessions/sessions.module';
import { PubmedModule } from './features/pubmed/pubmed.module';
import { NotesModule } from './features/notes/notes.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    UsersModule,
    AuthModule,
    PatientsModule,
    SessionsModule,
    PubmedModule,
    NotesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
