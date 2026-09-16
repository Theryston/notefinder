import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { cacheLife, cacheTag } from 'next/cache';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/sheleton';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return getArtistMetadata(id);
}

async function getArtistMetadata(id: string): Promise<Metadata> {
  'use cache: remote';
  cacheTag(`artist_${id}`);

  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) {
    cacheLife('seconds');
    notFound();
  }

  return {
    title: `Músicas de ${artist.name} com suas notas vocais`,
    description: `Veja as músicas do artista ${artist.name} no NoteFinder e as notas vocais de cada música para nunca desafinar ao cantar!`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/artists/${id}`,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname={`/artists/:id`}>
      <Suspense fallback={<ArtistPageLoading />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

function ArtistPageLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <div className="h-7 w-64">
        <Skeleton />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 * 4 }).map((_, index) => (
          <ArtistTrackItemLoading key={index} />
        ))}
      </div>
    </div>
  );
}

function ArtistTrackItemLoading() {
  return (
    <div className="flex w-full min-w-0 gap-2 rounded-md p-2">
      <div className="size-20 shrink-0 overflow-hidden rounded-md">
        <Skeleton />
      </div>
      <div className="flex min-w-0 w-full flex-col gap-1 py-1">
        <div className="h-4 w-3/4">
          <Skeleton />
        </div>
        <div className="h-3 w-1/2">
          <Skeleton />
        </div>
        <div className="h-3 w-2/3">
          <Skeleton />
        </div>
      </div>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CachedContent id={id} />;
}

async function CachedContent({ id }: { id: string }) {
  'use cache: remote';
  cacheTag(`artist_${id}`);

  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) {
    cacheLife('seconds');
    notFound();
  }

  const conditions: GetTrackCustomWhereWithCacheConditions[] = [
    { key: 'artistId', value: id },
    { key: 'completed_only' },
  ];

  const cacheTags = [`artist_${id}`];

  const take = 3 * 8;
  const page = 1;

  const { tracks, total } = await getTrackCustomWhereWithCache({
    conditions,
    take,
    page,
    cacheTags,
  });

  if (tracks.length === 0 && total === 0) {
    cacheLife('seconds');
  }

  return (
    <TrackList
      title={`Músicas de ${artist.name}`}
      tracks={tracks.map(dbTrackToTrackItem)}
      pagination={{
        total,
        conditions,
        page,
        take,
        cacheTags,
      }}
    />
  );
}
