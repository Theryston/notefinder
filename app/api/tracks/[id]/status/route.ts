import prisma from '@/lib/prisma';
import { TrackStatus } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { CompletedEmail } from './completed-email';
import { ErrorEmail } from './error-email';
import { withMiddleware } from '@/lib/with-middleware';
import { apiKeyMiddleware } from '@/lib/api-key-middleware';

const resend = new Resend(process.env.RESEND_API_KEY);

async function updateTrackStatus(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status: newStatus, statusDescription } = await request.json();

  if (!newStatus || !Object.values(TrackStatus).includes(newStatus)) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const currentTrack = await prisma.track.findFirst({
    where: {
      id,
    },
    include: {
      creator: true,
    },
  });

  if (!currentTrack) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  await prisma.track.update({
    where: {
      id,
    },
    data: {
      status: newStatus,
      statusDescription: statusDescription || null,
    },
  });

  if (currentTrack.status !== newStatus && newStatus === 'COMPLETED') {
    await resend.emails.send({
      from: 'Notefinder <noreply@notefinder.com.br>',
      to: currentTrack.creator.email,
      subject: `As notas da música ${currentTrack.title} estão disponíveis`,
      react: CompletedEmail({ track: currentTrack }),
    });
  }

  if (currentTrack.status !== newStatus && newStatus === 'ERROR') {
    await resend.emails.send({
      from: 'Notefinder <noreply@notefinder.com.br>',
      to: currentTrack.creator.email,
      subject: `Houve um erro ao processar a música ${currentTrack.title}`,
      react: ErrorEmail({ track: currentTrack }),
    });

    return NextResponse.json({ message: 'Track deleted' }, { status: 200 });
  }

  revalidateTag(`track_${id}`);
  revalidateTag(`user_${currentTrack.creator.username}`);

  return NextResponse.json(
    { message: 'Track status updated' },
    { status: 200 },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const track = await prisma.track.findFirst({
    where: { id },
    select: {
      status: true,
      statusDescription: true,
    },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  return NextResponse.json({
    status: track.status,
    statusDescription: track.statusDescription,
  });
}

export const PUT = withMiddleware(apiKeyMiddleware, updateTrackStatus);
