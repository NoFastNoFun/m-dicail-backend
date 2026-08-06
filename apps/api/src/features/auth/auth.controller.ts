import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, CurrentUser, Roles, RolesGuard, UserRole } from '@app/shared';
import { AuthService } from './services/auth.service';
import { RegisterRequestDto } from './dtos/requests/register.request.dto';
import { LoginRequestDto } from './dtos/requests/login.request.dto';
import { RefreshRequestDto } from './dtos/requests/refresh.request.dto';
import { CreatePatientAccountRequestDto } from './dtos/requests/create-patient-account.request.dto';
import { AuthResponseDto, UserResponseDto, CreatePatientResponseDto } from './dtos/responses/auth.response.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshRequestDto): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
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
  createPatientAccount(@Body() dto: CreatePatientAccountRequestDto): Promise<CreatePatientResponseDto> {
    return this.authService.createPatientAccount(dto);
  }
}
