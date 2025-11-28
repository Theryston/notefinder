import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Runtime, Track, TrackStatus } from '@/lib/generated/prisma/client';
import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';

const NFP_AUDIO_STATUS: TrackStatus[] = [
  TrackStatus.EXTRACTING_VOCALS,
  TrackStatus.DETECTING_VOCALS_NOTES,
];

async function startNfpAudio(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let track = await prisma.track.findFirst({
    where: { id },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  if (!NFP_AUDIO_STATUS.includes(track.status)) {
    track = await prisma.track.update({
      where: { id },
      data: {
        status: TrackStatus.EXTRACTING_VOCALS,
      },
    });
  }

  const settings = await getSettings();

  if (settings.runtime === Runtime.AWS) {
    await awsStartNfpAudio({ track, usesGpu: settings.usesGpu });
  }

  if (settings.runtime === Runtime.RUNPOD) {
    await runpodStartNfpAudio(track);
  }

  return NextResponse.json(
    {
      message: `Started a nfp audio job for track ${track.id}`,
    },
    { status: 200 },
  );
}

async function runpodStartNfpAudio(track: Track) {
  const url = `https://api.runpod.ai/v2/${process.env.RUNPOD_SERVERLESS_ID}/run`;

  const requestConfig = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
    },
    body: JSON.stringify({ input: { track } }),
  };

  const response = await fetch(url, requestConfig);

  if (!response.ok) {
    throw new Error(
      `[RUNPOD] Failed to start nfp audio job for track ${track.id}: ${response.statusText}`,
    );
  }

  const data = await response.json();
  console.log(
    `[RUNPOD] Started a nfp audio job for track ${track.id} with job id ${data.id}`,
  );
}

async function awsStartNfpAudio({
  track,
  usesGpu,
}: {
  track: Track;
  usesGpu: boolean;
}) {
  const client = new SQSClient({
    region: process.env.CUSTOM_AWS_REGION_NAME!,
    credentials: {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const messageBody = JSON.stringify({ usesGpu, track });

  const command = new SendMessageCommand({
    MessageBody: messageBody,
    QueueUrl: process.env.NFP_AUDIO_QUEUE_URL!,
  });

  const result = await client.send(command);

  const jobId = result.MessageId;

  console.log(
    `[AWS] Started a nfp audio job for track ${track.id} with job id ${jobId}`,
  );
}

export const POST = withMiddleware(apiKeyMiddleware, startNfpAudio);
