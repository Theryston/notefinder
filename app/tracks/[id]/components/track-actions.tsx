import { Suspense } from 'react';
import { FavoriteButton } from './favorite-button';
import { Skeleton } from '@/components/sheleton';
import { ShareButton } from './share-button';

export function TrackActions({
  trackTitle,
  trackId,
}: {
  trackTitle: string | null;
  trackId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 h-fit w-fit">
      <Suspense fallback={<ButtonFallback />}>
        <FavoriteButton trackId={trackId} />
      </Suspense>

      <Suspense fallback={<ButtonFallback />}>
        <ShareButton trackTitle={trackTitle} />
      </Suspense>
    </div>
  );
}

function ButtonFallback() {
  return (
    <div className="size-9">
      <Skeleton />
    </div>
  );
}
