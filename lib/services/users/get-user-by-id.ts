import prisma from '@/lib/prisma';

export const getUserByIdWithCache = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
    cacheStrategy: {
      swr: 60 * 60 * 24,
      tags: [`user_${id}`],
    },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
  });
};
