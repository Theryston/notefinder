import { TrackList } from '@/components/track-list';
import { Button } from '@/components/ui/button';
import {
  getTopViewedLast24Hours,
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { cacheTag } from 'next/cache';

export async function HomeContent() {
  'use cache: remote';
  cacheTag('home_content');

  const take = 9;
  const page = 1;

  const sections = [];
  let previousExploreTracksIds: string[] = [];

  const conditions: GetTrackCustomWhereWithCacheConditions[] = [
    { key: 'completed_only' },
  ];

  const { tracks: exploreTracks } = await getTrackCustomWhereWithCache({
    conditions,
    take,
    page,
    cacheTags: ['tracks_explore'],
  });

  if (exploreTracks.length > 0) {
    sections.push(
      <TrackList
        key="explore"
        title="Merecem ser cantadas"
        tracks={exploreTracks.map(dbTrackToTrackItem)}
      />,
    );
  }

  previousExploreTracksIds = exploreTracks.map((track) => track.id);

  const topViewedTracks = await getTopViewedLast24Hours(
    take,
    exploreTracks.map((track) => track.id),
  );

  if (topViewedTracks.length > 0) {
    sections.push(
      <TrackList
        key="top_viewed"
        title="Tão bombando hoje"
        tracks={topViewedTracks.map(dbTrackToTrackItem)}
        itemVariant="numbered"
      />,
    );
  }

  previousExploreTracksIds = [
    ...previousExploreTracksIds,
    ...topViewedTracks.map((track) => track.id),
  ];

  const { tracks: newTracks } = await getTrackCustomWhereWithCache({
    conditions: [
      ...conditions,
      { key: 'ignore_ids', value: previousExploreTracksIds },
    ],
    take,
    page,
    cacheTags: ['tracks_new'],
    orderBy: 'createdAt',
  });

  if (newTracks.length > 0) {
    sections.push(
      <TrackList
        key="new"
        title="Fresquinhas do forno"
        tracks={newTracks.map(dbTrackToTrackItem)}
      />,
    );
  }

  previousExploreTracksIds = [
    ...previousExploreTracksIds,
    ...newTracks.map((track) => track.id),
  ];

  const keepExploringTake = 3 * 8;
  const keepExploringPage = 1;
  const keepExploringConditions: GetTrackCustomWhereWithCacheConditions[] = [
    ...conditions,
    {
      key: 'ignore_ids',
      value: previousExploreTracksIds,
    },
  ];

  const { tracks: keepExploringTracks, total: keepExploringTotal } =
    await getTrackCustomWhereWithCache({
      conditions: keepExploringConditions,
      take: keepExploringTake,
      page: keepExploringPage,
      cacheTags: ['tracks_keep_exploring'],
    });

  if (keepExploringTracks.length > 0) {
    sections.push(
      <TrackList
        key="keep_exploring"
        title="Continue explorando"
        tracks={keepExploringTracks.map(dbTrackToTrackItem)}
        pagination={{
          total: keepExploringTotal,
          conditions: keepExploringConditions,
          page: keepExploringPage,
          take: keepExploringTake,
          cacheTags: ['tracks_keep_exploring'],
        }}
        endMessage={
          <>
            Nosso catálogo não para por aqui, busque uma música na{' '}
            <Link href="/search" className="underline hover:text-primary">
              barra de pesquisa
            </Link>{' '}
            lá em cima.
          </>
        }
      />,
    );
  }

  return (
    <>
      {sections.length === 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground flex flex-col gap-2">
          Parece que ouve um probleminha, que tal tentar pesquisar uma música?
          <Link href="/search">
            <Button>
              <SearchIcon />
              Pesquisar música
            </Button>
          </Link>
        </div>
      )}
      {sections}
    </>
  );
}
