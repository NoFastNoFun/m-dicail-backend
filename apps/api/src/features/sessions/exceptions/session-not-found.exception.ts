import { NotFoundException } from '@nestjs/common';

export class SessionNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Session ${id} introuvable`);
  }
}
