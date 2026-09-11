import { auth } from '@/auth';
import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import { canShowSession, dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { UserOverview } from './components/overview';
import { ToggleView } from './components/toggle-view';
import { Suspense } from 'react';
import { Skeleton } from '@/components/sheleton';
import { getUserByUsername } from '@/lib/services/users/get-user';
import { Metadata } from 'next';
import { PageLoading } from '@/components/page-loading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  const user = await getUserByUsername(username);

  if (!user) notFound();

  const firstName = user.name?.split(' ')[0];
  const lastName = user.name?.split(' ')[1];

  return {
    title: user.name,
    description: `Veja o que o usuário ${user.name} anda fazendo no NoteFinder`,
    openGraph: {
      type: 'profile',
      images: user.image ? [user.image] : undefined,
      firstName,
      lastName,
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
      <Suspense fallback={<PageLoading label="Carregando perfil..." />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  return (
    <div className="flex flex-col gap-4">
      <UserOverview username={username} />

      <Suspense fallback={<UserSectionsFallback />}>
        <UserSections username={username} />
      </Suspense>
    </div>
  );
}

function UserSectionsFallback() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <p className="text-center text-sm text-muted-foreground">
        Carregando atividades...
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 * 8 }).map((_, index) => (
          <div key={index} className="h-26 w-full">
            <Skeleton />
          </div>
        ))}
      </div>
    </div>
  );
}

async function UserSections({ username }: { username: string }) {
  const user = await getUserByUsername(username);

  if (!user) notFound();

  const session = await auth();

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
    <>
      {sections.length === 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Parece que {isMe ? 'você' : user.name} não tem informações{' '}
          {isMe ? 'para mostrar' : 'públicas para mostrar'} 🥲
        </div>
      )}
      {sections}
    </>
  );
}
