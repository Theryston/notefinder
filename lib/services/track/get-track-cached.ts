import prisma from '@/lib/prisma';
import { unstable_cache as cache } from 'next/cache';

type GetTrackCached = {
  id: string;
};

export async function getTrackCached({ id }: GetTrackCached) {
  const cached = cache(
    async () => {
      return await prisma.track.findFirst({
        where: { id },
        include: {
          notes: true,
          thumbnails: true,
        },
      });
    },
    [id],
    { revalidate: false, tags: [`track_${id}`] },
  );

  const track = await cached();

  return track;
}
