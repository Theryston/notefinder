import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { apiKeyMiddleware } from '@/lib/api-key-middleware';

async function getTrack(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const track = await prisma.track.findFirst({ where: { id } });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  return NextResponse.json(track);
}

async function putTrack(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { musicUrl, vocalsUrl, lyricsUrl, score, musicMp3Url, vocalsMp3Url } =
    await request.json();

  const track = await prisma.track.findFirst({
    where: { id },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  if (score !== undefined) {
    await prisma.trackCalculationJob.updateMany({
      where: { trackId: id, endAt: null },
      data: { endAt: new Date(), score },
    });
  }

  await prisma.track.update({
    where: { id },
    data: {
      musicUrl: musicUrl || undefined,
      musicMp3Url: musicMp3Url || undefined,
      vocalsUrl: vocalsUrl || undefined,
      vocalsMp3Url: vocalsMp3Url || undefined,
      lyricsUrl: lyricsUrl || undefined,
      score: score || undefined,
    },
  });

  revalidateTag(`track_${id}`);

  return NextResponse.json({ message: 'Track updated' }, { status: 200 });
}

export const GET = withMiddleware(apiKeyMiddleware, getTrack);
export const PUT = withMiddleware(apiKeyMiddleware, putTrack);
