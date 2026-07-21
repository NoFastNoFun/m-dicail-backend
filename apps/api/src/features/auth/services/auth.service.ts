import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '@features/users/services/users.service';
import { PatientsService } from '@features/patients/services/patients.service';
import { RegisterRequestDto } from '../dtos/requests/register.request.dto';
import { LoginRequestDto } from '../dtos/requests/login.request.dto';
import { CreatePatientAccountRequestDto } from '../dtos/requests/create-patient-account.request.dto';
import { CreatePatientResponseDto, LoginResponseDto, RegisterResponseDto, UserResponseDto } from '../dtos/responses/auth.response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly patientsService: PatientsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.create(dto.email, hashedPassword, dto.fullName);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: new UserResponseDto(user), accessToken, tokenType: 'bearer' };
  }

  async createPatientAccount(dto: CreatePatientAccountRequestDto): Promise<CreatePatientResponseDto> {
    const patientExists = await this.patientsService.findById(dto.patientId);
    if (!patientExists) throw new NotFoundException(`Patient ${dto.patientId} introuvable`);

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hashedPassword = await argon2.hash(dto.password);
    const user = await this.usersService.createPatientAccount(dto.email, hashedPassword, dto.patientId, dto.fullName);

    return { user: new UserResponseDto(user) };
  }

  async login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const valid = await argon2.verify(user.hashedPassword, dto.password);
    if (!valid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: new UserResponseDto(user), accessToken, tokenType: 'bearer' };
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return new UserResponseDto(user);
  }
}
