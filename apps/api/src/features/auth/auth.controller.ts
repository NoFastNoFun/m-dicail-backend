import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public, CurrentUser, Roles, RolesGuard, UserRole } from '@app/shared';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server';
import { AuthService } from './services/auth.service';
import { MfaService } from './services/mfa.service';
import { PasskeysService } from './services/passkeys.service';
import { RegisterRequestDto } from './dtos/requests/register.request.dto';
import { LoginRequestDto } from './dtos/requests/login.request.dto';
import { RefreshRequestDto } from './dtos/requests/refresh.request.dto';
import { CreatePatientAccountRequestDto } from './dtos/requests/create-patient-account.request.dto';
import { ForgotPasswordRequestDto, ResetPasswordRequestDto } from './dtos/requests/password-reset.request.dto';
import { AccountRecoveryConfirmRequestDto, AccountRecoveryRequestDto } from './dtos/requests/account-recovery.request.dto';
import { MfaConfirmRequestDto, MfaVerifyRequestDto } from './dtos/requests/mfa.request.dto';
import {
  PasskeyAuthenticateOptionsRequestDto,
  PasskeyAuthenticateVerifyRequestDto,
  PasskeyRegisterVerifyRequestDto,
} from './dtos/requests/passkey.request.dto';
import { ChangeEmailRequestDto, ChangePasswordRequestDto, UpdateProfileRequestDto } from './dtos/requests/profile.request.dto';
import {
  AuthResponseDto,
  CreatePatientResponseDto,
  LoginResponseDto,
  MfaConfirmResponseDto,
  MfaEnrollResponseDto,
  PasskeyCredentialResponseDto,
  UserResponseDto,
} from './dtos/responses/auth.response.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
    private readonly passkeysService: PasskeysService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  refresh(@Body() dto: RefreshRequestDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  forgotPassword(@Body() dto: ForgotPasswordRequestDto): Promise<void> {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<void> {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Post('recovery/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  requestRecovery(@Body() dto: AccountRecoveryRequestDto): Promise<void> {
    return this.authService.requestAccountRecovery(dto.email);
  }

  @Public()
  @Post('recovery/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  confirmRecovery(@Body() dto: AccountRecoveryConfirmRequestDto): Promise<void> {
    return this.authService.confirmAccountRecovery(dto.token, dto.password);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  verifyMfa(@Body() dto: MfaVerifyRequestDto): Promise<AuthResponseDto> {
    return this.authService.verifyMfa(dto.mfaToken, dto.code);
  }

  @ApiBearerAuth()
  @Post('mfa/enroll')
  enrollMfa(@CurrentUser('id') userId: string): Promise<MfaEnrollResponseDto> {
    return this.mfaService.enroll(userId);
  }

  @ApiBearerAuth()
  @Post('mfa/confirm')
  confirmMfa(@CurrentUser('id') userId: string, @Body() dto: MfaConfirmRequestDto): Promise<MfaConfirmResponseDto> {
    return this.mfaService.confirm(userId, dto.code);
  }

  @ApiBearerAuth()
  @Post('mfa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  disableMfa(@CurrentUser('id') userId: string, @Body() dto: MfaConfirmRequestDto): Promise<void> {
    return this.mfaService.disable(userId, dto.code);
  }

  @ApiBearerAuth()
  @Post('passkeys/register/options')
  passkeyRegisterOptions(@CurrentUser('id') userId: string) {
    return this.passkeysService.getRegistrationOptions(userId);
  }

  @ApiBearerAuth()
  @Post('passkeys/register/verify')
  @HttpCode(HttpStatus.NO_CONTENT)
  passkeyRegisterVerify(@CurrentUser('id') userId: string, @Body() dto: PasskeyRegisterVerifyRequestDto): Promise<void> {
    return this.passkeysService.verifyRegistration(userId, dto.response as unknown as RegistrationResponseJSON, dto.deviceName);
  }

  @Public()
  @Post('passkeys/authenticate/options')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  passkeyAuthenticateOptions(@Body() dto: PasskeyAuthenticateOptionsRequestDto) {
    const mfaUserId = dto.mfaToken ? this.authService.verifyMfaToken(dto.mfaToken) : undefined;
    return this.passkeysService.getAuthenticationOptions(dto.email, mfaUserId);
  }

  @Public()
  @Post('passkeys/authenticate/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async passkeyAuthenticateVerify(@Body() dto: PasskeyAuthenticateVerifyRequestDto): Promise<AuthResponseDto> {
    const mfaUserId = dto.mfaToken ? this.authService.verifyMfaToken(dto.mfaToken) : undefined;
    const userId = await this.passkeysService.verifyAuthentication(dto.response as unknown as AuthenticationResponseJSON, dto.email, mfaUserId);
    return this.authService.completePasskeyLogin(userId);
  }

  @ApiBearerAuth()
  @Get('passkeys')
  listPasskeys(@CurrentUser('id') userId: string): Promise<PasskeyCredentialResponseDto[]> {
    return this.passkeysService.listCredentials(userId);
  }

  @ApiBearerAuth()
  @Delete('passkeys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePasskey(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.passkeysService.deleteCredential(userId, id);
  }

  @ApiBearerAuth()
  @Patch('profile')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileRequestDto): Promise<UserResponseDto> {
    return this.authService.updateProfile(userId, dto);
  }

  @ApiBearerAuth()
  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordRequestDto): Promise<AuthResponseDto> {
    return this.authService.changePassword(userId, dto);
  }

  @ApiBearerAuth()
  @Post('profile/change-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  changeEmail(@CurrentUser('id') userId: string, @Body() dto: ChangeEmailRequestDto): Promise<AuthResponseDto> {
    return this.authService.changeEmail(userId, dto);
  }

  @ApiBearerAuth()
  @Post('profile/reauth/passkey/options')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  profilePasskeyReauthOptions(@CurrentUser('id') userId: string) {
    return this.passkeysService.getAuthenticationOptions(undefined, userId);
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser('id') userId: string): Promise<void> {
    return this.authService.logout(userId);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser('id') userId: string): Promise<UserResponseDto> {
    return this.authService.me(userId);
  }

  @ApiBearerAuth()
  @Roles(UserRole.PRATICIEN)
  @UseGuards(RolesGuard)
  @Post('patients')
  createPatientAccount(@CurrentUser('id') userId: string, @Body() dto: CreatePatientAccountRequestDto): Promise<CreatePatientResponseDto> {
    return this.authService.createPatientAccount(userId, dto);
  }
}
