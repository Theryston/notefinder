import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { NextResponse } from 'next/server';

async function createSpotRequest(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { spotId } = await request.json();

  if (!spotId) {
    return NextResponse.json(
      { error: 'Spot ID is required!' },
      { status: 400 },
    );
  }

  await prisma.nfpAudioProcessSpotRequest.create({
    data: {
      trackId: id,
      spotId,
    },
  });

  return NextResponse.json(
    { message: `Spot request created for track ${id}` },
    { status: 201 },
  );
}

export const POST = withMiddleware(apiKeyMiddleware, createSpotRequest);
