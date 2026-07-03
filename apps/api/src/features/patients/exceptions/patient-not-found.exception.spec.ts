import { NotFoundException } from '@nestjs/common';
import { PatientNotFoundException } from './patient-not-found.exception';

describe('PatientNotFoundException', () => {
  it('includes the patient id in the message', () => {
    const exception = new PatientNotFoundException('patient_123');

    expect(exception).toBeInstanceOf(NotFoundException);
    expect(exception.message).toBe('Patient patient_123 introuvable');
  });
});
