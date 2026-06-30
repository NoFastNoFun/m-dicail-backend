import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/shared';
import { SessionsService } from './services/sessions.service';
import { SessionCreateRequestDto } from './dtos/requests/session-create.request.dto';
import { SessionUpdateRequestDto } from './dtos/requests/session-update.request.dto';
import { SessionPatientUpdateRequestDto } from './dtos/requests/session-patient-update.request.dto';
import { SessionResponseDto } from './dtos/responses/session.response.dto';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller({ version: '1' })
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('recording-sessions')
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: SessionCreateRequestDto): Promise<SessionResponseDto> {
    return this.sessionsService.create(userId, dto);
  }

  @Put('recording-sessions/:id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: SessionUpdateRequestDto): Promise<SessionResponseDto> {
    return this.sessionsService.update(userId, id, dto);
  }

  @Put('recording-sessions/:id/patient')
  associatePatient(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: SessionPatientUpdateRequestDto): Promise<SessionResponseDto> {
    return this.sessionsService.associatePatient(userId, id, dto);
  }

  @Get('recording-sessions/:id')
  getOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<SessionResponseDto> {
    return this.sessionsService.getOne(userId, id);
  }

  @Get('patients/:patientId/recording-sessions')
  listByPatient(@CurrentUser('id') userId: string, @Param('patientId') patientId: string): Promise<SessionResponseDto[]> {
    return this.sessionsService.listByPatient(userId, patientId);
  }
}
