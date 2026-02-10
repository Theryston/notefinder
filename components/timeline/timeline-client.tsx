'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { YouTubeRoot, YouTubeApi } from './youtube-player';
import { AudioRoot } from './audio-player';
import { TimelineViewport } from './viewport';
import { TimelineControls } from './controls';
import { estimateKey, fromMidiToNote, toMidiFromNote } from './utils';
import { MaximizeIcon, XIcon } from 'lucide-react';
import screenfull from 'screenfull';
import { isMobile } from 'react-device-detect';
import { cn, getStorageKey } from '@/lib/utils';
import { usePitchDetection } from './use-pitch-detection';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import clsx from 'clsx';
import { LyricsDisplay } from './lyrics-display';
import {
  DAILY_STREAK_HEARTBEAT_INTERVAL_MS,
  DAILY_STREAK_MAX_HEARTBEAT_SECONDS,
  type DailyPracticeStreakStatus,
  Lyrics,
} from '@/lib/constants';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DailyStreakHud } from './daily-streak-hud';
import { toast } from 'sonner';

type Note = {
  note: string;
  octave: number;
  start: number;
  end: number;
  frequency_mean?: number;
};

type DailyPracticeHeartbeatResponse = {
  status: DailyPracticeStreakStatus;
  justCompleted: boolean;
  creditedSeconds: number;
};

const PX_PER_SECOND = 100;
const PX_PER_OCTAVE = 30;
const SILENCE_GAP_THRESHOLD_SECONDS = 10;
const NEXT_NOTE_PRE_ROLL_SECONDS = 1;

