import { NotFoundException } from '@nestjs/common';
import { SessionNotFoundException } from './session-not-found.exception';

describe('SessionNotFoundException', () => {
  it('includes the session id in the message', () => {
    const exception = new SessionNotFoundException('recording_123');

    expect(exception).toBeInstanceOf(NotFoundException);
    expect(exception.message).toBe('Session recording_123 introuvable');
  });
});
