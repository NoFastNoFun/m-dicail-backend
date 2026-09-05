import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: jest.fn().mockResolvedValue(undefined) })),
}));

import * as nodemailer from 'nodemailer';

describe('MailService', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalMailSkip = process.env.MAIL_SKIP;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalMailSkip === undefined) {
      delete process.env.MAIL_SKIP;
    } else {
      process.env.MAIL_SKIP = originalMailSkip;
    }
    jest.restoreAllMocks();
  });

  it('skips send in test when SMTP is incomplete', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.MAIL_SKIP;
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    const service = new MailService({ get: () => undefined } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).resolves.toBeUndefined();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
  });

  it('skips send when MAIL_SKIP is set outside production', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MAIL_SKIP = 'true';
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    const service = new MailService({ get: () => undefined } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).resolves.toBeUndefined();
  });

  it('throws in development when SMTP is incomplete', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.MAIL_SKIP;
    const service = new MailService({ get: () => undefined } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws in production when SMTP is incomplete', async () => {
    process.env.NODE_ENV = 'production';
    process.env.MAIL_SKIP = 'true';
    const service = new MailService({ get: () => undefined } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).rejects.toThrow(ServiceUnavailableException);
  });

  it('sends mail when SMTP is configured', async () => {
    const sendMail = jest.fn().mockResolvedValue({ accepted: ['a@b.com'], rejected: [] });
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
    expect(service.getDeeplinkScheme()).toBe('medicail');
  });

  it('reads APP_DEEPLINK_SCHEME when set', () => {
    process.env.NODE_ENV = 'test';
    const service = new MailService({
      get: (key: string) => {
        if (key === 'APP_DEEPLINK_SCHEME') return 'medicail-dev';
        return undefined;
      },
    } as unknown as ConfigService);

    expect(service.getDeeplinkScheme()).toBe('medicail-dev');
  });

  it('uses SMTP_USER as from when SMTP_FROM is empty', async () => {
    const sendMail = jest.fn().mockResolvedValue({ accepted: ['a@b.com'] });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const service = new MailService({
      get: (key: string) => {
        const values: Record<string, string | number> = {
          SMTP_HOST: 'smtp.proton.me',
          SMTP_PORT: 587,
          SMTP_USER: 'user@example.com',
          SMTP_PASS: 'token',
          SMTP_FROM: '  ',
        };
        return values[key];
      },
    } as unknown as ConfigService);

    await service.sendMail('a@b.com', 'Subject', '<p>Hi</p>');

    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: 'user@example.com' }));
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
        family: 4,
      }),
    );
  });

  it('throws when SMTP rejects the recipient', async () => {
    const sendMail = jest.fn().mockResolvedValue({ accepted: [], rejected: ['a@b.com'] });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const service = new MailService({
      get: (key: string) => {
        const values: Record<string, string | number> = {
          SMTP_HOST: '127.0.0.1',
          SMTP_PORT: 587,
          SMTP_USER: 'user',
          SMTP_PASS: 'pass',
          SMTP_FROM: 'from@test.com',
        };
        return values[key];
      },
    } as unknown as ConfigService);

    await expect(service.sendMail('a@b.com', 'Subject', '<p>Hi</p>')).rejects.toThrow(ServiceUnavailableException);
  });
});
