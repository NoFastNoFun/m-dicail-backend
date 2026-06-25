import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: ['apps/api/src/features/**/entities/*.entity.ts'],
  migrations: ['apps/api/src/migrations/*.ts'],
  synchronize: false,
});
