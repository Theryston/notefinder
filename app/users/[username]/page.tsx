import { auth } from '@/auth';
import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import { getUserByUsernameWithCache } from '@/lib/services/users/get-user';
import { canShowSession, dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await getUserByUsernameWithCache(username);

  if (!user) notFound();

  return {
    title: `${user.name} - NoteFinder`,
    description: `Veja o que o usuário ${user.name} anda fazendo no NoteFinder`,
    openGraph: {
      images: user.image ? [user.image] : undefined,
    },
  };
}

export default async function Profile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

  const user = await getUserByUsernameWithCache(username);

  if (!user) notFound();

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
        tracks={processingTracks.map(dbTrackToTrackItem)}
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
        tracks={favoriteTracks.map(dbTrackToTrackItem)}
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
        tracks={completedTracks.map(dbTrackToTrackItem)}
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
        tracks={recentViews.map(dbTrackToTrackItem)}
      />,
    );
  }

  return <Container pathname="/profile">{sections}</Container>;
}
