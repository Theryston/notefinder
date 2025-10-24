import { CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import moment from 'moment';

export const calculateTrackScoreJob = async (trackId: string) => {
  const hasPendingJob = await prisma.trackCalculationJob.findFirst({
    where: {
      trackId: trackId,
      endAt: null,
    },
  });

  if (hasPendingJob) {
    console.log(
      `A calculate score job is already pending for track ${trackId}`,
    );
    return;
  }

  const client = new SQSClient({
    region: process.env.CUSTOM_AWS_REGION_NAME!,
    credentials: {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new SendMessageCommand({
    MessageBody: JSON.stringify({ trackId }),
    QueueUrl: process.env.CALCULATE_TRACK_SCORE_QUEUE_URL!,
    DelaySeconds: CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS,
  });

  const result = await client.send(command);

  const jobId = result.MessageId;

  if (!jobId) return;

  const startAt = moment()
    .add(CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS, 'seconds')
    .toDate();

  await prisma.trackCalculationJob.create({
    data: {
      trackId: trackId,
      jobId: jobId,
      startAt,
    },
  });

  console.log(`Added a calculate score job for track ${trackId}`);
};
