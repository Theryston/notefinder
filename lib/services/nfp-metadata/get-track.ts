import prisma from '@/lib/prisma';

export async function getTrack(trackId: string) {
  return prisma.track.findUnique({
    where: {
      id: trackId,
    },
  });
}

export async function getTrackOrThrow(trackId: string) {
  const track = await getTrack(trackId);

  if (!track) {
    throw new Error(`[nfp-metadata] Track ${trackId} not found`);
  }

  return track;
}
