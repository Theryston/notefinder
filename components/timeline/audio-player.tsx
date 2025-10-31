'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type React from 'react';
import * as Tone from 'tone';

export type YouTubeApi = {
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  mute: () => void;
  unMute: () => void;
};

export function AudioRoot({
  url,
  onReady,
  onPlay,
  onPause,
  allowAudioTranspose,
  transpose,
}: {
  url: string;
  onReady?: (api: YouTubeApi) => void;
  onPlay?: () => void;
  onPause?: () => void;
  allowAudioTranspose: boolean;
  transpose: number;
}) {
  const playerRef = useRef<Tone.Player | null>(null);
  const apiRef = useRef<YouTubeApi | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const pitchRef = useRef<Tone.PitchShift | null>(null);

  const isPlayingRef = useRef(false);
  const startedAtContextTimeRef = useRef(0);
  const pausedAtSecondsRef = useRef(0);
  const durationRef = useRef(0);
  const playbackRateRef = useRef(1);
  const mutedRef = useRef(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peaksRef = useRef<number[] | null>(null);
  const rafRef = useRef<number | null>(null);

  const onReadyRef = useRef(onReady);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    onPlayRef.current = onPlay;
  }, [onPlay]);
  useEffect(() => {
    onPauseRef.current = onPause;
  }, [onPause]);

  const getCurrentTime = useMemo(
    () => () => {
      if (!isPlayingRef.current) return pausedAtSecondsRef.current;
      const now = Tone.now();
      const delta = now - startedAtContextTimeRef.current;
      return Math.max(
        0,
        Math.min(
          durationRef.current,
          pausedAtSecondsRef.current + delta * playbackRateRef.current,
        ),
      );
    },
    [],
  );

  const getApi = useMemo<YouTubeApi>(
    () => ({
      play: async () => {
        if (!playerRef.current) return;
        if (Tone.context.state !== 'running') {
          try {
            await Tone.start();
          } catch {}
        }
        try {
          playerRef.current.playbackRate = playbackRateRef.current;
          playerRef.current.start(undefined, pausedAtSecondsRef.current);
          startedAtContextTimeRef.current = Tone.now();
          isPlayingRef.current = true;
          onPlayRef.current?.();
        } catch {}
      },
      pause: () => {
        if (!playerRef.current) return;
        try {
          pausedAtSecondsRef.current = getCurrentTime();
          playerRef.current.stop();
          isPlayingRef.current = false;
          onPauseRef.current?.();
        } catch {}
      },
      isPlaying: () => isPlayingRef.current,
      seekTo: (seconds: number) => {
        if (!playerRef.current) return;
        const clamped = Math.max(0, Math.min(seconds, durationRef.current));
        pausedAtSecondsRef.current = clamped;
        try {
          if (isPlayingRef.current) {
            playerRef.current.stop();
            playerRef.current.start(undefined, clamped);
            startedAtContextTimeRef.current = Tone.now();
          } else {
            if (typeof playerRef.current.seek === 'function') {
              playerRef.current.seek(clamped);
            }
          }
        } catch {}
      },
      getCurrentTime,
      getDuration: () => durationRef.current || 0,
      setPlaybackRate: (rate: number) => {
        playbackRateRef.current = Math.max(0.25, Math.min(rate, 3));
        if (playerRef.current) {
          const wasPlaying = isPlayingRef.current;
          const current = getCurrentTime();
          pausedAtSecondsRef.current = current;
          startedAtContextTimeRef.current = Tone.now();
          playerRef.current.playbackRate = playbackRateRef.current;
          if (wasPlaying) {
            try {
              playerRef.current.stop();
              playerRef.current.start(undefined, pausedAtSecondsRef.current);
            } catch {}
          }
        }
      },
      mute: () => {
        mutedRef.current = true;
        if (playerRef.current) playerRef.current.mute = true;
      },
      unMute: () => {
        mutedRef.current = false;
        if (playerRef.current) playerRef.current.mute = false;
      },
    }),
    [getCurrentTime],
  );

  function computePeaks(buffer: AudioBuffer, bars: number) {
    const channelLeft = buffer.getChannelData(0);
    const channelRight =
      buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : channelLeft;
    const samples = buffer.length;
    const windowSize = Math.max(1, Math.floor(samples / bars));
    const peaks: number[] = new Array(bars).fill(0);
    let globalMax = 0;
    for (let i = 0; i < bars; i++) {
      const start = i * windowSize;
      const end =
        i === bars - 1 ? samples : Math.min(samples, start + windowSize);
      let peak = 0;
      for (let j = start; j < end; j += 64) {
        const l = Math.abs(channelLeft[j] || 0);
        const r = Math.abs(channelRight[j] || 0);
        const v = Math.max(l, r);
        if (v > peak) peak = v;
      }
      peaks[i] = peak;
      if (peak > globalMax) globalMax = peak;
    }
    const norm = globalMax > 0 ? 1 / globalMax : 1;
    for (let i = 0; i < bars; i++) peaks[i] *= norm;
    return peaks;
  }

  function getColors() {
    const primary = getComputedStyle(document.documentElement).getPropertyValue(
      '--primary',
    );
    const muted = getComputedStyle(document.documentElement).getPropertyValue(
      '--muted-foreground',
    );
    return { primary, muted };
  }

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const peaks = peaksRef.current;
    if (!canvas || !container || !peaks) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.floor(container.clientWidth);
    const height = Math.floor(container.clientHeight);
    if (width <= 0 || height <= 0) return;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const { primary, muted } = getColors();
    const barCount = peaks.length;
    const paddingX = 6;
    const usableW = Math.max(0, width - paddingX * 2);
    const step = usableW / barCount;
    const barW = Math.max(1, Math.floor(step * 0.7));
    const centerY = height / 2;
    const maxBarH = Math.max(2, Math.floor(height * 0.9) / 2);

    const progress =
      durationRef.current > 0
        ? Math.min(1, Math.max(0, getCurrentTime() / durationRef.current))
        : 0;
    const progressBars = Math.floor(barCount * progress);

    for (let i = 0; i < barCount; i++) {
      const amp = peaks[i] || 0;
      const h = Math.max(1, Math.floor(amp * maxBarH));
      const x = paddingX + i * step + (step - barW) / 2;
      ctx.fillStyle = i < progressBars ? primary : muted;
      ctx.fillRect(x, centerY - h, barW, h * 2);
    }
  }, [getCurrentTime]);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const loop = () => {
      drawWaveform();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [drawWaveform]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || durationRef.current <= 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const targetSeconds = durationRef.current * ratio;
      apiRef.current?.seekTo(targetSeconds);
    },
    [],
  );

  const cleanup = () => {
    if (playerRef.current) {
      try {
        playerRef.current.stop();
        playerRef.current.dispose();
      } catch {}
    }

    if (pitchRef.current) {
      try {
        try {
          pitchRef.current.disconnect();
        } catch {}
        pitchRef.current.dispose();
      } catch {}
    }

    playerRef.current = null;
    isPlayingRef.current = false;
    peaksRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pitchRef.current = null;
  };

  useEffect(() => {
    cleanup();

    const player = new Tone.Player({
      url,
      autostart: false,
      loop: false,
      onload: () => {
        durationRef.current = player.buffer.duration || 0;
        player.playbackRate = playbackRateRef.current;
        player.mute = mutedRef.current;
        try {
          const ab = (
            player.buffer as unknown as {
              get?: () => AudioBuffer;
              toArray?: () => Float32Array[];
            }
          ).get?.();
          if (ab) bufferRef.current = ab;
        } catch {}
        if (!apiRef.current) apiRef.current = getApi;
        onReadyRef.current?.(apiRef.current);

        const container = containerRef.current;
        if (bufferRef.current && container) {
          const width = Math.max(100, container.clientWidth);
          const desiredBars = Math.min(
            800,
            Math.max(80, Math.floor(width / 3)),
          );
          peaksRef.current = computePeaks(bufferRef.current, desiredBars);
          drawWaveform();
          scheduleDraw();
        }
      },
    });

    // Initial routing: either through pitch shifter (transpose) or straight to destination
    try {
      if (allowAudioTranspose) {
        pitchRef.current = new Tone.PitchShift({ pitch: transpose });
        player.connect(pitchRef.current);
        pitchRef.current.toDestination();
      } else {
        player.toDestination();
      }
    } catch {}

    playerRef.current = player;

    return cleanup;
    // We intentionally exclude allowAudioTranspose/transpose here to avoid
    // recreating the player and refetching when only pitch changes.
    // Pitch routing is handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, getApi, drawWaveform, scheduleDraw]);

  // React to transpose/allowAudioTranspose changes without recreating the Player
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    try {
      if (allowAudioTranspose) {
        if (!pitchRef.current) {
          // Switch to transposed chain
          player.disconnect();
          pitchRef.current = new Tone.PitchShift({ pitch: transpose });
          player.connect(pitchRef.current);
          pitchRef.current.toDestination();
        } else {
          // Update semitone shift
          pitchRef.current.pitch = transpose;
        }
      } else {
        if (pitchRef.current) {
          // Bypass and remove pitch shifting
          player.disconnect();
          try {
            pitchRef.current.disconnect();
          } catch {}
          pitchRef.current.dispose();
          pitchRef.current = null;
          player.toDestination();
        }
      }
    } catch {}
  }, [allowAudioTranspose, transpose]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      if (!bufferRef.current || !container) return;
      const width = Math.max(100, container.clientWidth);
      const desiredBars = Math.min(800, Math.max(80, Math.floor(width / 3)));
      peaksRef.current = computePeaks(bufferRef.current, desiredBars);
      drawWaveform();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [drawWaveform]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onClick={handleCanvasClick}
      />
    </div>
  );
}
