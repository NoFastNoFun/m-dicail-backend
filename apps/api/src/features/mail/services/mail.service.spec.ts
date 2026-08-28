import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue(undefined) })),
}));

import * as nodemailer from 'nodemailer';

describe('MailService', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('skips send in non-production when SMTP is incomplete', async () => {
    process.env.NODE_ENV = 'test';
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    const service = new MailService({ get: () => undefined } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).resolves.toBeUndefined();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('throws in production when SMTP is incomplete', async () => {
    process.env.NODE_ENV = 'production';
    const service = new MailService({ get: () => undefined } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).rejects.toThrow(ServiceUnavailableException);
  });

  it('sends mail when SMTP is configured', async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const service = new MailService({
      get: (key: string) => {
        const values: Record<string, string | number> = {
          SMTP_HOST: '127.0.0.1',
          SMTP_PORT: 1025,
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          SMTP_FROM: 'from@test.com',
          APP_PUBLIC_URL: 'http://localhost:3000',
        };
        return values[key];
      },
    } as unknown as ConfigService);

    await service.sendMail('a@b.com', 'Subject', '<p>Hi</p>');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        subject: 'Subject',
        from: 'from@test.com',
      }),
    );
    expect(service.getPublicAppUrl()).toBe('http://localhost:3000');
  });
});
