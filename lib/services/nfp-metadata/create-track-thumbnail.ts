import prisma from '@/lib/prisma';

type CreateTrackThumbnailInput = {
  trackId: string;
  url: string;
  width?: number;
  height?: number;
};

export async function createTrackThumbnail({
  trackId,
  url,
  width,
  height,
}: CreateTrackThumbnailInput) {
  const track = await prisma.track.findUnique({
    where: {
      id: trackId,
    },
  });

  if (!track) {
    throw new Error(`[nfp-metadata] Track ${trackId} not found`);
  }

  return prisma.thumbnail.create({
    data: {
      trackId,
      url,
      width: width ?? undefined,
      height: height ?? undefined,
    },
  });
}
