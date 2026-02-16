import prisma from '@/lib/prisma';

type UpdateTrackInput = {
  musicUrl?: string | null;
  vocalsUrl?: string | null;
  lyricsUrl?: string | null;
  musicMp3Url?: string | null;
  vocalsMp3Url?: string | null;
  score?: number;
};

export async function updateTrack(trackId: string, data: UpdateTrackInput) {
  if (data.score !== undefined) {
    await prisma.trackCalculationJob.updateMany({
      where: {
        trackId,
        endAt: null,
      },
      data: {
        endAt: new Date(),
        score: data.score,
      },
    });
  }

  return prisma.track.update({
    where: {
      id: trackId,
    },
    data: {
      musicUrl: data.musicUrl ?? undefined,
      musicMp3Url: data.musicMp3Url ?? undefined,
      vocalsUrl: data.vocalsUrl ?? undefined,
      vocalsMp3Url: data.vocalsMp3Url ?? undefined,
      lyricsUrl: data.lyricsUrl ?? undefined,
      score: data.score ?? undefined,
    },
  });
}
