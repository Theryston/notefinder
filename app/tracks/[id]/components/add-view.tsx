'use client';

import { useEffect, useRef } from 'react';
import { createTrackView } from '../actions';

export function AddView({ trackId }: { trackId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formRef.current || !trackId) return;
    if (sessionStorage.getItem(`track_view_${trackId}`)) return;

    formRef.current.requestSubmit();
    sessionStorage.setItem(`track_view_${trackId}`, 'true');
  }, [trackId]);

  return (
    <form action={createTrackView} ref={formRef}>
      <input type="hidden" name="trackId" value={trackId} />
    </form>
  );
}
