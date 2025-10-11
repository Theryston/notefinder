import { MINIMAL_TRACK_INCLUDE, MinimalTrack } from '@/lib/constants';
import prisma from '@/lib/prisma';
import {
  TrackView,
  User,
  UserFavoriteTrack,
  UserSectionVisibility,
} from '@prisma/client';
import {
  unstable_cacheTag as cacheTag,
  unstable_cacheLife as cacheLife,
} from 'next/cache';

export const getUserByIdWithCache = async (id: string) => {
  'use cache: remote';
  cacheLife('max');
  cacheTag(`user_${id}`);

  return await prisma.user.findFirst({
    where: { id },
  });
};

export const getUserByUsernameWithCache = async (
  username: string,
): Promise<
  User & {
    tracks: MinimalTrack[];
    userSectionVisibility: UserSectionVisibility[];
    userFavoriteTracks: (UserFavoriteTrack & { track: MinimalTrack })[];
    trackViews: (TrackView & { track: MinimalTrack })[];
    _count: {
      tracks: number;
      userFavoriteTracks: number;
      trackViews: number;
    };
  }
> => {
  'use cache: remote';
  cacheLife('max');
  cacheTag(`user_${username}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = await prisma.user.findFirst({
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
        distinct: ['trackId'],
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

  return user ?? null;
};

export const getUserById = async (id: string) => {
  return await prisma.user.findFirst({
    where: { id },
  });
};
