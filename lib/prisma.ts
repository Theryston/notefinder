import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

function createPrismaClient() {
  return new PrismaClient({
    log: ['error'],
  }).$extends(withAccelerate());
}

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};

const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
