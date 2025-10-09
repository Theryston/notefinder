import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

type Note = {
  note: string;
  octave: number;
  start: number;
  end: number;
  frequency_mean: number;
};

export async function POST(
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

  revalidateTag(`track_${id}`);

  return NextResponse.json({ message: 'Notes created' }, { status: 200 });
}
