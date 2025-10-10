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
const GAP_THRESHOLD_MS = 500; // Se ficar mais de 500ms sem som, considera um gap

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
  const lastValidPitchTimeRef = useRef<number>(0);
  const lastCurrentTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      setPitchHistory([]);
      lastValidPitchTimeRef.current = 0;
      lastCurrentTimeRef.current = 0;
      return;
    }

    const now = performance.now();

    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    setPitchHistory((prev) => {
      if (currentTime === undefined) return prev;

      // Detecta se houve um "seek" para trás na timeline
      const hasSeekBackwards = currentTime < lastCurrentTimeRef.current - 0.5; // 0.5s de tolerância
      lastCurrentTimeRef.current = currentTime;

      // Se voltou na timeline, remove todos os pontos que estão à frente
      let cleanedHistory = prev;
      if (hasSeekBackwards) {
        cleanedHistory = prev.filter((p) => p.time <= currentTime);
      }

      if (pitchData && pitchData.clarity >= SILENCE_THRESHOLD) {
        const timeSinceLastPitch = now - lastValidPitchTimeRef.current;
        lastValidPitchTimeRef.current = now;

        const newPoint: PitchPoint = {
          time: currentTime,
          midi: pitchData.midi,
          isGap: timeSinceLastPitch > GAP_THRESHOLD_MS,
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

      // Remove pontos antigos e pontos à frente
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

  const pathSegments: string[] = [];
  let currentSegment: string[] = [];

  pitchHistory.forEach((point, index) => {
    const x = point.time * pxPerSecond;
    const y = (maxMidi - point.midi) * pxPerOctave + 20;

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
