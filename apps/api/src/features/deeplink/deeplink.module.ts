import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { DeeplinkController } from './deeplink.controller';
import { DeeplinkService } from './deeplink.service';

@Module({
  imports: [MailModule],
  controllers: [DeeplinkController],
  providers: [DeeplinkService],
})
export class DeeplinkModule {}
