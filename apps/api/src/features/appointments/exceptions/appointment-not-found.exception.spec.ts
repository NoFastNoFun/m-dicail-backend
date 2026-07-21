import { NotFoundException } from '@nestjs/common';
import { AppointmentNotFoundException } from './appointment-not-found.exception';

describe('AppointmentNotFoundException', () => {
  it('includes the appointment id in the message', () => {
    const exception = new AppointmentNotFoundException('appointment_123');

    expect(exception).toBeInstanceOf(NotFoundException);
    expect(exception.message).toBe('Rendez-vous appointment_123 introuvable');
  });
});
