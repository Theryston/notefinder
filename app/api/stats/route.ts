import { NextResponse } from 'next/server';
import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import { withMiddleware } from '@/lib/with-middleware';
import { getPlatformStats } from '@/lib/services/stats/get-platform-stats';

export const GET = withMiddleware(apiKeyMiddleware, async () => {
  const stats = await getPlatformStats();

  return NextResponse.json(stats);
});
