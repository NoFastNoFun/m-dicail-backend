import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity';
import { PatientExercise } from './entities/patient-exercise.entity';
import { ExerciseRepository } from './repositories/exercise.repository';
import { PatientExerciseRepository } from './repositories/patient-exercise.repository';
import { ExercisesService } from './services/exercises.service';
import { ExercisesController } from './exercises.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, PatientExercise])],
  controllers: [ExercisesController],
  providers: [ExercisesService, ExerciseRepository, PatientExerciseRepository],
  exports: [ExercisesService, ExerciseRepository, PatientExerciseRepository, TypeOrmModule],
})
export class ExercisesModule {}
