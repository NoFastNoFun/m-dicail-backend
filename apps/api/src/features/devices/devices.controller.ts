import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/shared';
import { DevicesService } from './services/devices.service';
import { RegisterDeviceRequestDto } from './dtos/requests/register-device.request.dto';
import { UnregisterDeviceRequestDto } from './dtos/requests/unregister-device.request.dto';

@ApiTags('devices')
@ApiBearerAuth()
@Controller({ path: 'devices', version: '1' })
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterDeviceRequestDto): Promise<void> {
    return this.devicesService.register(userId, dto.token, dto.platform);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  unregister(@CurrentUser('id') userId: string, @Body() dto: UnregisterDeviceRequestDto): Promise<void> {
    return this.devicesService.unregister(userId, dto.token);
  }
}
