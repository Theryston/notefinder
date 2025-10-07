import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
