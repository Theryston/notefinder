import { FULL_TRACK_INCLUDE } from '@/lib/constants';
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
        include: FULL_TRACK_INCLUDE,
      });
    },
    [`track_${id}`],
    { revalidate: false, tags: [`track_${id}`] },
  );

  return await fetch();
}
