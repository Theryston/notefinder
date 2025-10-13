import { MINIMAL_TRACK_INCLUDE, MinimalTrack } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import moment from 'moment';

export type GetTrackCustomWhereWithCacheConditions = {
  key: 'artistId' | 'albumId' | 'completed_only' | 'ignore_ids';
  value?: string | string[];
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
  'use cache: remote';

  const skip = (page - 1) * take;
  const tags = [
    ...cacheTags,
    'tracks',
    `tracks_${page}_${take}_${orderBy}`,
    ...conditions.map(
      (condition) =>
        `tracks_condition_${condition.key}_${(Array.isArray(condition.value) ? condition.value.join(',') : condition.value)?.slice(0, 50)}`,
    ),
  ];

  tags.forEach((tag) => cacheTag(tag));

  const where: Prisma.TrackWhereInput = {};

  for (const condition of conditions) {
    switch (condition.key) {
      case 'artistId':
        where.trackArtists = {
          some: {
            artistId: condition.value as string,
          },
        };
        break;
      case 'albumId':
        where.albumId = condition.value as string;
        break;
      case 'completed_only':
        where.status = 'COMPLETED';
        break;
      case 'ignore_ids':
        where.id = { notIn: condition.value as string[] };
        break;
      default:
        throw new Error(`Invalid condition key: ${condition.key}`);
    }
  }

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
};

export const getTopViewedLast24Hours = async (
  take: number,
  ignoreIds: string[],
): Promise<MinimalTrack[]> => {
  'use cache: remote';
  cacheTag(
    `tracks_top_viewed_today_${take}`,
    ...ignoreIds.map((id) => `track_${id}`),
  );

  const last24Hours = moment().subtract(24, 'hours').toDate();

  const result: unknown[] = await prisma.trackView.groupBy({
    by: ['trackId'],
    where: {
      createdAt: {
        gte: last24Hours,
      },
      trackId: { notIn: ignoreIds },
    },
    _count: {
      trackId: true,
    },
    orderBy: { _count: { trackId: 'desc' } },
    take,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const trackIds = result.map((r) => (r as { trackId: string }).trackId);

  if (trackIds.length === 0) return [];

  const tracks = await prisma.track.findMany({
    where: {
      id: { in: trackIds },
      status: 'COMPLETED',
    },
    include: MINIMAL_TRACK_INCLUDE,
  });

  const viewsByTrackId = Object.fromEntries(
    result.map((r) => [
      (r as { trackId: string }).trackId,
      (r as { _count: { trackId: number } })._count.trackId,
    ]),
  );

  return tracks.sort(
    (a, b) => (viewsByTrackId[b.id] ?? 0) - (viewsByTrackId[a.id] ?? 0),
  ) as unknown as MinimalTrack[];
};

export const getTracksByVideoIds = async (videoIds: string[]) => {
  'use cache: remote';
  cacheTag('existing_tracks', ...videoIds.map((id) => `track_video_${id}`));

  return await prisma.track.findMany({
    where: {
      ytId: { in: videoIds },
    },
    include: {
      trackArtists: {
        include: {
          artist: true,
        },
      },
    },
  });
};
