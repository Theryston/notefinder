'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { YouTubeRoot, YouTubeApi } from './youtube-player';
import { TimelineViewport } from './viewport';
import { TimelineControls } from './controls';
import { estimateKey, fromMidiToNote, toMidiFromNote } from './utils';
import { MaximizeIcon, XIcon } from 'lucide-react';
import screenfull from 'screenfull';
import { isMobile } from 'react-device-detect';
import { cn } from '@/lib/utils';

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
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubeApi | null>(null);
  const rafRef = useRef<number | null>(null);
  const loopRef = useRef(false);
  const speedRef = useRef(1);
  const isPlayingRef = useRef(false);
  // Removed one-time centering when paused; we will only center when explicitly requested
  const lastTimeRef = useRef(0);
  const muteRef = useRef(false);
  const orientationWatchRef = useRef<NodeJS.Timeout | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  const semitoneSpan = useMemo(
    () => Math.max(1, maxMidi - minMidi + 1),
    [maxMidi, minMidi],
  );

  const [viewportHeight, setViewportHeight] = useState<number>(height);
  const [pxPerSemitone, setPxPerSemitone] = useState<number>(PX_PER_OCTAVE);
  const pxPerSemitoneRef = useRef(pxPerSemitone);
  const viewportHeightRef = useRef(viewportHeight);
  useEffect(() => {
    pxPerSemitoneRef.current = pxPerSemitone;
  }, [pxPerSemitone]);
  useEffect(() => {
    viewportHeightRef.current = viewportHeight;
  }, [viewportHeight]);

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
    const behavior: ScrollBehavior = isPlayingRef.current ? 'follow' : 'none';
    updateProgressUi(t || 0, behavior);

    // Track last time for potential future logic; no auto-centering while paused
    lastTimeRef.current = t || 0;
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

  const requestFullscreen = useCallback(async () => {
    if (!fullscreenRef.current) return;

    await screenfull.request(fullscreenRef.current, {
      navigationUI: 'hide',
    });
  }, []);

  const exitFullscreen = useCallback(async () => {
    await screenfull.exit();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) exitFullscreen();
    else requestFullscreen();
  }, [isFullscreen, exitFullscreen, requestFullscreen]);

  useEffect(() => {
    const handleOrientation = async () => {
      try {
        const screen = window.screen as { orientation: ScreenOrientation };

        if (screen.orientation) {
          if (screen.orientation.type.includes('portrait')) {
            await (
              screen.orientation as unknown as {
                lock: (type: string) => Promise<void>;
              }
            ).lock('landscape');
          } else {
            screen.orientation.unlock();
          }
        }
      } catch (error) {
        console.error('Erro ao virar a tela', error);
      }
    };

    screenfull.onchange(() => {
      if (!screenfull.isFullscreen || !isMobile) return;
      handleOrientation();
    });
  }, []);

  useEffect(() => {
    function getVisualViewportHeight() {
      return Math.floor(
        (window.visualViewport?.height ?? window.innerHeight) || 0,
      );
    }

    const recompute = () => {
      const containerH = fullscreenRef.current?.clientHeight ?? 0;
      const targetH = isFullscreen
        ? getVisualViewportHeight()
        : Math.floor(containerH);
      const fallback = height;
      const finalTarget = targetH > 0 ? targetH : fallback;
      const usable = Math.max(0, finalTarget - 40);
      const perSemitone = usable > 0 ? usable / semitoneSpan : PX_PER_OCTAVE;
      if (Math.abs(pxPerSemitoneRef.current - perSemitone) > 0.5) {
        pxPerSemitoneRef.current = perSemitone;
        setPxPerSemitone(perSemitone);
      }
      if (Math.abs(viewportHeightRef.current - finalTarget) > 1) {
        viewportHeightRef.current = finalTarget;
        setViewportHeight(finalTarget);
      }
    };

    const ro = new ResizeObserver(recompute);
    if (fullscreenRef.current) ro.observe(fullscreenRef.current);

    window.addEventListener('resize', recompute);
    window.addEventListener('orientationchange', recompute);
    recompute();

    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('orientationchange', recompute);
      ro.disconnect();
    };
  }, [isFullscreen, semitoneSpan, height]);

  useEffect(() => {
    function onFsChange() {
      const el = fullscreenRef.current;
      const active =
        document.fullscreenElement === el ||
        (document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement === el;
      setIsFullscreen(Boolean(active));
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener(
      'webkitfullscreenchange',
      onFsChange as EventListener,
    );
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        onFsChange as EventListener,
      );
    };
  }, []);

  const seekTo = useCallback(
    (t: number, behavior: ScrollBehavior = 'none') => {
      const clamped = Math.max(0, Math.min(t, duration || maxEnd));
      // Update UI immediately to avoid a brief jump back to previous position
      setCurrentTime(clamped);
      updateProgressUi(clamped, behavior);
      lastTimeRef.current = clamped;
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

  useEffect(() => {
    const handleOrientation = () =>
      setIsPortrait(screen.orientation.type.includes('portrait'));
    if (orientationWatchRef.current) clearInterval(orientationWatchRef.current);
    orientationWatchRef.current = setInterval(handleOrientation, 1000);

    return () => {
      if (orientationWatchRef.current)
        clearInterval(orientationWatchRef.current);
      orientationWatchRef.current = null;
    };
  }, []);

  const shouldShowAlert = useMemo(() => {
    return isMobile && (!isFullscreen || isPortrait);
  }, [isFullscreen, isPortrait]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start">
          <div className="space-y-3">
            <div
              ref={fullscreenRef}
              className={cn(
                'relative rounded-lg border bg-card',
                shouldShowAlert && 'h-80 overflow-hidden',
              )}
            >
              {shouldShowAlert && (
                <div className="flex flex-col p-4 gap-4 absolute -top-4 -left-4 -right-4 -bottom-4 z-50 bg-background/60 backdrop-blur flex justify-center items-center">
                  <p className="text-sm text-muted-foreground text-center">
                    {!isFullscreen ? (
                      'Por favor, expanda a linha do tempo para ver as notas da música!'
                    ) : (
                      <>
                        Por favor, coloque seu celular na <b>horizontal</b> para
                        ver as notas da música!
                      </>
                    )}
                  </p>
                  {!isFullscreen && (
                    <Button variant="outline" onClick={requestFullscreen}>
                      Expandir linha do tempo
                    </Button>
                  )}
                </div>
              )}

              <Button
                aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                variant="outline"
                onClick={toggleFullscreen}
                className="absolute top-2 right-2 z-30"
                size="icon"
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <XIcon /> : <MaximizeIcon />}
              </Button>

              <TimelineViewport
                containerRef={containerRef as React.RefObject<HTMLDivElement>}
                progressRef={progressRef as React.RefObject<HTMLDivElement>}
                width={width}
                height={viewportHeight}
                notes={displayNotes as Note[]}
                pxPerSecond={PX_PER_SECOND}
                pxPerOctave={pxPerSemitone}
                maxMidi={maxMidi}
                onSeek={(t) =>
                  seekTo(t, isPlayingRef.current ? 'center' : 'none')
                }
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

              {isFullscreen && (
                <div
                  className={cn(
                    'pointer-events-auto absolute top-4 left-4 z-30',
                    isMobile && 'w-1/3',
                    !isMobile && 'w-1/6',
                  )}
                >
                  <div className="rounded-xl border bg-card p-3 shadow flex flex-col gap-3 w-full">
                    <div
                      className={cn(
                        'aspect-video w-full',
                        isFullscreen && isMobile && 'h-20',
                      )}
                    >
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
              )}
            </div>
          </div>

          {!isFullscreen && !shouldShowAlert && (
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
          )}
        </div>
      </div>
    </>
  );
}
