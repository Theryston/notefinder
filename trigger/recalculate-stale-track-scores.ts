import prisma from '@/lib/prisma';
import moment from 'moment';
import { schedules, tasks } from '@trigger.dev/sdk';

const STALE_TRACK_SCORE_DAYS = 7; // tracks that the score have not been updated in this many days will be recalculated

export const recalculateStaleTrackScoresTask = schedules.task({
  id: 'recalculate-stale-track-scores-daily',
  cron: '0 0 * * *',
  run: async () => {
    const staleBefore = moment()
      .subtract(STALE_TRACK_SCORE_DAYS, 'days')
      .toDate();

    const staleTrackScores = await prisma.trackCalculationJob.groupBy({
      by: ['trackId'],
      where: {
        endAt: {
          not: null,
        },
        track: {
          views: {
            some: {},
          },
        },
      },
      _max: {
        endAt: true,
      },
      having: {
        endAt: {
          _max: {
            lt: staleBefore,
          },
        },
      },
    });

    if (!staleTrackScores.length) {
      console.log('No stale track scores found to refresh');

      return {
        staleTracks: 0,
        queuedJobs: 0,
      };
    }

    const staleTrackIds = staleTrackScores.map(
      (trackScore) => trackScore.trackId,
    );

    const pendingTrackJobs = await prisma.trackCalculationJob.findMany({
      where: {
        endAt: null,
        trackId: {
          in: staleTrackIds,
        },
      },
      select: {
        trackId: true,
      },
    });

    const pendingTrackIds = new Set(
      pendingTrackJobs.map((pendingTrackJob) => pendingTrackJob.trackId),
    );

    let queuedJobs = 0;

    for (const staleTrackId of staleTrackIds) {
      if (pendingTrackIds.has(staleTrackId)) {
        continue;
      }

      const trackCalculationJob = await prisma.trackCalculationJob.create({
        data: {
          trackId: staleTrackId,
          startAt: moment().toDate(),
        },
      });

      await tasks.trigger('calculate-score', {
        trackCalculationJobId: trackCalculationJob.id,
        ignoreWait: true,
      });

      queuedJobs += 1;
    }

    console.log(
      `Queued ${queuedJobs} stale track score recalculation jobs (cutoff: ${staleBefore.toISOString()})`,
    );

    return {
      staleTracks: staleTrackIds.length,
      queuedJobs,
    };
  },
});
