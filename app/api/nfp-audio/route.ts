import { apiKeyMiddleware } from '@/lib/api-key-middleware';
import prisma from '@/lib/prisma';
import { withMiddleware } from '@/lib/with-middleware';
import { NextResponse } from 'next/server';
import {
  EC2Client,
  CancelSpotInstanceRequestsCommand,
} from '@aws-sdk/client-ec2';

async function createNfpAudioProcess(request: Request) {
  const { duration, trackId, instanceType } = await request.json();

  console.log(
    `Got new nfp audio process request: ${duration} seconds, ${instanceType}, ${trackId}`,
  );

  if (!trackId) {
    return NextResponse.json(
      { error: 'Track ID is required!' },
      { status: 400 },
    );
  }

  await prisma.nfpAudioProcess.create({
    data: {
      trackId,
      duration,
      instanceType,
    },
  });

  const ec2Client = new EC2Client({
    region: process.env.CUSTOM_AWS_REGION_NAME!,
    credentials: {
      accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
    },
  });

  const notCanceledSpotRequests =
    await prisma.nfpAudioProcessSpotRequest.findMany({
      where: {
        trackId,
        isCanceled: false,
      },
    });

  console.log(
    `Found ${notCanceledSpotRequests.length} not canceled spot requests for track ${trackId}`,
  );

  for (const spotRequest of notCanceledSpotRequests) {
    try {
      await ec2Client.send(
        new CancelSpotInstanceRequestsCommand({
          SpotInstanceRequestIds: [spotRequest.spotId],
        }),
      );

      await prisma.nfpAudioProcessSpotRequest.update({
        where: { id: spotRequest.id },
        data: { isCanceled: true },
      });

      console.log(
        `Canceled spot request ${spotRequest.spotId} for track ${trackId}`,
      );
    } catch (error) {
      console.error(
        `Error canceling spot request ${spotRequest.spotId} for track ${trackId}: ${error}`,
      );
    }
  }

  return NextResponse.json(
    {
      message: `NFP audio process created for track ${trackId}`,
    },
    { status: 201 },
  );
}

export const POST = withMiddleware(apiKeyMiddleware, createNfpAudioProcess);
