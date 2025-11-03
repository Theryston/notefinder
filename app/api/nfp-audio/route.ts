import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { NextResponse } from 'next/server';

async function createNfpAudioProcess(request: Request) {
  const { duration, body, instanceType } = await request.json();

  const bodyJson = JSON.parse(body);

  const trackId = bodyJson?.track?.id;

  if (!trackId) {
    return NextResponse.json(
      { error: 'Track ID is required' },
      { status: 400 },
    );
  }

  await prisma.nfpAudioProcess.create({
    data: {
      trackId,
      duration,
      instanceType,
    },
  });

  return NextResponse.json(
    {
      message: `NFP audio process created for track ${trackId}`,
    },
    { status: 201 },
  );
}

export const POST = withMiddleware(apiKeyMiddleware, createNfpAudioProcess);
