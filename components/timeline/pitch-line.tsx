'use client';

import { useEffect, useRef, useState } from 'react';
import type { PitchData } from './use-pitch-detection';

type PitchPoint = {
  time: number;
  midi: number;
  isGap?: boolean;
};

const TRAIL_DURATION_SECONDS = 3; // How long the trail lasts
const MAX_POINTS = 100; // Maximum number of points to keep
const SILENCE_THRESHOLD = 0.95; // Clarity threshold for valid pitch
const GAP_THRESHOLD_SECONDS = 0.3; // Se o gap na timeline for maior que 0.3s, quebra a linha
const MAX_MIDI_JUMP = 12; // Pulos maiores que 12 semitons (1 oitava) também quebram a linha

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
  const lastCurrentTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setPitchHistory([]);
      lastCurrentTimeRef.current = 0;
      return;
    }

    const now = performance.now();

    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    setPitchHistory((prev) => {
      if (currentTime === undefined) return prev;

      const hasSeekBackwards = currentTime < lastCurrentTimeRef.current - 0.5;
      lastCurrentTimeRef.current = currentTime;

      let cleanedHistory = prev;
      if (hasSeekBackwards) {
        cleanedHistory = prev.filter((p) => p.time <= currentTime);
      }

      if (pitchData && pitchData.clarity >= SILENCE_THRESHOLD) {
        const lastPoint = cleanedHistory[cleanedHistory.length - 1];
        let hasGap = false;

        if (lastPoint) {
          const timeDiff = currentTime - lastPoint.time;
          const midiDiff = Math.abs(pitchData.midi - lastPoint.midi);

          hasGap = timeDiff > GAP_THRESHOLD_SECONDS || midiDiff > MAX_MIDI_JUMP;
        }

        const newPoint: PitchPoint = {
          time: currentTime,
          midi: pitchData.midi,
          isGap: hasGap || cleanedHistory.length === 0,
        };

        const updated = [...cleanedHistory, newPoint];

        const filtered = updated.filter(
          (p) => currentTime - p.time < TRAIL_DURATION_SECONDS,
        );

        if (filtered.length > MAX_POINTS) {
          return filtered.slice(-MAX_POINTS);
        }

        return filtered;
      }

      const filtered = cleanedHistory.filter(
        (p) =>
          p.time <= currentTime &&
          currentTime - p.time < TRAIL_DURATION_SECONDS,
      );
      return filtered;
    });
  }, [pitchData, currentTime, isActive]);

  useEffect(() => {
    if (!isActive) {
      setPitchHistory([]);
    }
  }, [isActive]);

  if (!isActive || pitchHistory.length < 1) {
    return null;
  }

  const clampY = (rawY: number) => {
    if (typeof height !== 'number' || height <= 0) return rawY;
    const yMin = 20;
    const yMax = Math.max(yMin, height - 20);
    return Math.min(yMax, Math.max(yMin, rawY));
  };

  const pathSegments: string[] = [];
  let currentSegment: string[] = [];

  pitchHistory.forEach((point, index) => {
    const x = point.time * pxPerSecond;
    const y = clampY((maxMidi - point.midi) * pxPerOctave + 20);

    if (point.isGap || index === 0) {
      if (currentSegment.length > 0) {
        pathSegments.push(currentSegment.join(' '));
      }
      currentSegment = [`M ${x} ${y}`];
    } else if (index === 1 && !point.isGap) {
      currentSegment.push(`L ${x} ${y}`);
    } else if (!point.isGap) {
      currentSegment.push(`L ${x} ${y}`);
    }
  });

  if (currentSegment.length > 0) {
    pathSegments.push(currentSegment.join(' '));
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15, width, height }}
      width={width}
      height={height}
    >
      <defs>
        <linearGradient id="pitch-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.9" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {pathSegments.map((segment, index) => (
        <path
          key={index}
          d={segment}
          fill="none"
          stroke="url(#pitch-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />
      ))}

      {pitchData && pitchData.clarity >= SILENCE_THRESHOLD && (
        <circle
          cx={currentTime * pxPerSecond}
          cy={clampY((maxMidi - pitchData.midi) * pxPerOctave + 20)}
          r="6"
          fill="var(--primary)"
          stroke="white"
          strokeWidth="2"
          filter="url(#glow)"
        />
      )}
    </svg>
  );
}
