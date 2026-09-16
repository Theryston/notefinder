import { Container } from '@/components/container';
import { notFound } from 'next/navigation';
import { ProcessingTrack } from './components/processing-track';
import { TrackContent } from './components/track-content';
import { cacheLife, cacheTag } from 'next/cache';
import { FULL_TRACK_INCLUDE, FullTrack, Lyrics } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/sheleton';

async function getTrack(id: string) {
  'use cache: remote';
  cacheTag(`track_${id}`);

  const track = await prisma.track.findUnique({
    where: { id },
    include: FULL_TRACK_INCLUDE,
  });

  if (!track) {
    cacheLife('seconds');
  }

  return track;
}

async function getLyrics(lyricsUrl?: string) {
  'use cache: remote';
  cacheTag(`lyrics_${lyricsUrl || 'none'}`);

  if (!lyricsUrl) return undefined;

  const response = await fetch(lyricsUrl);

  if (!response.ok) return undefined;
  const data = await response.json();
  return data as Lyrics;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const track = await getTrack(id);

  if (!track) notFound();

  const uniqueNotes = new Set(track.notes.map((note) => note.note));
  const uniqueNotesArray = Array.from(uniqueNotes);

  return {
    title: `Veja as notas vocais da música ${track.title} de ${track.trackArtists.map((artist) => artist.artist.name).join(', ')}`,
    description: `As notas ${uniqueNotesArray.join(', ')} podem te ajudar a cantar ${track.title} de ${track.trackArtists.map((artist) => artist.artist.name).join(', ')}, confira em qual momento fazer cada nota e mude para o seu tom se for preciso!`,
    openGraph: {
      type: 'music.song',
      albums: track.album
        ? [
            {
              url: `${process.env.NEXT_PUBLIC_APP_URL}/albums/${track.album.id}`,
            },
          ]
        : undefined,
      images:
        track.thumbnails.length > 0
          ? track.thumbnails.map((thumbnail) => ({
              url: thumbnail.url,
              height: thumbnail.height || undefined,
              width: thumbnail.width || undefined,
            }))
          : undefined,
      duration: track.durationSeconds,
      musicians:
        track.trackArtists.length > 0
          ? track.trackArtists.map(
              (artist) =>
                `${process.env.NEXT_PUBLIC_APP_URL}/artists/${artist.artist.id}`,
            )
          : undefined,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/tracks/${track.id}`,
    },
  };
}

export default async function Track({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname="/tracks/:id">
      <Suspense fallback={<TrackPageLoading />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

function TrackPageLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <TrackOverviewLoading />
      <TrackTimelineLoading />
    </div>
  );
}

function TrackOverviewLoading() {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-[150px_1fr] items-start gap-6 sm:gap-8">
            <div className="relative size-[150px] overflow-hidden rounded-xl border">
              <Skeleton />
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:justify-between md:gap-1">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="h-8 w-3/4 max-w-80">
                    <Skeleton />
                  </div>
                  <div className="h-5 w-2/3 max-w-56">
                    <Skeleton />
                  </div>
                </div>

                <div className="flex h-fit w-fit flex-wrap gap-2">
                  <div className="size-9">
                    <Skeleton />
                  </div>
                  <div className="size-9">
                    <Skeleton />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="h-5 w-24">
                  <Skeleton />
                </div>
                <div className="h-5 w-12">
                  <Skeleton />
                </div>
              </div>

              <div className="hidden h-full w-full md:block">
                <TrackCardsLoading />
              </div>
            </div>
          </div>

          <div className="mt-4 h-full w-full md:hidden">
            <TrackCardsLoading />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackCardsLoading() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-3">
          <div className="h-3 w-2/3">
            <Skeleton />
          </div>
          <div className="mt-2 h-4 w-1/2">
            <Skeleton />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackTimelineLoading() {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-linear-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-4 sm:p-6">
          <div className="grid w-full grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
            <div className="h-96 w-full md:h-[80vh]">
              <Skeleton />
            </div>
            <div className="hidden h-96 w-full md:block">
              <Skeleton />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const track = await getTrack(id);

  if (!track) notFound();

  const lyrics = await getLyrics(track.lyricsUrl || undefined);

  return (
    <>
      {track.status !== 'COMPLETED' && (
        <ProcessingTrack
          id={id}
          defaultStatus={track.status}
          defaultStatusDescription={track.statusDescription || undefined}
        />
      )}

      {track.status === 'COMPLETED' && (
        <TrackContent track={track as unknown as FullTrack} lyrics={lyrics} />
      )}
    </>
  );
}
