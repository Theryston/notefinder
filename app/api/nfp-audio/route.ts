import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { NextResponse } from 'next/server';

async function createNfpAudioProcess(request: Request) {
  const { duration, trackId, instanceType } = await request.json();

  console.log(
    `Got new nfp audio process request: ${duration} seconds, ${instanceType}, ${trackId}`,
  );

  if (!trackId) {
    return NextResponse.json(
      { error: 'Track ID is required!' },
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
