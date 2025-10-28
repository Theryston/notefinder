import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { TrackStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

async function startLyricsExtraction(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const track = await prisma.track.findFirst({
    where: { id },
  });

  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  await prisma.track.update({
    where: { id },
    data: {
      status: TrackStatus.EXTRACTING_LYRICS,
    },
  });

  const client = new SQSClient({
    region: process.env.CUSTOM_AWS_REGION_NAME!,
    credentials: {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const messageBody = JSON.stringify({ track, externalTrack: {} });

  const command = new SendMessageCommand({
    MessageBody: messageBody,
    QueueUrl: process.env.ADD_NOTES_QUEUE_URL!,
  });

  const result = await client.send(command);

  const jobId = result.MessageId;

  if (!jobId) {
    return NextResponse.json(
      { error: 'Failed to start lyrics extraction job' },
      { status: 500 },
    );
  }

  await prisma.track.update({
    where: { id },
    data: { jobId },
  });

  return NextResponse.json(
    {
      message: `Started a lyrics extraction job for track ${track.id} at ${jobId}`,
    },
    { status: 200 },
  );
}

export const POST = withMiddleware(apiKeyMiddleware, startLyricsExtraction);
