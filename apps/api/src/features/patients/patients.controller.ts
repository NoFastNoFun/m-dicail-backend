import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, RolesGuard, UserRole } from '@app/shared';
import { PatientsService } from './services/patients.service';
import { PatientCreateRequestDto } from './dtos/requests/patient-create.request.dto';
import { PatientUpdateRequestDto } from './dtos/requests/patient-update.request.dto';
import { PatientResponseDto } from './dtos/responses/patient.response.dto';

@ApiTags('patients')
@ApiBearerAuth()
@Roles(UserRole.PRATICIEN)
@UseGuards(RolesGuard)
@Controller({ path: 'patients', version: '1' })
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('query') query?: string, @Query('archived') archived?: string): Promise<PatientResponseDto[]> {
    const archivedOnly = archived === 'true' || archived === '1';
    return this.patientsService.list(userId, query, archivedOnly);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: PatientCreateRequestDto): Promise<PatientResponseDto> {
    return this.patientsService.create(userId, dto);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.getOne(userId, id);
  }

  @Put(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: PatientUpdateRequestDto): Promise<PatientResponseDto> {
    return this.patientsService.update(userId, id, dto);
  }

  @Post(':id/archive')
  archive(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.archive(userId, id);
  }

  @Post(':id/unarchive')
  unarchive(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.unarchive(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.patientsService.delete(userId, id);
  }
}
