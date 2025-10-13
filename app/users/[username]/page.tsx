import { auth } from '@/auth';
import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import { canShowSession, dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { UserOverview } from './components/overview';
import { ToggleView } from './components/toggle-view';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { FULL_USER_INCLUDE, FullUser } from '@/lib/constants';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { Skeleton } from '@/components/sheleton';

async function getUser(username: string) {
  'use cache: remote';
  cacheTag(`user_${username}`);

  const user = await prisma.user.findFirst({
    where: { username },
    include: FULL_USER_INCLUDE,
  });

  return user as unknown as FullUser | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await getUser(username);

  if (!user) notFound();

  return {
    title: `${user.name} - NoteFinder`,
    description: `Veja o que o usuário ${user.name} anda fazendo no NoteFinder`,
    openGraph: {
      images: user.image ? [user.image] : undefined,
    },
  };
}

export default async function User({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Container pathname="/users/:username">
      <Suspense fallback={<SuspenseFallback />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

function SuspenseFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full h-80 md:h-54">
        <Skeleton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 * 8 }).map((_, index) => (
          <div key={index} className="w-full h-26">
            <Skeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();

  const user = await getUser(username);

  if (!user) notFound();

  const isMe = session?.user?.id === user.id;

  const sections: React.ReactNode[] = [];

  const processingTracks = user.tracks.filter(
    (track) => track.status !== 'COMPLETED',
  );
  const favoriteTracks = user.userFavoriteTracks.map(
    (favorite) => favorite.track,
  );
  const completedTracks = user.tracks.filter(
    (track) => track.status === 'COMPLETED',
  );
  const recentViews = user.trackViews.map((view) => view.track);

  if (
    processingTracks.length > 0 &&
    canShowSession({
      sectionVisibilities: user.userSectionVisibility,
      currentSectionKey: 'PROCESSING_TRACKS',
      userId: user.id,
      currentUserId: session?.user?.id,
    })
  ) {
    sections.push(
      <TrackList
        key="processing-tracks"
        title="Músicas em processamento"
        tracks={processingTracks.map(dbTrackToTrackItem)}
        customAction={isMe && <ToggleView sectionKey="PROCESSING_TRACKS" />}
      />,
    );
  }

  if (
    favoriteTracks.length > 0 &&
    canShowSession({
      sectionVisibilities: user.userSectionVisibility,
      currentSectionKey: 'FAVORITE_TRACKS',
      userId: user.id,
      currentUserId: session?.user?.id,
    })
  ) {
    sections.push(
      <TrackList
        key="favorite-tracks"
        title="Músicas favoritas"
        tracks={favoriteTracks.map(dbTrackToTrackItem)}
        customAction={isMe && <ToggleView sectionKey="FAVORITE_TRACKS" />}
      />,
    );
  }

  if (
    completedTracks.length > 0 &&
    canShowSession({
      sectionVisibilities: user.userSectionVisibility,
      currentSectionKey: 'ADDED_TRACKS',
      userId: user.id,
      currentUserId: session?.user?.id,
    })
  ) {
    sections.push(
      <TrackList
        key="completed-tracks"
        title="Processadas recentemente"
        tracks={completedTracks.map(dbTrackToTrackItem)}
        customAction={isMe && <ToggleView sectionKey="ADDED_TRACKS" />}
      />,
    );
  }

  if (
    recentViews.length > 0 &&
    canShowSession({
      sectionVisibilities: user.userSectionVisibility,
      currentSectionKey: 'RECENT_VIEWS',
      userId: user.id,
      currentUserId: session?.user?.id,
    })
  ) {
    sections.push(
      <TrackList
        key="recent-views"
        title="Vistas recentemente"
        tracks={recentViews.map(dbTrackToTrackItem)}
        customAction={isMe && <ToggleView sectionKey="RECENT_VIEWS" />}
      />,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <UserOverview user={user} />
      {sections.length === 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Parece que {isMe ? 'você' : user.name} não tem informações{' '}
          {isMe ? 'para mostrar' : 'públicas para mostrar'} 🥲
        </div>
      )}
      {sections}
    </div>
  );
}
