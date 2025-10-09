import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { musicUrl, vocalsUrl } = await request.json();

  const track = await prisma.track.findUnique({
    where: { id },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  await prisma.track.update({
    where: { id },
    data: { musicUrl, vocalsUrl },
  });

  revalidateTag(`track_${id}`);

  return NextResponse.json({ message: 'Track updated' }, { status: 200 });
}
