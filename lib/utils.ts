import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NotefinderYtmusicSearchResponse } from './services/notefinder-ytmusic/types';
import {
  Artist,
  Track as DbTrack,
  Thumbnail,
  UserSectionVisibility,
  UserSectionVisibilityValue,
} from '@prisma/client';
import { Track as TrackItemType } from '@/components/track-item';
import { DEFAULT_SECTION_VISIBILITY } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type NextRedirectError = Error & { digest: string };

export function isNextRedirectError(
  error: unknown,
): error is NextRedirectError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as { digest?: unknown };
  return (
    typeof candidate.digest === 'string' &&
    candidate.digest.startsWith('NEXT_REDIRECT')
  );
}

export function getBiggestOne<T>(data: T[], key: keyof T) {
  return data.reduce((max: T, current: T) => {
    return Number(current[key]) > Number(max[key]) ? current : max;
  }, data[0]);
}

export function getFullHeight(noStrBlank: boolean = true) {
  if (noStrBlank) return `calc(100dvh-(var(--spacing)*54))`;
  return `calc(100dvh - (var(--spacing) * 54))`;
}

export function filterValidIds(
  data: NotefinderYtmusicSearchResponse[],
): NotefinderYtmusicSearchResponse[] {
  return data
    .map((track) => ({
      ...track,
      artists: track.artists.filter((artist) => artist.id),
    }))
    .filter((track) => track.videoId)
    .filter((track) => track.artists.length > 0);
}

export function canShowSession({
  sectionVisibilities,
  currentSectionKey,
  userId,
  currentUserId,
}: {
  sectionVisibilities: UserSectionVisibility[];
  currentSectionKey: string;
  userId: string;
  currentUserId?: string | null;
}) {
  if (userId === currentUserId) return true;

  const sectionVisibility = sectionVisibilities.find(
    (sectionVisibility) => sectionVisibility.key === currentSectionKey,
  );

  const visibilityValue =
    sectionVisibility?.value ?? DEFAULT_SECTION_VISIBILITY[currentSectionKey];
  if (!visibilityValue) return true;

  return visibilityValue === UserSectionVisibilityValue.PUBLIC;
}

export function dbTrackToTrackItem(
  track: DbTrack & {
    trackArtists: { artist: Artist }[];
    thumbnails: Thumbnail[];
  },
): TrackItemType {
  return {
    id: track.id,
    title: track.title ?? '',
    videoId: track.ytId,
    artists: track.trackArtists.map((artist) => ({
      name: artist.artist.name,
      id: artist.artist.id,
    })),
    thumbnails: track.thumbnails.map((thumbnail) => ({
      url: thumbnail.url,
      width: thumbnail.width ?? 0,
      height: thumbnail.height ?? 0,
    })),
  };
}
