import prisma from '@/lib/prisma';
import { unstable_cache as cache } from 'next/cache';

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
  const fetch = cache(
    async () => {
      return await prisma.user.findFirst({
        where: { username },
        include: {
          tracks: {
            orderBy: { createdAt: 'desc' },
            take: 30,
            include: {
              trackArtists: {
                include: { artist: true },
              },
              thumbnails: true,
            },
          },
          userSectionVisibility: true,
          userFavoriteTracks: {
            include: {
              track: {
                include: {
                  trackArtists: {
                    include: { artist: true },
                  },
                  thumbnails: true,
                },
              },
            },
          },
          trackViews: {
            orderBy: { createdAt: 'desc' },
            take: 30,
            include: {
              track: {
                include: {
                  trackArtists: {
                    include: { artist: true },
                  },
                  thumbnails: true,
                },
              },
            },
          },
        },
      });
    },
    [`user_${username}`],
    { revalidate: false, tags: [`user_${username}`] },
  );

  return await fetch();
};

export const getUserById = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
  });
};
