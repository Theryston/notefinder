import { NextResponse } from 'next/server';
import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import { withMiddleware } from '@/lib/with-middleware';
import { getTrackStats } from '@/lib/services/stats/get-track-stats';

async function handleTrackStats(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const stats = await getTrackStats(id);

  return NextResponse.json(stats);
}

export const GET = withMiddleware(apiKeyMiddleware, handleTrackStats);
