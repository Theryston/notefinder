import prisma from '@/lib/prisma';
import moment from 'moment';
import { NextResponse } from 'next/server';
import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import { withMiddleware } from '@/lib/with-middleware';

async function getTrackStats(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const startOfHour = moment().startOf('hour').toDate();
  const startOfDay = moment().startOf('day').toDate();
  const startOfWeek = moment().startOf('week').toDate();
  const startOfMonth = moment().startOf('month').toDate();

  const stats = await prisma.$queryRawUnsafe<
    {
      thisHourCount: bigint;
      todayCount: bigint;
      thisWeekCount: bigint;
      thisMonthCount: bigint;
      allTimeCount: bigint;
    }[]
  >(
    `
    SELECT
      COUNT(*) AS "allTimeCount",
      SUM(CASE WHEN "created_at" >= $1 THEN 1 ELSE 0 END) AS "thisHourCount",
      SUM(CASE WHEN "created_at" >= $2 THEN 1 ELSE 0 END) AS "todayCount",
      SUM(CASE WHEN "created_at" >= $3 THEN 1 ELSE 0 END) AS "thisWeekCount",
      SUM(CASE WHEN "created_at" >= $4 THEN 1 ELSE 0 END) AS "thisMonthCount"
    FROM "track_views"
    WHERE "track_id" = $5
  `,
    startOfHour,
    startOfDay,
    startOfWeek,
    startOfMonth,
    id,
  );

  const s = stats[0];
  return NextResponse.json({
    thisHourCount: Number(s.thisHourCount),
    todayCount: Number(s.todayCount),
    thisWeekCount: Number(s.thisWeekCount),
    thisMonthCount: Number(s.thisMonthCount),
    allTimeCount: Number(s.allTimeCount),
  });
}

export const GET = withMiddleware(apiKeyMiddleware, getTrackStats);