export function TimelineClient({
  ytId,
  notes,
  lyrics,
  directUrl,
  allowAudioTranspose,
  initialDailyPracticeStreak,
  isLoggedIn,
}: {
  ytId: string;
  notes: Note[];
  lyrics?: Lyrics;
  directUrl?: {
    musicUrl?: string;
    vocalsUrl?: string;
  };
  allowAudioTranspose: boolean;
  initialDailyPracticeStreak: DailyPracticeStreakStatus;
  isLoggedIn: boolean;
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

  const {
    isActive: micActive,
    currentPitch,
    toggle: toggleMic,
  } = usePitchDetection();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [transpose, setTranspose] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const isFollowingRef = useRef(true);
  const [vocalsOnly, setVocalsOnly] = useState(false);
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);
  const [dailyPracticeStreak, setDailyPracticeStreak] = useState(
    initialDailyPracticeStreak,
  );
  const isDailyStreakEnabled = isLoggedIn;
  const [isStreakCelebrating, setIsStreakCelebrating] = useState(false);
  const [isFullscreenStreakExpanded, setIsFullscreenStreakExpanded] =
    useState(false);
  const [streakUiNow, setStreakUiNow] = useState(() => Date.now());
  const pendingPracticeSecondsRef = useRef(0);
  const lastPracticeCaptureAtRef = useRef<number | null>(null);
  const streakFlushQueueRef = useRef<Promise<void>>(Promise.resolve());
  const streakCelebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streakAudioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (vocalsOnly && directUrl?.vocalsUrl) {
      setPlayableUrl(directUrl.vocalsUrl);
    } else {
      setPlayableUrl(directUrl?.musicUrl || null);
    }
  }, [vocalsOnly, directUrl?.vocalsUrl, directUrl?.musicUrl]);

  const lastProgrammaticScrollAtRef = useRef(0);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const isTimelineFocus = searchParams.get('timeline-focus') === 'true';
  const defaultTime = searchParams.get('time')
    ? Number(searchParams.get('time'))
    : undefined;

  const storageKey = getStorageKey(ytId);
  const useDirectAudio = Boolean(directUrl?.musicUrl);
  const [isPlayerLoading, setIsPlayerLoading] =
    useState<boolean>(useDirectAudio);

  useEffect(() => {
    if (playableUrl) {
      setIsPlayerLoading(true);
      setIsPlaying(false);
    }
  }, [playableUrl, directUrl?.vocalsUrl]);

  useEffect(() => {
    isFollowingRef.current = isFollowing;
  }, [isFollowing]);

  useEffect(() => {
    if (currentTime > 0 && isReady) {
      try {
        sessionStorage.setItem(storageKey, currentTime.toString());
      } catch (error) {
        console.error('Erro ao salvar posição da timeline', error);
      }
    }
  }, [currentTime, isReady, storageKey]);

  const triggerStreakCelebration = useCallback(() => {
    setIsStreakCelebrating(true);

    if (streakCelebrationTimeoutRef.current) {
      clearTimeout(streakCelebrationTimeoutRef.current);
    }

    streakCelebrationTimeoutRef.current = setTimeout(() => {
      setIsStreakCelebrating(false);
      streakCelebrationTimeoutRef.current = null;
    }, 1800);
  }, []);

  const playStreakCompletionChime = useCallback(() => {
    if (typeof window === 'undefined') return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) return;

    if (!streakAudioContextRef.current) {
      streakAudioContextRef.current = new AudioContextCtor();
    }

    const ctx = streakAudioContextRef.current;

    const play = () => {
      const now = ctx.currentTime + 0.01;

      const scheduleTone = ({
        start,
        frequency,
        peakGain,
        duration,
        type,
      }: {
        start: number;
        frequency: number;
        peakGain: number;
        duration: number;
        type: OscillatorType;
      }) => {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peakGain, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        gain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, start);
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + duration + 0.03);
      };

      scheduleTone({
        start: now,
        frequency: 783.99,
        peakGain: 0.07,
        duration: 0.32,
        type: 'sine',
      });

      scheduleTone({
        start: now + 0.03,
        frequency: 1046.5,
        peakGain: 0.16,
        duration: 0.52,
        type: 'triangle',
      });

      scheduleTone({
        start: now + 0.18,
        frequency: 1318.51,
        peakGain: 0.15,
        duration: 0.62,
        type: 'triangle',
      });

      scheduleTone({
        start: now + 0.35,
        frequency: 1567.98,
        peakGain: 0.14,
        duration: 0.74,
        type: 'sine',
      });

      scheduleTone({
        start: now + 0.48,
        frequency: 2093,
        peakGain: 0.09,
        duration: 0.6,
        type: 'sine',
      });
    };

    if (ctx.state === 'suspended') {
      void ctx
        .resume()
        .then(play)
        .catch(() => undefined);
      return;
    }

    play();
  }, []);

  const capturePracticeElapsed = useCallback(() => {
    if (!lastPracticeCaptureAtRef.current) return;

    const now = Date.now();
    const elapsedSeconds = (now - lastPracticeCaptureAtRef.current) / 1000;

    if (elapsedSeconds > 0) {
      pendingPracticeSecondsRef.current += elapsedSeconds;
    }

    lastPracticeCaptureAtRef.current = now;
    setStreakUiNow(now);
  }, []);

  const persistPracticeHeartbeat = useCallback(
    async ({ useBeacon = false }: { useBeacon?: boolean } = {}) => {
      if (!isDailyStreakEnabled) return;

      capturePracticeElapsed();
      const elapsedSeconds = Math.min(
        Math.floor(pendingPracticeSecondsRef.current),
        DAILY_STREAK_MAX_HEARTBEAT_SECONDS,
      );

      if (elapsedSeconds <= 0) return;

      pendingPracticeSecondsRef.current -= elapsedSeconds;

      if (
        useBeacon &&
        typeof navigator !== 'undefined' &&
        typeof navigator.sendBeacon === 'function'
      ) {
        const payload = JSON.stringify({ elapsedSeconds });
        const sent = navigator.sendBeacon('/api/streak/heartbeat', payload);

        if (!sent) {
          pendingPracticeSecondsRef.current += elapsedSeconds;
        }

        return;
      }

      try {
        const response = await fetch('/api/streak/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ elapsedSeconds }),
          credentials: 'include',
          keepalive: true,
        });

        if (!response.ok) {
          throw new Error(`Heartbeat failed with status ${response.status}`);
        }

        const payload =
          (await response.json()) as DailyPracticeHeartbeatResponse;

        setDailyPracticeStreak(payload.status);

        if (payload.justCompleted) {
          triggerStreakCelebration();
          playStreakCompletionChime();
          toast.success('Ofensiva mantida! +1 ponto hoje.');
        }
      } catch (error) {
        pendingPracticeSecondsRef.current += elapsedSeconds;
        console.error('Erro ao registrar ofensiva diária', error);
      }
    },
    [
      capturePracticeElapsed,
      isDailyStreakEnabled,
      playStreakCompletionChime,
      triggerStreakCelebration,
    ],
  );

  const queuePracticeFlush = useCallback(
    (options: { useBeacon?: boolean } = {}) => {
      streakFlushQueueRef.current = streakFlushQueueRef.current.then(() =>
        persistPracticeHeartbeat(options),
      );

      return streakFlushQueueRef.current;
    },
    [persistPracticeHeartbeat],
  );

  const livePracticeListenedSeconds = Math.min(
    dailyPracticeStreak.targetSeconds,
    dailyPracticeStreak.listenedSeconds +
      pendingPracticeSecondsRef.current +
      (lastPracticeCaptureAtRef.current
        ? (streakUiNow - lastPracticeCaptureAtRef.current) / 1000
        : 0),
  );

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
          lastProgrammaticScrollAtRef.current = performance.now();
          container.scrollLeft = Math.max(
            0,
            left - container.clientWidth * 0.4,
          );
        } else if (left > thresholdRight) {
          lastProgrammaticScrollAtRef.current = performance.now();
          container.scrollLeft = left - container.clientWidth * 0.6;
        }
      } else if (behavior === 'center') {
        const targetScroll = Math.max(0, left - container.clientWidth / 2);
        lastProgrammaticScrollAtRef.current = performance.now();
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
    const behavior: ScrollBehavior =
      isPlayingRef.current && isFollowingRef.current ? 'follow' : 'none';
    updateProgressUi(t || 0, behavior);

    // Track last time for potential future logic; no auto-centering while paused
    lastTimeRef.current = t || 0;
    if (d && t >= d) {
      if (loopRef.current) {
        playerRef.current.seekTo(0);
        playerRef.current.play();
      } else {
        try {
          sessionStorage.removeItem(storageKey);
        } catch (error) {
          console.error('Erro ao limpar posição salva', error);
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [updateProgressUi, storageKey]);

  const attachPlayer = useCallback(
    (api: YouTubeApi) => {
      playerRef.current = api;
      setIsPlaying(false);
      setDuration(api.getDuration());
      setCurrentTime(api.getCurrentTime());
      api.setPlaybackRate(speedRef.current);
      const newCurrentTime =
        defaultTime || sessionStorage.getItem(storageKey)
          ? Number(sessionStorage.getItem(storageKey))
          : 0;

      if (newCurrentTime) {
        api.seekTo(newCurrentTime);
        setCurrentTime(newCurrentTime);
        updateProgressUi(newCurrentTime, 'center');
      }

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
      setIsReady(true);
      setIsPlayerLoading(false);
    },
    [defaultTime, storageKey, tick, updateProgressUi],
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

  // Detect user horizontal scrolls while playing to disable auto-follow
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function onScroll() {
      if (!isPlayingRef.current) return;
      const now = performance.now();
      if (now - lastProgrammaticScrollAtRef.current < 150) return;
      if (isFollowingRef.current) setIsFollowing(false);
    }
    container.addEventListener('scroll', onScroll, {
      passive: true,
    } as AddEventListenerOptions);
    return () => {
      container.removeEventListener('scroll', onScroll as EventListener);
    };
  }, []);

  const handleResync = useCallback(() => {
    setIsFollowing(true);
    updateProgressUi(currentTime, 'center');
  }, [currentTime, updateProgressUi]);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    const playing = playerRef.current.isPlaying();
    if (playing) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
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

  useEffect(() => {
    return () => {
      if (streakCelebrationTimeoutRef.current) {
        clearTimeout(streakCelebrationTimeoutRef.current);
        streakCelebrationTimeoutRef.current = null;
      }

      const audioContext = streakAudioContextRef.current;
      streakAudioContextRef.current = null;

      if (audioContext) {
        void audioContext.close().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!isDailyStreakEnabled || !isPlaying) return;

    const intervalId = window.setInterval(() => {
      setStreakUiNow(Date.now());
    }, 400);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isDailyStreakEnabled, isPlaying]);

  useEffect(() => {
    if (!isDailyStreakEnabled) return;

    const heartbeatTick = () => {
      if (isPlayingRef.current) {
        if (!lastPracticeCaptureAtRef.current) {
          lastPracticeCaptureAtRef.current = Date.now();
        }

        void queuePracticeFlush();
        return;
      }

      if (lastPracticeCaptureAtRef.current) {
        capturePracticeElapsed();
        lastPracticeCaptureAtRef.current = null;
        void queuePracticeFlush();
      }
    };

    const intervalId = window.setInterval(
      heartbeatTick,
      DAILY_STREAK_HEARTBEAT_INTERVAL_MS,
    );

    heartbeatTick();

    return () => {
      window.clearInterval(intervalId);
      heartbeatTick();
    };
  }, [capturePracticeElapsed, isDailyStreakEnabled, queuePracticeFlush]);

  useEffect(() => {
    if (!isDailyStreakEnabled) return;

    const flushWithBeacon = () => {
      capturePracticeElapsed();
      lastPracticeCaptureAtRef.current = null;
      void persistPracticeHeartbeat({ useBeacon: true });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushWithBeacon();
      }
    };

    window.addEventListener('beforeunload', flushWithBeacon);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', flushWithBeacon);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flushWithBeacon();
    };
  }, [capturePracticeElapsed, isDailyStreakEnabled, persistPracticeHeartbeat]);

  useEffect(() => {
    if (!isFullscreen) {
      setIsFullscreenStreakExpanded(false);
    }
  }, [isFullscreen]);

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

  useEffect(() => {
    if (isMobile && screenfull.isEnabled) {
      requestFullscreen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const isInAppBrowser = navigator.userAgent.includes('Instagram');
    setIsInAppBrowser(isInAppBrowser);
  }, []);

  useEffect(() => {
    if (isTimelineFocus) {
      timelineRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }

    if (isReady && defaultTime) {
      try {
        seekTo(defaultTime, 'center');
      } catch (error) {
        console.error('Erro ao buscar a posição da linha do tempo', error);
      }
    }
  }, [isTimelineFocus, defaultTime, isReady, seekTo]);

  return (
    <>
      <div className="flex flex-col gap-4" ref={timelineRef}>
        {isDailyStreakEnabled && (
          <DailyStreakHud
            status={dailyPracticeStreak}
            listenedSeconds={livePracticeListenedSeconds}
            isCelebrating={isStreakCelebrating}
            className={cn(isStreakCelebrating && 'streak-hud-win-pop')}
          />
        )}

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
                <div
                  className={clsx(
                    'p-4 absolute -top-4 -left-4 -right-4 -bottom-4 z-50 bg-background/60 backdrop-blur flex flex-col justify-center items-center',
                    {
                      'gap-4': !isFullscreen,
                    },
                  )}
                >
                  {isFullscreen && (
                    <DotLottieReact
                      src="/rotate-phone.lottie"
                      loop
                      autoplay
                      className="h-32"
                    />
                  )}
                  <p className="text-sm text-muted-foreground text-center p-4">
                    {!isFullscreen ? (
                      'Por favor, expanda a linha do tempo para ver as notas da música!'
                    ) : (
                      <>
                        Por favor, coloque seu celular na{' '}
                        <b className="font-bold text-foreground">horizontal</b>{' '}
                        para ver as notas da música!
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
                pitchData={currentPitch}
                currentTime={currentTime}
                micActive={micActive}
              />

              {lyrics && (
                <LyricsDisplay lyrics={lyrics} currentTime={currentTime} />
              )}

              {shouldShowNext && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => seekTo(nextTarget)}
                  >
                    próximas notas -&gt;
                  </Button>
                </div>
              )}

              {isPlaying && !isFollowing && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50">
                  <Button size="sm" variant="outline" onClick={handleResync}>
                    sincronizar com a agulha
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
                  <div className="rounded-xl border bg-card p-3 shadow flex flex-col gap-3 w-full h-full max-h-[calc(100dvh-2rem)] overflow-y-auto">
                    <div
                      className={cn(
                        'aspect-video w-full',
                        isFullscreen &&
                          isMobile &&
                          (isInAppBrowser ? 'h-40' : 'h-20'),
                      )}
                    >
                      {useDirectAudio ? (
                        <AudioRoot
                          url={playableUrl!}
                          onReady={attachPlayer}
                          onPlay={handlePlay}
                          onPause={handlePause}
                          allowAudioTranspose={allowAudioTranspose}
                          transpose={transpose}
                        />
                      ) : (
                        <YouTubeRoot
                          ytId={ytId}
                          isInAppBrowser={isInAppBrowser}
                          onReady={attachPlayer}
                          onPlay={handlePlay}
                          onPause={handlePause}
                        />
                      )}
                    </div>
                    <TimelineControls
                      isInAppBrowser={isInAppBrowser}
                      isPlaying={isPlaying}
                      onPlayPause={handlePlayPause}
                      isLoading={isPlayerLoading}
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
                      micActive={micActive}
                      onMicToggle={toggleMic}
                      ignoreProgress={!!directUrl?.musicUrl}
                      showVocalsOnly={!!directUrl?.vocalsUrl}
                      onChangeVocalsOnly={() => setVocalsOnly(!vocalsOnly)}
                      vocalsOnly={vocalsOnly}
                      onSeek={(s) =>
                        seekTo(s, isPlayingRef.current ? 'center' : 'none')
                      }
                    />
                  </div>
                </div>
              )}

              {isFullscreen && isDailyStreakEnabled && (
                <>
                  {!isFullscreenStreakExpanded && (
                    <DailyStreakHud
                      variant="compact"
                      status={dailyPracticeStreak}
                      listenedSeconds={livePracticeListenedSeconds}
                      isCelebrating={isStreakCelebrating}
                      className="pointer-events-auto absolute bottom-4 right-4 z-40"
                      onClick={() => setIsFullscreenStreakExpanded(true)}
                    />
                  )}

                  {isFullscreenStreakExpanded && (
                    <DailyStreakHud
                      variant="expanded"
                      status={dailyPracticeStreak}
                      listenedSeconds={livePracticeListenedSeconds}
                      isCelebrating={isStreakCelebrating}
                      className="pointer-events-auto absolute bottom-4 left-1/2 z-60 w-[min(760px,calc(100%-1rem))] -translate-x-1/2 shadow-2xl"
                      showMinimizeButton
                      onMinimize={() => setIsFullscreenStreakExpanded(false)}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {!isFullscreen && (
            <div className="flex flex-col gap-4">
              {!shouldShowAlert && (
                <div className="rounded-lg border bg-card p-3 flex flex-col gap-3">
                  <div className="aspect-video w-full">
                    {useDirectAudio ? (
                      <AudioRoot
                        url={playableUrl!}
                        onReady={attachPlayer}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        allowAudioTranspose={allowAudioTranspose}
                        transpose={transpose}
                      />
                    ) : (
                      <YouTubeRoot
                        ytId={ytId}
                        isInAppBrowser={isInAppBrowser}
                        onReady={attachPlayer}
                        onPlay={handlePlay}
                        onPause={handlePause}
                      />
                    )}
                  </div>
                  <TimelineControls
                    isInAppBrowser={isInAppBrowser}
                    isPlaying={isPlaying}
                    onPlayPause={handlePlayPause}
                    isLoading={isPlayerLoading}
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
                    micActive={micActive}
                    onMicToggle={toggleMic}
                    ignoreProgress={!!directUrl?.musicUrl}
                    showVocalsOnly={!!directUrl?.vocalsUrl}
                    onChangeVocalsOnly={() => setVocalsOnly((prev) => !prev)}
                    vocalsOnly={vocalsOnly}
                    onSeek={(s) =>
                      seekTo(s, isPlayingRef.current ? 'center' : 'none')
                    }
                  />
                </div>
              )}

              {!isLoggedIn && (
                <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-linear-to-br from-orange-500/15 via-background to-rose-500/10 p-3">
                  <div className="pointer-events-none absolute inset-0 -z- bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_55%)]" />
                  <div className="pointer-events-none absolute inset-0 -z-10 bg-background" />

                  <div className="relative flex flex-col gap-3 items-center text-center">
                    <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Pare de cantar desafinado
                    </span>

                    <div className="flex flex-col gap-2">
                      <h3 className="text-primary text-sm font-bold">
                        Entre ou crie uma conta
                        <br />
                        para aproveitar ao maximo!
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        Com login, você libera sua ofensiva e consegue treinar
                        canto todos os dias sem perder o ritmo e totalmente de
                        graça.
                      </p>
                    </div>

                    <Button asChild className="w-full">
                      <Link href="/sign-up">Criar conta</Link>
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
