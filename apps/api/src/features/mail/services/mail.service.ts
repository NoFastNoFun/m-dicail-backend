import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private readonly enabled: boolean;
  private readonly allowSkip: boolean;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.readNonEmpty('SMTP_HOST');
    const port = this.readPort();
    const user = this.readNonEmpty('SMTP_USER');
    const pass = this.readNonEmpty('SMTP_PASS');
    this.fromAddress = this.readNonEmpty('SMTP_FROM') ?? user ?? 'noreply@medicail.test';
    this.enabled = Boolean(host && port && user && pass && this.fromAddress);
    this.allowSkip = process.env.NODE_ENV !== 'production' && (process.env.NODE_ENV === 'test' || process.env.MAIL_SKIP === 'true');

    if (this.enabled && host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        family: 4,
        auth: { user, pass },
      } as SMTPTransport.Options);
    } else if (this.allowSkip) {
      this.logger.warn('SMTP not configured — outbound mail will be skipped');
    } else {
      this.logger.error('SMTP not configured — outbound mail will fail');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.enabled || !this.transporter) {
      if (this.allowSkip) {
        this.logger.debug(`Mail skipped (SMTP disabled): to=${to} subject=${subject}`);
        return;
      }
      throw new ServiceUnavailableException('Mail service unavailable');
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      const accepted = Array.isArray(info?.accepted) ? info.accepted : null;
      const rejected = Array.isArray(info?.rejected) ? info.rejected : [];
      if (rejected.length > 0 || (accepted && accepted.length === 0)) {
        this.logger.error(`SMTP rejected recipient for subject="${subject}"`);
        throw new ServiceUnavailableException('Mail service unavailable');
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`SMTP send failed: ${message}`);
      throw new ServiceUnavailableException('Mail service unavailable');
    }
  }

  getPublicAppUrl(): string {
    return this.readNonEmpty('APP_PUBLIC_URL') ?? 'http://localhost:3000';
  }

  getDeeplinkScheme(): string {
    return this.readNonEmpty('APP_DEEPLINK_SCHEME') ?? 'medicail';
  }

  private readNonEmpty(key: string): string | undefined {
    const value = this.configService.get<string | number>(key);
    if (value === undefined || value === null) {
      return undefined;
    }
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private readPort(): number | undefined {
    const raw = this.readNonEmpty('SMTP_PORT');
    if (!raw) {
      return undefined;
    }
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65000) {
      return undefined;
    }
    return port;
  }
}
