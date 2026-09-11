import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma CLI/migrations should use Neon’s direct connection. Falling back
    // to DATABASE_URL keeps `prisma generate` working during Docker install.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
