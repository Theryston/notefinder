'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { handleFavoriteTrack } from '../actions';
import { Button } from '@/components/ui/button';
import { HeartIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function FavoriteButton({ trackId }: { trackId: string }) {
  const hasDoneInitialFetch = useRef(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [state, handleFavorite, isPending] = useActionState(
    handleFavoriteTrack,
    { isFavorite, isLoggedIn: false },
  );
  const pathname = usePathname();

  useEffect(() => {
    if (hasDoneInitialFetch.current) return;
    hasDoneInitialFetch.current = true;
    const formData = new FormData();
    formData.append('trackId', trackId);
    formData.append('ignoreAction', 'true');
    handleFavorite(formData);
  }, [handleFavorite, trackId, state.isLoggedIn]);

  useEffect(() => {
    setIsFavorite(state?.isFavorite);
  }, [state?.isFavorite]);

  if (!state.isLoggedIn) {
    return (
      <Button size="icon" variant="ghost" asChild>
        <Link href={`/sign-in?redirectTo=${pathname}`}>
          <HeartIcon className="size-4" />
        </Link>
      </Button>
    );
  }

  return (
    <form action={handleFavorite}>
      <input type="hidden" name="trackId" value={trackId} />
      <Button size="icon" variant="ghost" isLoading={isPending} type="submit">
        {isFavorite ? (
          <HeartIcon fill="#fff" className="size-4" />
        ) : (
          <HeartIcon className="size-4" />
        )}
      </Button>
    </form>
  );
}
