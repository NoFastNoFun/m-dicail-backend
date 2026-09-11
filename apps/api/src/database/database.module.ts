import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { migrations } from '../migrations';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Never auto-sync schema in any env — the ordered migration list is the source of truth.
        synchronize: false,
        migrations,
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
