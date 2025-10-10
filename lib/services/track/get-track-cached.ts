import prisma from '@/lib/prisma';

type GetTrackCached = {
  id: string;
};

export async function getTrackCached({ id }: GetTrackCached) {
  return await prisma.track.findFirst({
    where: { id },
    include: {
      notes: true,
      thumbnails: true,
      album: true,
      creator: true,
      trackArtists: { include: { artist: true } },
      _count: { select: { views: true } },
    },
    cacheStrategy: {
      swr: 60 * 60 * 24,
      tags: [`track_${id}`],
    },
  });
}
