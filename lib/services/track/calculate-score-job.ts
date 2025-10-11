import { CALCULATE_TRACK_SCORE_JOB_DELAY } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { calculateTrackScoreQueue } from '../notefinder-worker/queues';
import moment from 'moment';

export const calculateTrackScoreJob = async (trackId: string) => {
  const hasPendingJob = await prisma.trackCalculationJob.findFirst({
    where: {
      trackId: trackId,
      endAt: null,
    },
  });

  if (hasPendingJob) return;

  const job = await calculateTrackScoreQueue.add(
    'calculate-track-score',
    {
      trackId: trackId,
    },
    {
      delay: CALCULATE_TRACK_SCORE_JOB_DELAY,
    },
  );

  if (!job?.id) return;

  const startAt = moment()
    .add(CALCULATE_TRACK_SCORE_JOB_DELAY, 'milliseconds')
    .toDate();

  await prisma.trackCalculationJob.create({
    data: {
      trackId: trackId,
      jobId: job.id,
      startAt,
    },
  });

  console.log(`Added a calculate score job for track ${trackId}`);
};
