'use client';

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
  loop: boolean;
  onToggleLoop: (checked: boolean) => void;
  currentTime: number;
  duration: number;
  onSeekTo: (t: number) => void;
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
    loop,
    onToggleLoop,
    currentTime,
    duration,
    onSeekTo,
  } = props;

  const percent =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="w-full space-y-3">
      <button
        onClick={onPlayPause}
        disabled={!!isLoading}
        aria-busy={!!isLoading}
        className={`w-full px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-sm ${
          isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {isLoading ? 'Carregando…' : isPlaying ? 'Pausar' : 'Reproduzir'}
      </button>

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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => onToggleLoop(e.target.checked)}
        />
        Loop
      </label>
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
