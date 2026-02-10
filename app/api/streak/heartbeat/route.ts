import { auth } from '@/auth';
import { recordDailyPracticeHeartbeat } from '@/lib/services/streak/daily-practice';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
      },
      {
        status: 401,
      },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: 'Invalid payload',
      },
      {
        status: 400,
      },
    );
  }

  const elapsedSeconds = Number(
    (payload as { elapsedSeconds?: unknown })?.elapsedSeconds,
  );

  const result = await recordDailyPracticeHeartbeat(userId, elapsedSeconds);

  return NextResponse.json(result);
}
