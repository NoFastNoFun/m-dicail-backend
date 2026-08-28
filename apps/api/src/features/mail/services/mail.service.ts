import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = configService.get<string>('SMTP_HOST');
    const port = configService.get<number>('SMTP_PORT');
    const user = configService.get<string>('SMTP_USER');
    const pass = configService.get<string>('SMTP_PASS');
    this.fromAddress = configService.get<string>('SMTP_FROM') ?? 'noreply@medicail.test';
    this.enabled = Boolean(host && port && user && pass);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — outbound mail will be skipped');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.enabled || !this.transporter) {
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException('Mail service unavailable');
      }
      this.logger.debug(`Mail skipped (SMTP disabled): to=${to} subject=${subject}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject,
      html,
    });
  }

  getPublicAppUrl(): string {
    return this.configService.get<string>('APP_PUBLIC_URL') ?? 'http://localhost:3000';
  }
}
