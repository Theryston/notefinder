import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { cacheTag } from 'next/cache';
import { MAX_STATIC_PAGES } from '@/lib/constants';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  'use cache: remote';
  const { id } = await params;
  cacheTag(`artist_${id}`);

  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) notFound();

  return {
    title: `Músicas de ${artist.name} com suas notas vocais`,
    description: `Veja as músicas do artista ${artist.name} no NoteFinder e as notas vocais de cada música para nunca desafinar ao cantar!`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/artists/${id}`,
    },
  };
}

export async function generateStaticParams() {
  const artists = await prisma.artist.findMany({
    select: { id: true },
    where: { trackArtists: { some: { track: { status: 'COMPLETED' } } } },
    take: MAX_STATIC_PAGES,
  });

  return artists.map((artist) => ({ id: artist.id }));
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname={`/artists/:id`}>
      <Content params={params} />
    </Container>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  'use cache: remote';

  const { id } = await params;
  cacheTag(`artist_${id}`);

  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) notFound();

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
