import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/lib/generated/prisma/client';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not configured. Set it in the runtime environment.',
    );
  }

  const adapter = new PrismaPg({
    connectionString,
  });
  return new PrismaClient({ adapter });
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as {
  prisma?: PrismaClientInstance;
};

let prismaClient: PrismaClientInstance | undefined;

function getPrismaClient() {
  if (prismaClient) return prismaClient;

  prismaClient = globalForPrisma.prisma || createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
  }

  return prismaClient;
}

const prisma = new Proxy({} as PrismaClientInstance, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;
