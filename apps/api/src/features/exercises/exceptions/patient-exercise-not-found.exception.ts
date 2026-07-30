import { NotFoundException } from '@nestjs/common';

export class PatientExerciseNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Patient exercise assignment with id "${id}" not found`);
  }
}
