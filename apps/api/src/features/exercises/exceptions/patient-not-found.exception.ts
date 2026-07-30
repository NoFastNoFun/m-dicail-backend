import { NotFoundException } from '@nestjs/common';

export class PatientNotFoundException extends NotFoundException {
  constructor(patientId: string) {
    super(`Patient with ID ${patientId} not found or does not belong to this practitioner`);
  }
}
