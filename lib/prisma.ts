import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Next.js runs page generation in multiple processes during the build.
    // Keep one connection per process so the build cannot exhaust Postgres.
    max: 1,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
