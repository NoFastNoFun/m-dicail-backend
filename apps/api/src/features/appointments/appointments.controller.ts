import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/shared';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentCreateRequestDto } from './dtos/requests/appointment-create.request.dto';
import { AppointmentUpdateRequestDto } from './dtos/requests/appointment-update.request.dto';
import { AppointmentResponseDto } from './dtos/responses/appointment.response.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query('from') from?: string, @Query('to') to?: string): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.list(userId, from, to);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: AppointmentCreateRequestDto): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(userId, dto);
  }

  @Get(':id')
  getOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<AppointmentResponseDto> {
    return this.appointmentsService.getOne(userId, id);
  }

  @Put(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: AppointmentUpdateRequestDto): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.appointmentsService.delete(userId, id);
  }
}
