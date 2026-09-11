import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryLog } from './entities/telemetry-log.entity';
import { TelemetryRepository } from './repositories/telemetry.repository';
import { TelemetryService } from './services/telemetry.service';
import { TelemetryController } from './telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TelemetryLog])],
  providers: [TelemetryService, TelemetryRepository],
  controllers: [TelemetryController],
})
export class TelemetryModule {}
