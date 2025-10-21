'use client';

import { useEffect, useMemo, useRef } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

type PlayerLike = {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  mute: () => void;
  unMute: () => void;
};

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

export function YouTubeRoot({
  ytId,
  isInAppBrowser,
  onReady,
  onPlay,
  onPause,
}: {
  ytId: string;
  isInAppBrowser: boolean;
  onReady?: (api: YouTubeApi) => void;
  onPlay?: () => void;
  onPause?: () => void;
}) {
  const playerRef = useRef<PlayerLike | null>(null);
  const apiRef = useRef<YouTubeApi | null>(null);
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

  const opts = useMemo<YouTubeProps['opts']>(
    () => ({
      width: '100%',
      height: '100%',
      playerVars: {
        enablejsapi: 1,
        modestbranding: 1,
        rel: 0,
        controls: isInAppBrowser ? 1 : 0,
        playsinline: 1,
        origin:
          typeof window !== 'undefined' ? window.location.origin : undefined,
        widget_referrer:
          typeof window !== 'undefined' ? window.location.href : undefined,
        autoplay: 0,
        fs: 1,
        iv_load_policy: 3,
        disablekb: 0,
      },
    }),
    [isInAppBrowser],
  );

  const getApi = useMemo<YouTubeApi>(
    () => ({
      play: () => playerRef.current?.playVideo?.(),
      pause: () => playerRef.current?.pauseVideo?.(),
      isPlaying: () => playerRef.current?.getPlayerState?.() === 1,
      seekTo: (s: number) => playerRef.current?.seekTo?.(s, true),
      getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
      getDuration: () => playerRef.current?.getDuration?.() ?? 0,
      setPlaybackRate: (r: number) => playerRef.current?.setPlaybackRate?.(r),
      mute: () => playerRef.current?.mute?.(),
      unMute: () => playerRef.current?.unMute?.(),
    }),
    [],
  );

  return (
    <div className="w-full h-full">
      <YouTube
        className="w-full h-full"
        videoId={ytId}
        opts={opts}
        onReady={(e: { target: PlayerLike }) => {
          playerRef.current = e.target;
          console.log('playerRef.current', playerRef.current);
          if (!apiRef.current) apiRef.current = getApi;
          onReadyRef.current?.(apiRef.current);
        }}
        onStateChange={(e: { data: number }) => {
          if (e.data === 1) onPlayRef.current?.();
          if (e.data === 2 || e.data === 0) onPauseRef.current?.();
        }}
      />
    </div>
  );
}
