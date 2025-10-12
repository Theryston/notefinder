import { auth } from '@/auth';
import { TrackStatus } from '@prisma/client';
import { ProcessingTrackContent } from './content';
import { Suspense } from 'react';

export async function ProcessingTrack({
  id,
  defaultStatus,
  defaultStatusDescription,
  creatorId,
}: {
  id: string;
  defaultStatus: TrackStatus;
  defaultStatusDescription?: string;
  creatorId: string;
}) {
  return (
    <Suspense fallback={null}>
      <Content
        id={id}
        defaultStatus={defaultStatus}
        defaultStatusDescription={defaultStatusDescription}
        creatorId={creatorId}
      />
    </Suspense>
  );
}

async function Content({
  id,
  defaultStatus,
  defaultStatusDescription,
  creatorId,
}: {
  id: string;
  defaultStatus: TrackStatus;
  defaultStatusDescription?: string;
  creatorId: string;
}) {
  const session = await auth();

  return (
    <ProcessingTrackContent
      id={id}
      defaultStatus={defaultStatus}
      defaultStatusDescription={defaultStatusDescription}
      isCreator={session?.user?.id === creatorId}
    />
  );
}
