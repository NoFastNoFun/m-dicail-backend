import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsersService } from '@features/users/services/users.service';
import { PatientsService } from '@features/patients/services/patients.service';
import { User } from '@features/users/entities/user.entity';
import { MailService } from '../../mail/services/mail.service';
import { buildPasswordResetEmail } from '../../mail/templates/password-reset.template';
import { buildAccountRecoveryEmail } from '../../mail/templates/account-recovery.template';
import { RegisterRequestDto } from '../dtos/requests/register.request.dto';
import { LoginRequestDto } from '../dtos/requests/login.request.dto';
import { RefreshRequestDto } from '../dtos/requests/refresh.request.dto';
import { CreatePatientAccountRequestDto } from '../dtos/requests/create-patient-account.request.dto';
import { AuthResponseDto, CreatePatientResponseDto, LoginResponseDto, MfaRequiredResponseDto, UserResponseDto } from '../dtos/responses/auth.response.dto';
import { AuthTokenType } from '../enums/auth-token-type.enum';
import { MfaMethod } from '../enums/mfa-method.enum';
import { timingSafeStringEqual } from '../utils/timing-safe-equal.util';
import { AuthTokenService } from './auth-token.service';
import { MfaService } from './mfa.service';
import { PasskeysService } from './passkeys.service';

interface MfaJwtPayload {
  sub: string;
  purpose: 'mfa';
}

const DUMMY_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=4$8aGOKFdYyhteMkxdv4E7zQ$tbpd2QVmEbOAL62yYfcZbtjJUQvvUzqCoOX/J2A2pcI';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly authTokenService: AuthTokenService,
    private readonly mfaService: MfaService,
    private readonly passkeysService: PasskeysService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    await this.assertRegistrationAllowed(dto.inviteCode);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email deja utilise');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.create(dto.email, hashedPassword, dto.fullName);

    return this.issueTokens(user);
  }

  async createPatientAccount(praticienId: string, dto: CreatePatientAccountRequestDto): Promise<CreatePatientResponseDto> {
    await this.patientsService.getOne(praticienId, dto.patientId);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email deja utilise');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.createPatientAccount(dto.email, hashedPassword, dto.patientId, dto.fullName);

    return { user: await this.toUserResponse(user) };
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    const hash = user?.hashedPassword ?? DUMMY_PASSWORD_HASH;
    const valid = await argon2.verify(hash, dto.password).catch(() => false);
    if (!user || !valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    if (user.mfaEnabled) {
      return this.buildMfaChallenge(user.id);
    }

    return this.issueTokens(user);
  }

  async verifyMfa(mfaToken: string, code: string): Promise<AuthResponseDto> {
    const userId = this.verifyMfaToken(mfaToken);
    const verified = await this.mfaService.verifyTotpOrRecovery(userId, code);
    if (!verified) throw new UnauthorizedException('Code MFA invalide');

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    return this.issueTokens(user);
  }

  async completePasskeyLogin(userId: string): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return this.issueTokens(user);
  }

  async refresh(dto: RefreshRequestDto): Promise<AuthResponseDto> {
    const separatorIndex = dto.refreshToken.indexOf('.');
    if (separatorIndex === -1) throw new UnauthorizedException('Refresh token invalide ou expire');

    const userId = dto.refreshToken.slice(0, separatorIndex);
    const secret = dto.refreshToken.slice(separatorIndex + 1);

    const user = await this.usersService.findById(userId);
    if (!user?.hashedRefreshToken || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token invalide ou expire');
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token invalide ou expire');
    }

    const valid = await argon2.verify(user.hashedRefreshToken, secret);
    if (!valid) throw new UnauthorizedException('Refresh token invalide ou expire');

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null, null);
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return this.toUserResponse(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const { token } = await this.authTokenService.createToken(user.id, AuthTokenType.PASSWORD_RESET);
    const resetUrl = `${this.mailService.getPublicAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const emailContent = buildPasswordResetEmail({ resetUrl });
    await this.mailService.sendMail(user.email, emailContent.subject, emailContent.html);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const userId = await this.authTokenService.consumeToken(token, AuthTokenType.PASSWORD_RESET);
    const hashedPassword = await argon2.hash(password);
    await this.usersService.updatePassword(userId, hashedPassword);
    await this.usersService.updateRefreshToken(userId, null, null);
  }

  async requestAccountRecovery(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const { token } = await this.authTokenService.createToken(user.id, AuthTokenType.ACCOUNT_RECOVERY);
    const recoveryUrl = `${this.mailService.getPublicAppUrl()}/recovery?token=${encodeURIComponent(token)}`;
    const emailContent = buildAccountRecoveryEmail({ recoveryUrl });
    await this.mailService.sendMail(user.email, emailContent.subject, emailContent.html);
  }

  async confirmAccountRecovery(token: string, password: string): Promise<void> {
    const userId = await this.authTokenService.peekToken(token, AuthTokenType.ACCOUNT_RECOVERY);
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    const valid = await argon2.verify(user.hashedPassword, password).catch(() => false);
    if (!valid) throw new UnauthorizedException('Mot de passe incorrect');

    await this.authTokenService.consumeToken(token, AuthTokenType.ACCOUNT_RECOVERY);
    await this.mfaService.disableMfaForRecovery(userId);
  }

  verifyMfaToken(mfaToken: string): string {
    try {
      const payload = this.jwtService.verify<MfaJwtPayload>(mfaToken);
      if (payload.purpose !== 'mfa' || !payload.sub) {
        throw new BadRequestException('Jeton MFA invalide');
      }
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Jeton MFA invalide ou expire');
    }
  }

  private async assertRegistrationAllowed(inviteCode?: string): Promise<void> {
    const expectedCode = this.configService.get<string>('REGISTRATION_INVITE_CODE');
    if (expectedCode) {
      if (!inviteCode || !timingSafeStringEqual(inviteCode, expectedCode)) {
        throw new ForbiddenException("Code d'inscription invalide");
      }
      return;
    }

    // TODO: fix email sending before re-enabling the single-praticien limit below
    // const praticienCount = await this.usersService.countByRole(UserRole.PRATICIEN);
    // if (praticienCount > 0) {
    //   throw new ForbiddenException('Inscription fermee');
    // }
  }

  private async buildMfaChallenge(userId: string): Promise<MfaRequiredResponseDto> {
    const methods: MfaMethod[] = [MfaMethod.TOTP, MfaMethod.RECOVERY_CODE];
    if (await this.passkeysService.hasPasskeys(userId)) {
      methods.push(MfaMethod.PASSKEY);
    }

    const mfaToken = this.jwtService.sign({ sub: userId, purpose: 'mfa' }, { expiresIn: '5m' });
    return { status: 'mfa_required', mfaToken, methods };
  }

  private async issueTokens(user: User): Promise<AuthResponseDto> {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      purpose: 'access',
    });

    const secret = randomBytes(64).toString('hex');
    const hashedRefreshToken = await argon2.hash(secret);

    const ttlDays = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const refreshTokenExpiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken, refreshTokenExpiresAt);

    return {
      status: 'authenticated',
      user: await this.toUserResponse(user),
      accessToken,
      refreshToken: `${user.id}.${secret}`,
      tokenType: 'bearer',
    };
  }

  private async toUserResponse(user: User): Promise<UserResponseDto> {
    const hasPasskeys = await this.passkeysService.hasPasskeys(user.id);
    return new UserResponseDto(user, hasPasskeys);
  }
}
