'use client';

import * as React from 'react';
import Link from 'next/link';
import { TrackStatus } from '@/lib/generated/prisma';
import { Button } from '@/components/ui/button';
import { revalidateTrack } from '../../actions';
import { PlayIcon } from 'lucide-react';
import { useCallback } from 'react';
import { Skeleton } from '@/components/sheleton';
import { STATUS_INFO } from '@/lib/constants';

export function ProcessingTrackContent({
  id,
  defaultStatus,
  defaultStatusDescription,
}: {
  id: string;
  defaultStatus: TrackStatus;
  defaultStatusDescription?: string;
}) {
  const [status, setStatus] = React.useState<TrackStatus>(defaultStatus);
  const [statusDescription, setStatusDescription] = React.useState<
    string | undefined
  >(defaultStatusDescription);
  const revalidateTrackFormRef = React.useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [animatedProgress, setAnimatedProgress] = React.useState<number>(
    STATUS_INFO[status].percent ?? 0,
  );

  const musicFetch = useCallback(
    async ({
      isMounted,
      interval,
    }: {
      isMounted: boolean;
      interval?: NodeJS.Timeout;
    }) => {
      try {
        const res = await fetch(`/api/tracks/${id}/status`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: TrackStatus;
          statusDescription?: string | null;
        };
        if (!isMounted) return;
        setStatus(data.status);
        setStatusDescription(data.statusDescription ?? undefined);

        if (data.status === 'COMPLETED' || data.status === 'ERROR')
          if (interval) clearInterval(interval);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    },
    [id],
  );

  React.useEffect(() => {
    let isMounted = true;

    musicFetch({ isMounted });

    const interval = setInterval(
      () => musicFetch({ isMounted, interval }),
      1000,
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [id, musicFetch]);

  React.useEffect(() => {
    if (status === 'COMPLETED') {
      if (revalidateTrackFormRef.current)
        revalidateTrackFormRef.current.requestSubmit();
    }
  }, [status]);

  React.useEffect(() => {
    const info = STATUS_INFO[status];
    const currentStepPercent =
      typeof info.percent === 'number' ? info.percent : 0;

    const statusOrder: TrackStatus[] = [
      'QUEUED',
      'DOWNLOADING_THUMBNAILS',
      'DOWNLOADING_VIDEO',
      'EXTRACTING_VOCALS',
      'DETECTING_VOCALS_NOTES',
      'EXTRACTING_LYRICS',
      'COMPLETED',
    ];

    const currentIndex = statusOrder.indexOf(status);
    const nextStatus = statusOrder[currentIndex + 1];
    const nextPercent = nextStatus
      ? (STATUS_INFO[nextStatus].percent ?? 100)
      : 100;

    setAnimatedProgress((current) => {
      if (current < currentStepPercent) {
        return currentStepPercent;
      }
      return current;
    });

    if (status !== 'COMPLETED' && status !== 'ERROR') {
      let animationFrameId: number;

      const animate = () => {
        setAnimatedProgress((current) => {
          if (current < currentStepPercent) {
            return currentStepPercent;
          }

          const distanceToNext = nextPercent - current;

          if (distanceToNext < 0.02) {
            return current;
          }

          const speed = Math.max(distanceToNext * 0.003, 0.0005);

          const newValue = current + speed;

          return Math.min(newValue, nextPercent - 1.5);
        });

        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [status]);

  const info = STATUS_INFO[status];
  const percent = Math.round(animatedProgress);

  if (isLoading) {
    return (
      <div className="h-96 w-full max-w-2xl mx-auto">
        <Skeleton />
      </div>
    );
  }

  return (
    <section className="py-10">
      <form action={revalidateTrack} ref={revalidateTrackFormRef}>
        <input type="hidden" name="trackId" value={id} />
      </form>

      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm italic text-muted-foreground/90">
          Esse processo não leva mais de 5 minutos.
        </p>
        <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                  {info.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {info.description}
                </p>
              </div>
            </div>

            {statusDescription ? (
              <p className="mb-4 text-sm italic text-muted-foreground/90">
                {statusDescription}
              </p>
            ) : null}

            {info.showBar ? (
              <div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                    style={{ width: `${percent}%` }}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    role="progressbar"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{percent}%</span>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive text-sm">
                Houve um erro. Você pode tentar novamente mais tarde.
              </div>
            )}

            {!['ERROR', 'COMPLETED'].includes(status) && (
              <div className="mt-6 rounded-md border bg-accent/40 p-4 text-sm text-accent-foreground">
                A música que você selecionou ainda não está no nosso catálogo,
                mas não se preocupe — nosso sistema vai automaticamente detectar
                as notas para você e vamos notificar seu e-mail assim que
                terminarmos.
                <br />
                <br />
                Este processo acontece em nuvem. Você pode fechar esta página e
                voltar mais tarde quando preferir.
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center w-full">
              {status === 'COMPLETED' ? (
                <Button asChild variant="default">
                  <Link href={`/tracks/${id}`}>Ver música</Link>
                </Button>
              ) : (
                <Button asChild variant="default">
                  <Link href="/">
                    <PlayIcon />
                    Explorar outras músicas
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
