import { TrackStatus } from '@prisma/client';
import { ProcessingTrackContent } from './content';
import { Suspense } from 'react';

export async function ProcessingTrack({
  id,
  defaultStatus,
  defaultStatusDescription,
}: {
  id: string;
  defaultStatus: TrackStatus;
  defaultStatusDescription?: string;
}) {
  return (
    <Suspense fallback={null}>
      <Content
        id={id}
        defaultStatus={defaultStatus}
        defaultStatusDescription={defaultStatusDescription}
      />
    </Suspense>
  );
}

async function Content({
  id,
  defaultStatus,
  defaultStatusDescription,
}: {
  id: string;
  defaultStatus: TrackStatus;
  defaultStatusDescription?: string;
}) {
  return (
    <ProcessingTrackContent
      id={id}
      defaultStatus={defaultStatus}
      defaultStatusDescription={defaultStatusDescription}
    />
  );
}
