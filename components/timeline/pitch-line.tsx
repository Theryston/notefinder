'use client';

import { useEffect, useRef, useState } from 'react';
import type { PitchData } from './use-pitch-detection';

type PitchPoint = {
  time: number;
  midi: number;
};

const TRAIL_DURATION_SECONDS = 3; // How long the trail lasts
const MAX_POINTS = 100; // Maximum number of points to keep

export function PitchLine({
  pitchData,
  currentTime,
  pxPerSecond,
  pxPerOctave,
  maxMidi,
  isActive,
  width,
  height,
}: {
  pitchData: PitchData | null;
  currentTime: number;
  pxPerSecond: number;
  pxPerOctave: number;
  maxMidi: number;
  isActive: boolean;
  width: number;
  height: number | string;
}) {
  const [pitchHistory, setPitchHistory] = useState<PitchPoint[]>([]);
  const lastUpdateRef = useRef<number>(0);

  // Add new pitch data to history
  useEffect(() => {
    if (!isActive) {
      setPitchHistory([]);
      return;
    }

    if (pitchData && currentTime !== undefined) {
      const now = performance.now();
      // Throttle updates to every 50ms for smoother rendering
      if (now - lastUpdateRef.current < 50) return;
      lastUpdateRef.current = now;

      setPitchHistory((prev) => {
        const newPoint: PitchPoint = {
          time: currentTime,
          midi: pitchData.midi,
        };

        // Add new point
        const updated = [...prev, newPoint];

        // Remove points older than TRAIL_DURATION_SECONDS
        const filtered = updated.filter(
          (p) => currentTime - p.time < TRAIL_DURATION_SECONDS
        );

        // Keep only the most recent MAX_POINTS
        if (filtered.length > MAX_POINTS) {
          return filtered.slice(-MAX_POINTS);
        }

        return filtered;
      });
    }
  }, [pitchData, currentTime, isActive]);

  // Clear history when inactive
  useEffect(() => {
    if (!isActive) {
      setPitchHistory([]);
    }
  }, [isActive]);

  if (!isActive || pitchHistory.length < 1) {
    return null;
  }

  // Convert pitch points to SVG path
  const pathData = pitchHistory
    .map((point, index) => {
      const x = point.time * pxPerSecond;
      const y = (maxMidi - point.midi) * pxPerOctave + 20;

      if (index === 0) {
        return `M ${x} ${y}`;
      }

      // Use quadratic bezier curves for smooth line
      if (index === 1) {
        return `L ${x} ${y}`;
      }

      const prevPoint = pitchHistory[index - 1];
      const prevX = prevPoint.time * pxPerSecond;
      const prevY = (maxMidi - prevPoint.midi) * pxPerOctave + 20;

      // Control point for smooth curve
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;

      return `Q ${prevX} ${prevY}, ${x} ${y}`;
    })
    .join(' ');

  // Calculate opacity gradient based on age
  const oldestTime = pitchHistory[0]?.time || currentTime;
  const timeSpan = currentTime - oldestTime;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15, width, height }}
      width={width}
      height={height}
    >
      <defs>
        <linearGradient id="pitch-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Draw the pitch line with glow effect */}
      <path
        d={pathData}
        fill="none"
        stroke="url(#pitch-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Draw current pitch indicator (circle at the end) */}
      {pitchData && (
        <circle
          cx={currentTime * pxPerSecond}
          cy={(maxMidi - pitchData.midi) * pxPerOctave + 20}
          r="6"
          fill="rgb(239, 68, 68)"
          stroke="white"
          strokeWidth="2"
          filter="url(#glow)"
        />
      )}
    </svg>
  );
}
