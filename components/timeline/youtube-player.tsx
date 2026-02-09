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
  getIframe?: () => HTMLIFrameElement;
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
  useEffect(() => {
    return () => {
      playerRef.current = null;
      apiRef.current = null;
    };
  }, []);

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

  const getAttachedPlayer = () => {
    const player = playerRef.current as (PlayerLike & {
      g?: HTMLIFrameElement | null;
    }) | null;
    if (!player) return null;

    try {
      const iframe = player.getIframe?.() ?? player.g ?? null;
      if (!iframe || !iframe.isConnected || !iframe.src) return null;
      return player;
    } catch {
      return null;
    }
  };

  const callPlayer = <T,>(fn: (player: PlayerLike) => T, fallback: T) => {
    const player = getAttachedPlayer();
    if (!player) return fallback;

    try {
      return fn(player);
    } catch {
      return fallback;
    }
  };

  const getApi = useMemo<YouTubeApi>(
    () => ({
      play: () => callPlayer((player) => player.playVideo(), undefined),
      pause: () => callPlayer((player) => player.pauseVideo(), undefined),
      isPlaying: () => callPlayer((player) => player.getPlayerState() === 1, false),
      seekTo: (s: number) =>
        callPlayer((player) => player.seekTo(s, true), undefined),
      getCurrentTime: () => callPlayer((player) => player.getCurrentTime(), 0),
      getDuration: () => callPlayer((player) => player.getDuration(), 0),
      setPlaybackRate: (r: number) =>
        callPlayer((player) => player.setPlaybackRate(r), undefined),
      mute: () => callPlayer((player) => player.mute(), undefined),
      unMute: () => callPlayer((player) => player.unMute(), undefined),
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
