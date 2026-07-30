import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { expand } from 'dotenv-expand';
import { migrations } from './migrations';

expand(dotenv.config());

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env['DATABASE_URL'],
  entities: ['apps/api/src/features/**/entities/*.entity.ts'],
  migrations,
  synchronize: false,
});
