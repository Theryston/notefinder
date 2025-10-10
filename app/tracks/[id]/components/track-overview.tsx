import Image from 'next/image';
import Link from 'next/link';
import { getTrackCached } from '@/lib/services/track/get-track-cached';
import { cn, getBiggestOne } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import moment from 'moment';

type Track = Awaited<ReturnType<typeof getTrackCached>>;

function formatDuration(seconds?: number | null, fallback?: string | null) {
  if (typeof seconds === 'number' && Number.isFinite(seconds)) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  }
  if (fallback) return fallback;
  return '—';
}

function formatViews(views?: number | null) {
  if (typeof views === 'number' && Number.isFinite(views)) {
    if (views > 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views > 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }

    return views.toString();
  }

  return '—';
}

export function TrackOverview({ track }: { track: NonNullable<Track> }) {
  const thumbnails = track.thumbnails ?? [];
  const biggest = thumbnails.length
    ? (getBiggestOne(thumbnails, 'width') as (typeof thumbnails)[number])
    : undefined;

  const coverUrl = biggest?.url
    ? `https://image.coollabs.io/image/${biggest.url}`
    : '/track-placeholder.png';

  const artists = track.trackArtists?.map((ta) => ta.artist) ?? [];

  const views = track._count?.views ?? 0;
  const isExplicit = Boolean(track.isExplicit);
  const year = track.year ?? undefined;
  const durationReadable = formatDuration(
    track.durationSeconds,
    track.duration,
  );

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-[150px_1fr] items-start">
            <div className="relative rounded-xl overflow-hidden border">
              <Image
                src={coverUrl}
                alt={track.title ?? 'Capa da música'}
                width={700}
                height={700}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  {track.title ?? 'Sem título'}
                </h1>
                <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                  {artists.map((artist, index) => (
                    <Link
                      href={`/artists/${artist.id}`}
                      key={artist.id}
                      className="hover:text-primary"
                    >
                      {artist.name}
                      {index < artists.length - 1 && <span>, </span>}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {isExplicit ? (
                  <span className="rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-widest">
                    EXPLÍCITO
                  </span>
                ) : null}
                {year ? (
                  <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    {year}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Duração
                  </div>
                  <div className="mt-0.5 text-sm font-medium">
                    {durationReadable}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Visualizações
                  </div>
                  <div className="mt-0.5 text-sm font-medium">
                    {formatViews(views)}
                  </div>
                </div>
                {!!track.album?.name && (
                  <div className="rounded-lg border bg-card p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Álbum
                    </div>
                    <Link
                      href={`/albums/${track.album.id}`}
                      className="mt-0.5 text-sm font-medium hover:text-primary"
                    >
                      {track.album.name}
                    </Link>
                  </div>
                )}
                {!!track.creator.username && (
                  <div className="rounded-lg border bg-card p-3">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Adicionado por
                    </div>
                    <Link
                      href={`/users/${track.creator.username}`}
                      className="mt-0.5 text-sm font-medium hover:text-primary"
                    >
                      {track.creator.username}
                    </Link>
                  </div>
                )}
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Notas detectadas
                  </div>
                  <div className="mt-0.5 text-sm font-medium">
                    {track.notes.length}
                  </div>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Adicionado em
                  </div>
                  <div className="mt-0.5 text-sm font-medium">
                    {moment(track.createdAt).format('DD/MM/YYYY')}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button asChild variant="outline">
                  <Link
                    href={`https://www.youtube.com/watch?v=${track.ytId}`}
                    target="_blank"
                  >
                    Ouvir no YT Music
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
