import prisma from '@/lib/prisma';
import { unstable_cache as cache } from 'next/cache';

type GetTrackCached = {
  id: string;
};

export async function getTrackCached({ id }: GetTrackCached) {
  const fetch = cache(
    async () => {
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
      });
    },
    [`track_${id}`],
    { revalidate: false, tags: [`track_${id}`] },
  );

  return await fetch();
}
