import { Runtime, TrackStatus, type Track } from '@/lib/generated/prisma/client';
import { getSettings } from '@/lib/settings';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { getTrackOrThrow } from './get-track';
import { updateTrackStatus } from './update-track-status';

const NFP_AUDIO_STATUS: TrackStatus[] = [
  TrackStatus.EXTRACTING_VOCALS,
  TrackStatus.DETECTING_VOCALS_NOTES,
];

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`[nfp-metadata] Missing required env: ${name}`);
  }

  return value;
}

async function runpodStartNfpAudio(track: Track) {
  const runpodServerlessId = requiredEnv('RUNPOD_SERVERLESS_ID');
  const runpodApiKey = requiredEnv('RUNPOD_API_KEY');

  const response = await fetch(
    `https://api.runpod.ai/v2/${runpodServerlessId}/run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${runpodApiKey}`,
      },
      body: JSON.stringify({ input: { track } }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `[nfp-metadata] [RUNPOD] Failed to start nfp audio job for track ${track.id}: ${response.status} ${response.statusText}`,
    );
  }
}

async function awsStartNfpAudio({
  track,
  usesGpu,
}: {
  track: Track;
  usesGpu: boolean;
}) {
  const queueUrl = requiredEnv('NFP_AUDIO_QUEUE_URL');
  const region = requiredEnv('CUSTOM_AWS_REGION_NAME');
  const accessKeyId = requiredEnv('CUSTOM_AWS_ACCESS_KEY');
  const secretAccessKey = requiredEnv('CUSTOM_AWS_SECRET_ACCESS_KEY');

  const sqsClient = new SQSClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  await sqsClient.send(
    new SendMessageCommand({
      MessageBody: JSON.stringify({ usesGpu, track }),
      QueueUrl: queueUrl,
    }),
  );
}

export async function startNfpAudioJob(trackId: string) {
  let track = await getTrackOrThrow(trackId);

  if (!NFP_AUDIO_STATUS.includes(track.status)) {
    await updateTrackStatus({
      trackId,
      status: TrackStatus.EXTRACTING_VOCALS,
    });

    track = await getTrackOrThrow(trackId);
  }

  const settings = await getSettings();

  if (settings.runtime === Runtime.AWS) {
    await awsStartNfpAudio({ track, usesGpu: settings.usesGpu });
    return;
  }

  if (settings.runtime === Runtime.RUNPOD) {
    await runpodStartNfpAudio(track);
    return;
  }

  throw new Error(
    `[nfp-metadata] Unsupported runtime "${settings.runtime}" for track ${trackId}`,
  );
}
