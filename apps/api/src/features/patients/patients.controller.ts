import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/shared';
import { PatientsService } from './services/patients.service';
import { PatientCreateRequestDto } from './dtos/requests/patient-create.request.dto';
import { PatientUpdateRequestDto } from './dtos/requests/patient-update.request.dto';
import { PatientResponseDto } from './dtos/responses/patient.response.dto';

@ApiTags('patients')
@ApiBearerAuth()
@Controller({ path: 'patients', version: '1' })
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('query') query?: string): Promise<PatientResponseDto[]> {
    return this.patientsService.list(userId, query);
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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.patientsService.delete(userId, id);
  }
}
