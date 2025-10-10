'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Minimal type surface for the YouTube IFrame API we use
export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
};

type YTPlayerEvents = {
  onReady?: () => void;
  onStateChange?: (e: { data: number }) => void;
};

type YTPlayerOptions = {
  width: string;
  height: string;
  videoId: string;
  playerVars?: Record<string, unknown>;
  events?: YTPlayerEvents;
};

type YTGlobal = {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<YTGlobal> {
  return new Promise<YTGlobal>((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const existing = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existing) {
      const check = () => {
        if (window.YT && window.YT.Player) resolve(window.YT);
        else setTimeout(check, 50);
      };
      check();
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT && window.YT.Player) resolve(window.YT);
    };
  });
}

export type YouTubeApi = {
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setPlaybackRate: (rate: number) => void;
};

export function useYouTubeApi(
  playerRef: React.RefObject<YTPlayer | null>,
): YouTubeApi {
  return useMemo(
    () => ({
      play: () => playerRef.current?.playVideo?.(),
      pause: () => playerRef.current?.pauseVideo?.(),
      isPlaying: () => playerRef.current?.getPlayerState?.() === 1,
      seekTo: (s: number) => playerRef.current?.seekTo?.(s, true),
      getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
      getDuration: () => playerRef.current?.getDuration?.() ?? 0,
      setPlaybackRate: (r: number) => playerRef.current?.setPlaybackRate?.(r),
    }),
    [playerRef],
  );
}

export function YouTubeRoot({
  ytId,
  onReady,
  onPlay,
  onPause,
}: {
  ytId: string;
  onReady?: (api: YouTubeApi) => void;
  onPlay?: () => void;
  onPause?: () => void;
}) {
  const iframeId = useMemo(
    () => `yt-${Math.random().toString(36).slice(2)}`,
    [],
  );
  const playerRef = useRef<YTPlayer | null>(null);
  const api = useYouTubeApi(playerRef);
  const [ready, setReady] = useState(false);
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
    let destroyed = false;
    let player: YTPlayer | null = null;
    loadYouTubeApi().then((YT) => {
      if (destroyed) return;
      player = new YT.Player(iframeId, {
        width: '100%',
        height: '100%',
        videoId: ytId,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          controls: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerRef.current = player;
            setReady(true);
            onReadyRef.current?.(api);
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === 1) onPlayRef.current?.();
            if (e.data === 2 || e.data === 0) onPauseRef.current?.();
          },
        },
      });
    });
    return () => {
      destroyed = true;
      try {
        player?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, [iframeId, ytId, api]);

  return (
    <div className="w-full h-full">
      <div id={iframeId} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
}
