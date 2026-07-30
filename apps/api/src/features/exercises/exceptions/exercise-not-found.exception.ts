import { NotFoundException } from '@nestjs/common';

export class ExerciseNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Exercise with id "${id}" not found`);
  }
}
