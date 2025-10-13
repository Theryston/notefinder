import prisma from '@/lib/prisma';
import { unstable_cacheTag as cacheTag } from 'next/cache';

export const getUserByIdWithCache = async (id: string) => {
  'use cache: remote';
  cacheTag(`user_${id}`);

  return await prisma.user.findFirst({
    where: { id },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
  });
};
