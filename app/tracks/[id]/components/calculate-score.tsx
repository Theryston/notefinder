'use client';

import { calculateTrackScore } from '../actions';
import { useEffect } from 'react';

export function CalculateScore({ trackId }: { trackId: string }) {
  useEffect(() => {
    calculateTrackScore(trackId);
  }, [trackId]);

  return null;
}
