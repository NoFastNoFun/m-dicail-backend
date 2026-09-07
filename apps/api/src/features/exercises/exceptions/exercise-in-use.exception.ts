import { ConflictException } from '@nestjs/common';

export class ExerciseInUseException extends ConflictException {
  constructor(id: string) {
    super(`Exercise with id "${id}" is still assigned to one or more patients and cannot be deleted`);
  }
}
