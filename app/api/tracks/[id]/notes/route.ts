import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import { withMiddleware } from '@/lib/with-middleware';
import { Note } from '@/lib/services/nfp-metadata/types';

async function createNotes(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { notes } = await request.json();

  const track = await prisma.track.findFirst({
    where: { id },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  // Delete all existing notes for the track
  await prisma.trackNote.deleteMany({
    where: { trackId: id },
  });

  await prisma.trackNote.createMany({
    data: notes.map((note: Note) => ({
      trackId: id,
      note: note.note,
      octave: note.octave,
      start: note.start,
      end: note.end,
      frequencyMean: note.frequency_mean,
    })),
  });

  revalidateTag(`track_${id}`, 'max');

  return NextResponse.json({ message: 'Notes created' }, { status: 200 });
}

export const POST = withMiddleware(apiKeyMiddleware, createNotes);
