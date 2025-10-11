import {
  FULL_TRACK_INCLUDE,
  MINIMAL_TRACK_INCLUDE,
  MinimalTrack,
} from '@/lib/constants';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { unstable_cache as cache } from 'next/cache';

type GetTrackCached = {
  id: string;
};

export async function getTrackCached({ id }: GetTrackCached) {
  const fetch = cache(
    async () => {
      return await prisma.track.findFirst({
        where: { id },
        include: FULL_TRACK_INCLUDE,
      });
    },
    [`track_${id}`],
    { revalidate: false, tags: [`track_${id}`] },
  );

  return await fetch();
}

export type GetTrackCustomWhereWithCacheConditions = {
  key: 'artistId' | 'albumId' | 'completed_only';
  value?: string;
};

export type GetTrackCustomWhereWithCache = {
  conditions: GetTrackCustomWhereWithCacheConditions[];
  orderBy?: 'default' | 'createdAt';
  cacheTags?: string[];
  take?: number;
  page?: number;
};

export const getTrackCustomWhereWithCache = async ({
  conditions,
  cacheTags = [],
  take = 10,
  page = 1,
  orderBy = 'default',
}: GetTrackCustomWhereWithCache): Promise<{
  tracks: MinimalTrack[];
  total: number;
}> => {
  const skip = (page - 1) * take;
  const tags = [
    ...cacheTags,
    'tracks',
    `tracks_${page}_${take}`,
    ...conditions.map(
      (condition) => `tracks_condition_${condition.key}_${condition.value}`,
    ),
  ];

  const where: Prisma.TrackWhereInput = {};

  for (const condition of conditions) {
    switch (condition.key) {
      case 'artistId':
        where.trackArtists = {
          some: {
            artistId: condition.value,
          },
        };
        break;
      case 'albumId':
        where.albumId = condition.value;
        break;
      case 'completed_only':
        where.status = 'COMPLETED';
        break;
      default:
        throw new Error(`Invalid condition key: ${condition.key}`);
    }
  }

  const fetch = cache(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tracks: any = await prisma.track.findMany({
        where,
        include: MINIMAL_TRACK_INCLUDE,
        orderBy:
          orderBy === 'default'
            ? [{ score: 'desc' }, { createdAt: 'desc' }]
            : { createdAt: 'desc' },
        take,
        skip,
      });

      const total = await prisma.track.count({ where });

      return { tracks, total };
    },
    tags,
    { revalidate: 60 * 60 * 12, tags },
  );

  return await fetch();
};
