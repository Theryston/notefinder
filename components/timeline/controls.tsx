'use client';

import {
  PauseIcon,
  PlayIcon,
  Volume2Icon,
  VolumeOffIcon,
  MicIcon,
  MicOffIcon,
} from 'lucide-react';
import { Button } from '../ui/button';

type TimelineControlsProps = {
  isPlaying: boolean;
  isLoading?: boolean;
  onPlayPause: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  transpose: number;
  onTransposeInc: () => void;
  onTransposeDec: () => void;
  estimatedKey: {
    tonicIndex: number;
    mode: 'maior' | 'menor';
    label: string;
  } | null;
  currentTime: number;
  duration: number;
  mute: boolean;
  onMute: () => void;
  micActive: boolean;
  onMicToggle: () => void;
};

export function TimelineControls(props: TimelineControlsProps) {
  const {
    isPlaying,
    isLoading,
    onPlayPause,
    speed,
    onSpeedChange,
    transpose,
    onTransposeInc,
    onTransposeDec,
    estimatedKey,
    currentTime,
    duration,
    mute,
    onMute,
    micActive,
    onMicToggle,
  } = props;

  const percent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <Button onClick={onPlayPause} isLoading={isLoading} className="w-full">
          {isLoading ? (
            'Carregando…'
          ) : isPlaying ? (
            <>
              <PauseIcon className="w-4 h-4" />
              Pausar
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              Reproduzir
            </>
          )}
        </Button>
        <Button onClick={onMute} size="icon">
          {mute ? (
            <>
              <VolumeOffIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              <Volume2Icon className="w-4 h-4" />
            </>
          )}
        </Button>
        <Button
          onClick={onMicToggle}
          size="icon"
          variant={micActive ? 'default' : 'outline'}
        >
          {micActive ? (
            <>
              <MicIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              <MicOffIcon className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Progresso</label>
        <div className="w-full h-2 rounded bg-muted overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 rounded-xl border bg-background"
        >
          <option value={0.5}>0.5x velocidade</option>
          <option value={0.75}>0.75x velocidade</option>
          <option value={1}>1x velocidade</option>
          <option value={1.25}>1.25x velocidade</option>
          <option value={1.5}>1.5x velocidade</option>
          <option value={2}>2x velocidade</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          aria-label="Transpor meio tom abaixo"
          onClick={onTransposeDec}
          className="px-3 py-1.5 rounded-full border hover:bg-accent transition"
        >
          -
        </button>
        <div className="flex-1 text-center text-sm">
          {estimatedKey ? `${estimatedKey.label} ` : 'N/A'}
          {transpose !== 0 && (
            <>( {transpose > 0 ? `+${transpose}` : transpose} )</>
          )}
        </div>
        <button
          aria-label="Transpor meio tom acima"
          onClick={onTransposeInc}
          className="px-3 py-1.5 rounded-full border hover:bg-accent transition"
        >
          +
        </button>
      </div>
    </div>
  );
}

function formatTime(total: number) {
  if (!total || total < 0) return '0:00';
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}
