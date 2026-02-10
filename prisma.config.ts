import 'dotenv/config';
import type { PrismaConfig } from 'prisma';

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL!,
  },
} as PrismaConfig;
