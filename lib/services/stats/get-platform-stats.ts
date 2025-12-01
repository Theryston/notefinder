import prisma from '@/lib/prisma';
import moment from 'moment';

export async function getPlatformStats() {
  const startOfHour = moment().startOf('hour').toDate();
  const startOfDay = moment().startOf('day').toDate();

  const stats = await prisma.$queryRawUnsafe<
    {
      thisHourCount: bigint;
      todayCount: bigint;
      trackCountThisHour: bigint;
      trackCountToday: bigint;
    }[]
  >(
    `
    SELECT
      SUM(CASE WHEN "created_at" >= $1 THEN 1 ELSE 0 END) AS "thisHourCount",
      SUM(CASE WHEN "created_at" >= $2 THEN 1 ELSE 0 END) AS "todayCount",
      COUNT(DISTINCT CASE WHEN "created_at" >= $1 THEN "track_id" END) AS "trackCountThisHour",
      COUNT(DISTINCT CASE WHEN "created_at" >= $2 THEN "track_id" END) AS "trackCountToday"
    FROM "track_views"
    `,
    startOfHour,
    startOfDay,
  );

  const s = stats[0];

  const hourAvg =
    Math.round(Number(s.thisHourCount) / Number(s.trackCountThisHour)) || 0;
  const todayAvg =
    Math.round(Number(s.todayCount) / Number(s.trackCountToday)) || 0;

  return {
    thisHourCount: Number(s.thisHourCount),
    todayCount: Number(s.todayCount),
    trackCountThisHour: Number(s.trackCountThisHour),
    trackCountToday: Number(s.trackCountToday),
    hourAvg,
    todayAvg,
  };
}
