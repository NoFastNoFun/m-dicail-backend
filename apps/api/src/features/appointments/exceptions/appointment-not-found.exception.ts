import { NotFoundException } from '@nestjs/common';

export class AppointmentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Rendez-vous ${id} introuvable`);
  }
}
