'use client';

import { useEffect, useRef } from 'react';
import { createTrackView } from '../actions';

export function AddView({ trackId }: { trackId: string }) {
  const isFetching = useRef(false);

  useEffect(() => {
    if (!trackId) return;
    if (isFetching.current) return;
    isFetching.current = true;

    createTrackView({
      trackId,
      oldTrackViewId:
        sessionStorage.getItem(`track_view_${trackId}`) || undefined,
    })
      .then((trackViewId) => {
        if (!trackViewId) return;
        sessionStorage.setItem(`track_view_${trackId}`, trackViewId);
      })
      .finally(() => {
        isFetching.current = false;
      });
  }, [trackId]);

  return null;
}
