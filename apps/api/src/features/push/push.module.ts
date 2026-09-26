import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { PushService } from './services/push.service';

@Module({
  imports: [DevicesModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
