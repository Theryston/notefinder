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
      <Suspense fallback={<UserPageLoading />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

function UserPageLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-live="polite">
      <UserOverviewLoading />
      <UserTrackSectionsLoading />
    </div>
  );
}

function UserOverviewLoading() {
  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-linear-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-[120px_1fr] items-start gap-6 sm:gap-8">
            <div className="relative size-[120px] overflow-hidden rounded-full border">
              <Skeleton />
            </div>

            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-1 md:flex-row md:justify-between">
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="h-8 w-3/4">
                    <Skeleton />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-4 w-20">
                      <Skeleton />
                    </div>
                    <div className="h-5 w-24">
                      <Skeleton />
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden h-full w-full md:block">
                <UserCardsLoading />
              </div>
            </div>
          </div>

          <div className="mt-4 h-full w-full md:hidden">
            <UserCardsLoading />
          </div>
        </div>
      </div>
    </section>
  );
}

function UserCardsLoading() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
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

function UserTrackSectionsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <UserTrackSectionLoading />
      <UserTrackSectionLoading />
    </div>
  );
}

function UserTrackSectionLoading() {
  return (
    <section className="flex flex-col gap-4">
      <div className="h-7 w-56">
        <Skeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 * 4 }).map((_, index) => (
          <UserTrackItemLoading key={index} />
        ))}
      </div>
    </section>
  );
}

function UserTrackItemLoading() {
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
      <UserTrackSectionsLoading />
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
