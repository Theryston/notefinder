import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { trackMiddleware } from '../track-middleware';

async function createThumbnail(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { url, width, height } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      creator: true,
    },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  const thumbnail = await prisma.thumbnail.create({
    data: {
      trackId: id,
      url,
      width: width || undefined,
      height: height || undefined,
    },
  });

  revalidateTag(`track_${id}`);
  revalidateTag(`user_${track.creator.username}`);

  return NextResponse.json(thumbnail);
}

export const POST = withMiddleware(trackMiddleware, createThumbnail);
