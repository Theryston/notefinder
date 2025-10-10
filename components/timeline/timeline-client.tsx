'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { YouTubeRoot, YouTubeApi } from './youtube-player';
import { TimelineViewport } from './viewport';
import { TimelineControls } from './controls';
import { estimateKey, fromMidiToNote, toMidiFromNote } from './utils';

type Note = {
  note: string;
  octave: number;
  start: number;
  end: number;
  frequency_mean?: number;
};

const PX_PER_SECOND = 100;
const PX_PER_OCTAVE = 30;
const SILENCE_GAP_THRESHOLD_SECONDS = 10;
const NEXT_NOTE_PRE_ROLL_SECONDS = 1;

export function TimelineClient({
  ytId,
  notes,
}: {
  ytId: string;
  notes: Note[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubeApi | null>(null);
  const rafRef = useRef<number | null>(null);
  const loopRef = useRef(false);
  const speedRef = useRef(1);
  const isPlayingRef = useRef(false);
  const centerOnceRef = useRef(false);
  const lastTimeRef = useRef(0);
  const muteRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [transpose, setTranspose] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const displayNotes = useMemo(() => {
    const mapped = (notes || []).map((n) => {
      const baseMidi = toMidiFromNote(n.note, n.octave);
      const transposedMidi = baseMidi + transpose;
      const { note, octave } = fromMidiToNote(transposedMidi);
      return { ...n, note, octave, _midi: transposedMidi } as Note & {
        _midi: number;
      };
    });
    return mapped;
  }, [notes, transpose]);

  const [minMidi, maxMidi, maxEnd] = useMemo(() => {
    if (!displayNotes.length) return [0, 0, 0] as const;
    let min = Infinity,
      max = -Infinity,
      end = 0;
    for (const n of displayNotes as (Note & { _midi?: number })[]) {
      const m =
        typeof n._midi === 'number'
          ? n._midi
          : toMidiFromNote(n.note, n.octave);
      if (m < min) min = m;
      if (m > max) max = m;
      if (n.end > end) end = n.end;
    }
    return [min, max, end] as const;
  }, [displayNotes]);

  const estimatedKey = useMemo(() => estimateKey(displayNotes), [displayNotes]);

  const width = useMemo(
    () => Math.max(duration, maxEnd) * PX_PER_SECOND + 100,
    [duration, maxEnd],
  );
  const height = useMemo(
    () => (maxMidi - minMidi + 1) * PX_PER_OCTAVE + 40,
    [maxMidi, minMidi],
  );

  type ScrollBehavior = 'none' | 'follow' | 'center';
  const updateProgressUi = useCallback(
    (t: number, behavior: ScrollBehavior) => {
      if (!progressRef.current || !containerRef.current) return;
      const left = t * PX_PER_SECOND;
      progressRef.current.style.left = `${left}px`;

      const container = containerRef.current;
      if (behavior === 'follow') {
        const viewLeft = container.scrollLeft;
        const thresholdLeft = viewLeft + container.clientWidth * 0.2;
        const thresholdRight = viewLeft + container.clientWidth * 0.8;
        if (left < thresholdLeft) {
          container.scrollLeft = Math.max(
            0,
            left - container.clientWidth * 0.4,
          );
        } else if (left > thresholdRight) {
          container.scrollLeft = left - container.clientWidth * 0.6;
        }
      } else if (behavior === 'center') {
        const targetScroll = Math.max(0, left - container.clientWidth / 2);
        container.scrollLeft = targetScroll;
      }
    },
    [],
  );

  const tick = useCallback(() => {
    if (!playerRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const t = playerRef.current.getCurrentTime();
    const d = playerRef.current.getDuration();
    setDuration(d || 0);
    setCurrentTime(t || 0);
    // Determine scroll behavior
    let behavior: ScrollBehavior = 'none';
    if (isPlayingRef.current) {
      behavior = 'follow';
    } else if (centerOnceRef.current) {
      behavior = 'center';
      centerOnceRef.current = false;
    }
    updateProgressUi(t || 0, behavior);

    // Detect external seek while paused (user scrubbing in YT controls)
    const prev = lastTimeRef.current;
    const dt = Math.abs((t || 0) - prev);
    lastTimeRef.current = t || 0;
    if (!isPlayingRef.current && dt > 0.25) {
      centerOnceRef.current = true;
    }
    if (d && t >= d) {
      if (loopRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      } else {
        setIsPlaying(false);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [updateProgressUi]);

  const attachPlayer = useCallback(
    (api: YouTubeApi) => {
      playerRef.current = api;
      setDuration(api.getDuration());
      setCurrentTime(api.getCurrentTime());
      api.setPlaybackRate(speedRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick],
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  useEffect(() => {
    speedRef.current = speed;
    playerRef.current?.setPlaybackRate(speed);
  }, [speed]);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    const playing = playerRef.current.isPlaying();
    if (playing) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handleSpeedChange = useCallback((v: number) => {
    setSpeed(v);
  }, []);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const seekTo = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(t, duration || maxEnd));
      // Update UI immediately to avoid a brief jump back to previous position
      setCurrentTime(clamped);
      updateProgressUi(clamped, 'center');
      lastTimeRef.current = clamped;
      centerOnceRef.current = false;
      playerRef.current?.seekTo(clamped);
    },
    [duration, maxEnd, updateProgressUi],
  );

  const nextStart = useMemo(() => {
    const starts = (displayNotes as Note[])
      .map((n) => n.start)
      .filter((s) => s > currentTime)
      .sort((a, b) => a - b);
    return starts[0];
  }, [displayNotes, currentTime]);

  const shouldShowNext = useMemo(() => {
    return (
      typeof nextStart === 'number' &&
      nextStart - currentTime >= SILENCE_GAP_THRESHOLD_SECONDS &&
      currentTime < nextStart - NEXT_NOTE_PRE_ROLL_SECONDS
    );
  }, [nextStart, currentTime]);

  const nextTarget = useMemo(() => {
    if (typeof nextStart !== 'number') return 0;
    return Math.max(0, nextStart - NEXT_NOTE_PRE_ROLL_SECONDS);
  }, [nextStart]);

  const handleMute = useCallback(() => {
    muteRef.current = !muteRef.current;

    if (muteRef.current) {
      playerRef.current?.mute();
    } else {
      playerRef.current?.unMute();
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
        <div className="space-y-3">
          <div className="relative rounded-lg border bg-card p-3">
            <TimelineViewport
              containerRef={containerRef as React.RefObject<HTMLDivElement>}
              progressRef={progressRef as React.RefObject<HTMLDivElement>}
              width={width}
              height={height}
              notes={displayNotes as Note[]}
              pxPerSecond={PX_PER_SECOND}
              pxPerOctave={PX_PER_OCTAVE}
              maxMidi={maxMidi}
              onSeek={seekTo}
            />

            {shouldShowNext && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => seekTo(nextTarget)}
                >
                  próximas notas -&gt;
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
          <div className="aspect-video w-full">
            <YouTubeRoot
              ytId={ytId}
              onReady={attachPlayer}
              onPlay={handlePlay}
              onPause={handlePause}
            />
          </div>
          <TimelineControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            isLoading={false}
            speed={speed}
            onSpeedChange={handleSpeedChange}
            transpose={transpose}
            onTransposeInc={() => setTranspose((t) => t + 1)}
            onTransposeDec={() => setTranspose((t) => t - 1)}
            estimatedKey={estimatedKey}
            currentTime={currentTime}
            duration={duration || Math.max(duration, maxEnd)}
            mute={muteRef.current}
            onMute={handleMute}
          />
        </div>
      </div>
    </div>
  );
}
