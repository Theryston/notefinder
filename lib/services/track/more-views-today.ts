import { FULL_TRACK_INCLUDE } from '@/lib/constants';
import prisma from '@/lib/prisma';
import moment from 'moment';

export async function getMoreViewsToday(userId?: string) {
  const endOfDay = moment().endOf('day');
  const startOfDay = moment().startOf('day');

  const result: unknown[] = await prisma.trackView.groupBy({
    by: ['trackId'],
    where: {
      createdAt: {
        gte: startOfDay.toDate(),
        lt: endOfDay.toDate(),
      },
      ...(userId ? { userId } : {}),
    },
    _count: {
      trackId: true,
    },
    orderBy: {
      _count: {
        trackId: 'desc',
      },
    },
    take: 10,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const trackIds = result.map((r) => (r as { trackId: string }).trackId);

  if (trackIds.length === 0) return [];

  const tracks = await prisma.track.findMany({
    where: {
      id: { in: trackIds },
    },
    include: FULL_TRACK_INCLUDE,
  });

  const viewsByTrackId = Object.fromEntries(
    result.map((r) => [
      (r as { trackId: string }).trackId,
      (r as { _count: { trackId: number } })._count.trackId,
    ]),
  );

  return tracks
    .sort((a, b) => (viewsByTrackId[b.id] ?? 0) - (viewsByTrackId[a.id] ?? 0))
    .map((track) => ({
      ...track,
      viewsToday: viewsByTrackId[track.id] ?? 0,
    }));
}
