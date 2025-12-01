import { CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { getPlatformStats } from '@/lib/services/stats/get-platform-stats';
import { getTrackStats } from '@/lib/services/stats/get-track-stats';
import { schemaTask, wait } from '@trigger.dev/sdk/v3';
import z from 'zod';

export const trackCalculationTask = schemaTask({
  id: 'calculate-score',
  maxDuration: 300,
  schema: z.object({ trackCalculationJobId: z.string() }),
  machine: { preset: 'micro' },
  retry: {
    maxAttempts: 3,
  },
  catchError: async (error) => {
    if (error.retryAt) return;

    const trackCalculationJobId = error.payload?.trackCalculationJobId;

    if (!trackCalculationJobId) {
      console.log('No track calculation job id found in error payload');
      return;
    }

    await prisma.trackCalculationJob.update({
      where: {
        id: trackCalculationJobId,
      },
      data: {
        endAt: new Date(),
        score: 0,
      },
    });
  },
  run: async (payload) => {
    const trackCalculationJobId = payload.trackCalculationJobId;
    if (!trackCalculationJobId) {
      throw new Error('No track calculation job id found in payload');
    }

    const trackCalculationJob = await prisma.trackCalculationJob.findUnique({
      where: {
        id: trackCalculationJobId,
      },
    });

    if (!trackCalculationJob) {
      throw new Error('No track calculation job found');
    }

    if (trackCalculationJob.endAt) {
      console.log('Track calculation job already ended');
      return;
    }

    console.log(
      `All good, waiting for calculate the score for ${trackCalculationJobId}`,
    );

    await wait.for({ seconds: CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS });

    console.log(
      `Waited for ${CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS} seconds | Now calculating the score for ${trackCalculationJobId}`,
    );

    const globalStats = await getPlatformStats();

    console.log(`Global stats: ${JSON.stringify(globalStats, null, 2)}`);

    const stats = await getTrackStats(trackCalculationJob.trackId);

    console.log(`Track stats: ${JSON.stringify(stats, null, 2)}`);

    const thisHour = stats.thisHourCount;
    const today = stats.todayCount;
    const thisWeek = stats.thisWeekCount;
    const thisMonth = stats.thisMonthCount;
    const allTime = stats.allTimeCount;

    const globalHourAvg = globalStats.hourAvg;
    const globalDayAvg = globalStats.todayAvg;

    // ---- Trend detection ----
    const localHourTrend = (thisHour * 24) / (thisWeek / 7 + 1);
    const localDayTrend = (today * 7) / (thisWeek + 1);

    const globalHourTrend = thisHour / (globalHourAvg + 1);
    const globalDayTrend = today / (globalDayAvg + 1);

    const hybridHourTrend =
      Math.pow(localHourTrend, 0.3) * Math.pow(globalHourTrend, 0.4);
    const hybridDayTrend =
      Math.pow(localDayTrend, 0.3) * Math.pow(globalDayTrend, 0.4);

    const hybridTrend = hybridHourTrend * 0.6 + hybridDayTrend * 0.4;
    const trendBoost = 1 + Math.min(hybridTrend, 4.0);

    // ---- Base score ----
    const baseScore =
      thisHour * 1.5 + today * 1.2 + thisWeek * 1.1 + thisMonth * 1.0;

    // ---- Scale ----
    const scale = Math.log10(1 + allTime);

    // ---- Score ----
    const score = Math.round(baseScore * scale * trendBoost);

    await prisma.trackCalculationJob.update({
      where: {
        id: trackCalculationJobId,
      },
      data: {
        endAt: new Date(),
        score,
      },
    });

    await prisma.track.update({
      where: {
        id: trackCalculationJob.trackId,
      },
      data: {
        score,
      },
    });

    console.log(
      `Score calculated and updated for ${trackCalculationJob.id}: ${score}`,
    );
  },
});
