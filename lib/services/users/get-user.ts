import { FULL_USER_INCLUDE, FullUser } from '@/lib/constants';
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

export async function getUserByUsername(username: string) {
  'use cache: remote';
  cacheTag(`user_${username}`);

  const user = await prisma.user.findFirst({
    where: { username },
    include: FULL_USER_INCLUDE,
  });

  return user as unknown as FullUser | null;
}
