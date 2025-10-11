import { MINIMAL_TRACK_INCLUDE } from '@/lib/constants';
import prisma from '@/lib/prisma';
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
} from 'next/cache';

export const getUserByIdWithCache = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
    cacheStrategy: {
      swr: 60 * 60 * 24,
      tags: [`user_${id}`],
    },
  });
};

export const getUserByUsernameWithCache = async (username: string) => {
  'use cache: remote';
  cacheLife('max');
  cacheTag(`user_${username}`);

  return await prisma.user.findFirst({
    where: { username },
    include: {
      tracks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: MINIMAL_TRACK_INCLUDE,
      },
      userSectionVisibility: true,
      userFavoriteTracks: {
        include: {
          track: {
            include: MINIMAL_TRACK_INCLUDE,
          },
        },
      },
      trackViews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          track: {
            include: MINIMAL_TRACK_INCLUDE,
          },
        },
      },
      _count: {
        select: {
          tracks: true,
          userFavoriteTracks: true,
          trackViews: true,
        },
      },
    },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
  });
};
