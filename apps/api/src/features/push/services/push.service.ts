import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DevicesService } from '../../devices/services/devices.service';

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private ready = false;

  constructor(
    private readonly config: ConfigService,
    private readonly devicesService: DevicesService,
  ) {}

  onModuleInit(): void {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKeyRaw) {
      this.logger.warn('Firebase Admin not configured — push notifications disabled');
      return;
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      this.ready = true;
      this.logger.log('Firebase Admin initialized for FCM');
    } catch (err) {
      this.logger.error(`Failed to initialize Firebase Admin: ${err}`);
    }
  }

  get isConfigured(): boolean {
    return this.ready;
  }

  /** Send one notification to every registered device token. */
  async sendToAllDevices(payload: PushPayload): Promise<void> {
    if (!this.ready) {
      this.logger.warn('Skipping FCM send — Firebase Admin not configured');
      return;
    }

    const rows = await this.devicesService.findAllTokens();
    const tokens = [...new Set(rows.map((r: { token: string }) => r.token))];
    if (tokens.length === 0) {
      this.logger.log('No device tokens to notify');
      return;
    }

    await this.sendToTokens(tokens, payload);
  }

  private async sendToTokens(tokens: string[], payload: PushPayload): Promise<void> {
    const chunkSize = 500;
    const invalid: string[] = [];

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'medicail_push',
          },
        },
      });

      response.responses.forEach((res, index) => {
        if (res.success) return;
        const code = res.error?.code ?? '';
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          invalid.push(chunk[index]);
        } else {
          this.logger.warn(`FCM send failed for token index ${index}: ${code} ${res.error?.message}`);
        }
      });

      this.logger.log(`FCM chunk: ${response.successCount} ok, ${response.failureCount} failed (of ${chunk.length})`);
    }

    if (invalid.length > 0) {
      await this.devicesService.deleteInvalidTokens(invalid);
      this.logger.log(`Pruned ${invalid.length} invalid FCM token(s)`);
    }
  }
}
