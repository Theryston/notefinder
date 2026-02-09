'use client';

import {
  DAILY_STREAK_TARGET_SECONDS,
  type DailyPracticeStreakStatus,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import { FlameIcon, MinusIcon, SparklesIcon } from 'lucide-react';

const RING_RADIUS = 44;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const CONFETTI_COLORS = [
  '#f59e0b',
  '#fb7185',
  '#f97316',
  '#38bdf8',
  '#facc15',
  '#34d399',
];
const COMPACT_CONFETTI_COUNT = 10;

function formatClock(valueInSeconds: number) {
  const safe = Math.max(0, Math.floor(valueInSeconds));
  const minutes = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (safe % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export function DailyStreakHud({
  status,
  listenedSeconds,
  isCelebrating,
  variant = 'expanded',
  className,
  onClick,
  showMinimizeButton = false,
  onMinimize,
}: {
  status: DailyPracticeStreakStatus;
  listenedSeconds: number;
  isCelebrating: boolean;
  variant?: 'expanded' | 'compact';
  className?: string;
  onClick?: () => void;
  showMinimizeButton?: boolean;
  onMinimize?: () => void;
}) {
  const safeTarget = Math.max(
    1,
    status.targetSeconds || DAILY_STREAK_TARGET_SECONDS,
  );
  const safeListened = Math.min(safeTarget, Math.max(0, listenedSeconds));
  const progress = safeListened / safeTarget;
  const strokeOffsetExpanded = RING_CIRCUMFERENCE * (1 - progress);
  const remainingSeconds = Math.max(0, safeTarget - safeListened);

  if (variant === 'compact') {
    const compactRadius = 22;
    const compactCircumference = 2 * Math.PI * compactRadius;
    const strokeOffsetCompact = compactCircumference * (1 - progress);

    return (
      <button
        type="button"
        aria-label="Abrir ofensiva diária"
        onClick={onClick}
        className={cn(
          'relative cursor-pointer h-16 w-16 rounded-full bg-card/90 backdrop-blur shadow-xl transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          className,
        )}
      >
        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={compactRadius}
            strokeWidth="6"
            className="stroke-muted/50"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r={compactRadius}
            strokeWidth="6"
            strokeLinecap="round"
            className={cn(
              'stroke-primary transition-all duration-700',
              status.completedToday && 'streak-ring-complete',
            )}
            strokeDasharray={compactCircumference}
            strokeDashoffset={strokeOffsetCompact}
            fill="none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {status.completedToday ? (
            <>
              <FlameIcon className="h-4 w-4 text-primary" />
              <span className="text-[8px] font-semibold leading-none text-primary">
                +1 hoje
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] font-semibold leading-none text-foreground">
                {formatClock(safeListened)}
              </span>
              <span className="text-[8px] leading-none text-muted-foreground">
                /{formatClock(safeTarget)}
              </span>
            </>
          )}
        </div>

        {isCelebrating && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            {Array.from({ length: COMPACT_CONFETTI_COUNT }).map((_, index) => (
              <span
                key={index}
                className="streak-confetti-piece"
                style={{
                  left: `${8 + ((index * 9) % 84)}%`,
                  animationDelay: `${(index % 5) * 60}ms`,
                  backgroundColor:
                    CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                }}
              />
            ))}
          </div>
        )}
      </button>
    );
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-orange-500/15 via-background to-rose-500/10 p-4 sm:p-5',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z- bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-background" />

      {showMinimizeButton && (
        <button
          type="button"
          aria-label="Minimizar ofensiva diária"
          className="absolute right-2 top-2 z-30 inline-flex h-7 w-7 items-center justify-center rounded-full border bg-background/80 text-muted-foreground transition hover:text-foreground"
          onClick={onMinimize}
        >
          <MinusIcon className="h-4 w-4" />
        </button>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
        <div className="relative mx-auto h-28 w-28 md:mx-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              strokeWidth="10"
              className="stroke-muted/50"
              fill="none"
            />
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              strokeWidth="10"
              strokeLinecap="round"
              className={cn(
                'stroke-primary transition-all duration-700',
                status.completedToday && 'streak-ring-complete',
              )}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeOffsetExpanded}
              fill="none"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {status.completedToday ? (
              <>
                <FlameIcon className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  +1 hoje
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-foreground">
                  {formatClock(safeListened)}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  de {formatClock(safeTarget)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {status.currentStreakDays > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <FlameIcon className="h-3.5 w-3.5" />
                {status.currentStreakDays} dia
                {status.currentStreakDays === 1 ? '' : 's'} seguido
                {status.currentStreakDays === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <SparklesIcon className="h-3.5 w-3.5" />
                complete o primeiro dia cantando
              </span>
            )}
          </div>

          <p className="text-sm text-center md:text-left text-muted-foreground">
            {status.completedToday
              ? 'Ofensiva de hoje garantida. Não se esqueça de voltar amanhã para continuar sua sequência.'
              : `Continue cantando: faltam ${formatClock(remainingSeconds)} para validar o ponto de hoje.`}
          </p>
        </div>
      </div>

      {isCelebrating && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
          <div className="absolute inset-0 streak-celebration-pulse bg-gradient-to-r from-amber-400/20 via-orange-300/15 to-rose-400/20" />

          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="streak-confetti-piece"
              style={{
                left: `${5 + ((index * 11) % 90)}%`,
                animationDelay: `${(index % 6) * 70}ms`,
                backgroundColor:
                  CONFETTI_COLORS[index % CONFETTI_COLORS.length],
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
