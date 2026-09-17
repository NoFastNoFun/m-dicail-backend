import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceToken } from './entities/device-token.entity';
import { DeviceTokenRepository } from './repositories/device-token.repository';
import { DevicesService } from './services/devices.service';
import { DevicesController } from './devices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceToken])],
  providers: [DevicesService, DeviceTokenRepository],
  controllers: [DevicesController],
  exports: [DevicesService],
})
export class DevicesModule {}
