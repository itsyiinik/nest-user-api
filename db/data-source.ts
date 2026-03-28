import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as path from 'path';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,

  entities: [path.join(__dirname, '../apps/user-service/src/**/*.entity.ts')],
  migrations: [path.join(__dirname, './migrations/*.ts')],

  synchronize: false,
  logging: true,
});
