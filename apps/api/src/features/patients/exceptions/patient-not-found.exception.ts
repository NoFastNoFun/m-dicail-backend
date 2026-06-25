import { NotFoundException } from '@nestjs/common';

export class PatientNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Patient ${id} introuvable`);
  }
}
