import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, RolesGuard, UserRole } from '@app/shared';
import { ExercisesService } from './services/exercises.service';
import { ExerciseCreateRequestDto } from './dtos/requests/exercise-create.request.dto';
import { PatientExerciseCreateRequestDto } from './dtos/requests/patient-exercise-create.request.dto';
import { PatientExerciseUpdateRequestDto } from './dtos/requests/patient-exercise-update.request.dto';
import { ExerciseResponseDto } from './dtos/responses/exercise.response.dto';
import { PatientExerciseResponseDto } from './dtos/responses/patient-exercise.response.dto';

@ApiTags('exercises')
@ApiBearerAuth()
@Roles(UserRole.PRATICIEN)
@UseGuards(RolesGuard)
@Controller({ path: 'exercises', version: '1' })
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('catalog')
  listExercises(@Query('category') category?: string, @Query('query') query?: string): Promise<ExerciseResponseDto[]> {
    return this.exercisesService.listExercises(category, query);
  }

  @Get('catalog/:id')
  getExercise(@Param('id') id: string): Promise<ExerciseResponseDto> {
    return this.exercisesService.getExercise(id);
  }

  @Post('catalog')
  @HttpCode(HttpStatus.CREATED)
  createExercise(@Body() dto: ExerciseCreateRequestDto): Promise<ExerciseResponseDto> {
    return this.exercisesService.createExercise(dto);
  }

  @Put('catalog/:id')
  updateExercise(@Param('id') id: string, @Body() dto: ExerciseCreateRequestDto): Promise<ExerciseResponseDto> {
    return this.exercisesService.updateExercise(id, dto);
  }

  @Delete('catalog/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExercise(@Param('id') id: string): Promise<void> {
    return this.exercisesService.deleteExercise(id);
  }

  @Get('assignments')
  listPatientExercises(@CurrentUser('id') userId: string, @Query('patientId') patientId?: string): Promise<PatientExerciseResponseDto[]> {
    return this.exercisesService.listPatientExercises(userId, patientId);
  }

  @Get('assignments/:id')
  getPatientExercise(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<PatientExerciseResponseDto> {
    return this.exercisesService.getPatientExercise(userId, id);
  }

  @Post('assignments')
  @HttpCode(HttpStatus.CREATED)
  assignExercise(@CurrentUser('id') userId: string, @Body() dto: PatientExerciseCreateRequestDto): Promise<PatientExerciseResponseDto> {
    return this.exercisesService.assignExercise(userId, dto);
  }

  @Put('assignments/:id')
  updatePatientExercise(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: PatientExerciseUpdateRequestDto,
  ): Promise<PatientExerciseResponseDto> {
    return this.exercisesService.updatePatientExercise(userId, id, dto);
  }

  @Delete('assignments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePatientExercise(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.exercisesService.deletePatientExercise(userId, id);
  }
}
