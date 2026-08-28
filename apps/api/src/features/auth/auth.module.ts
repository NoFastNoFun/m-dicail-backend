import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@features/users/users.module';
import { PatientsModule } from '@features/patients/patients.module';
import { MailModule } from '../mail/mail.module';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthToken } from './entities/auth-token.entity';
import { MfaRecoveryCode } from './entities/mfa-recovery-code.entity';
import { WebAuthnCredential } from './entities/webauthn-credential.entity';
import { WebAuthnChallenge } from './entities/webauthn-challenge.entity';
import { AuthTokenRepository } from './repositories/auth-token.repository';
import { MfaRecoveryCodeRepository } from './repositories/mfa-recovery-code.repository';
import { WebAuthnCredentialRepository } from './repositories/webauthn-credential.repository';
import { WebAuthnChallengeRepository } from './repositories/webauthn-challenge.repository';
import { AuthTokenService } from './services/auth-token.service';
import { MfaService } from './services/mfa.service';
import { PasskeysService } from './services/passkeys.service';

@Module({
  imports: [
    UsersModule,
    PatientsModule,
    MailModule,
    PassportModule,
    TypeOrmModule.forFeature([AuthToken, MfaRecoveryCode, WebAuthnCredential, WebAuthnChallenge]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('SECRET_KEY'),
        signOptions: { expiresIn: config.getOrThrow<string>('ACCESS_TOKEN_TTL') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    MfaService,
    PasskeysService,
    AuthTokenRepository,
    MfaRecoveryCodeRepository,
    WebAuthnCredentialRepository,
    WebAuthnChallengeRepository,
    JwtStrategy,
  ],
})
export class AuthModule {}
