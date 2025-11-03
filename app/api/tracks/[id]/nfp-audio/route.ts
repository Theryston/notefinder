import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { TrackStatus } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';
import {
  EC2Client,
  CancelSpotInstanceRequestsCommand,
} from '@aws-sdk/client-ec2';

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

  const client = new SQSClient({
    region: process.env.CUSTOM_AWS_REGION_NAME!,
    credentials: {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const ec2Client = new EC2Client({
    region: process.env.CUSTOM_AWS_REGION_NAME!,
    credentials: {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const messageBody = JSON.stringify({ usesGpu: false, track });

  const command = new SendMessageCommand({
    MessageBody: messageBody,
    QueueUrl: process.env.NFP_AUDIO_QUEUE_URL!,
  });

  const result = await client.send(command);

  const jobId = result.MessageId;

  if (!jobId) {
    return NextResponse.json(
      { error: 'Failed to start nfp audio extraction job' },
      { status: 500 },
    );
  }

  await prisma.track.update({
    where: { id },
    data: { jobId },
  });

  const notCanceledSpotRequests =
    await prisma.nfpAudioProcessSpotRequest.findMany({
      where: {
        trackId: id,
        isCanceled: false,
      },
    });

  for (const spotRequest of notCanceledSpotRequests) {
    await ec2Client.send(
      new CancelSpotInstanceRequestsCommand({
        SpotInstanceRequestIds: [spotRequest.spotId],
      }),
    );

    await prisma.nfpAudioProcessSpotRequest.update({
      where: { id: spotRequest.id },
      data: { isCanceled: true },
    });

    console.log(`Canceled spot request ${spotRequest.spotId} for track ${id}`);
  }

  return NextResponse.json(
    {
      message: `Started a nfp audio job for track ${track.id} at ${jobId}`,
    },
    { status: 200 },
  );
}

export const POST = withMiddleware(apiKeyMiddleware, startNfpAudio);
