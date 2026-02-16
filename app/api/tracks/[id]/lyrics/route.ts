import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { TrackStatus } from '@/lib/generated/prisma/client';
import { NextResponse } from 'next/server';
import { tasks } from '@trigger.dev/sdk';
import type { nfpMetadataTask } from '@/trigger/nfp-metadata';

async function startLyricsExtraction(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const track = await prisma.track.findFirst({
    where: { id },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  await prisma.track.update({
    where: { id },
    data: {
      status: TrackStatus.EXTRACTING_LYRICS,
    },
  });

  const handle = await tasks.trigger<typeof nfpMetadataTask>('nfp-metadata', {
    trackId: track.id,
    externalTrack: {},
  });

  await prisma.track.update({
    where: { id },
    data: { jobId: handle.id },
  });

  return NextResponse.json(
    {
      message: `Started a lyrics extraction job for track ${track.id} at ${handle.id}`,
    },
    { status: 200 },
  );
}

export const POST = withMiddleware(apiKeyMiddleware, startLyricsExtraction);
