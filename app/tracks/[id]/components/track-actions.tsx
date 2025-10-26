import { Suspense } from 'react';
import { FavoriteButton } from './favorite-button';
import { Skeleton } from '@/components/sheleton';
import { ShareButton } from './share-button';

export function TrackActions({
  trackTitle,
  trackId,
  ytId,
}: {
  trackTitle: string | null;
  trackId: string;
  ytId: string;
}) {
  return (
    <div className="flex flex-wrap gap-2 h-fit w-fit">
      <Suspense fallback={<ButtonFallback />}>
        <FavoriteButton trackId={trackId} />
      </Suspense>

      <Suspense fallback={<ButtonFallback />}>
        <ShareButton trackTitle={trackTitle} ytId={ytId} />
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
