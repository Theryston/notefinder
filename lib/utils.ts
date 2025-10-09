import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NotefinderWorkerYtmusicSearchResponse } from './services/notefinder-worker/types';

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
  data: NotefinderWorkerYtmusicSearchResponse[],
): NotefinderWorkerYtmusicSearchResponse[] {
  return data
    .map((track) => ({
      ...track,
      artists: track.artists.filter((artist) => artist.id),
    }))
    .filter((track) => track.videoId)
    .filter((track) => track.artists.length > 0);
}
