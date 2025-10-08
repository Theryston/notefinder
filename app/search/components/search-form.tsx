'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { onSearchTracks, type SearchTracksState } from '../actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

import { TrackItem } from '@/components/track-item';
import { cn, getFullHeight } from '@/lib/utils';
import Link from 'next/link';
import { AddButton } from './add-button';
import { Skeleton } from '@/components/sheleton';

export function SearchForm({
  defaultQuery,
  isMobile,
}: {
  defaultQuery: string;
  isMobile: boolean;
}) {
  const [state, formAction, isPending] = useActionState(onSearchTracks, null);
  const [errors, setErrors] = useState<SearchTracksState['error']>({});
  const formRef = useRef<HTMLFormElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasTracks = (state?.tracks?.length || 0) > 0;

  const onInputSearchChange = () => {
    setErrors({});

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(() => {
      if (formRef.current) formRef.current.requestSubmit();
    }, 1000);
  };

  useEffect(() => {
    if (!defaultQuery) return;

    setErrors({});
    if (formRef.current && !isMobile) formRef.current.requestSubmit();
  }, [defaultQuery, isMobile]);

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        !hasTracks && `h-[${getFullHeight()}] justify-center items-center`,
      )}
    >
      <form
        className={cn(
          'flex-col gap-0 w-[calc(100%+(var(--spacing)*8))] transition-all -mx-4 px-4 border-b py-4 flex md:hidden',
          {
            'items-center': !hasTracks,
          },
        )}
        action={formAction}
        ref={formRef}
      >
        <div className="flex items-center gap-2 w-full md:max-w-md">
          <Input
            id="track"
            name="track"
            type="text"
            placeholder="O que você quer cantar?"
            required
            onChange={onInputSearchChange}
            className="w-full h-10"
            defaultValue={state?.values?.track}
            value={isMobile ? state?.values?.track : defaultQuery}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            isLoading={isPending}
          >
            <SearchIcon />
          </Button>
        </div>
        {errors?.track && (
          <p className="text-sm text-destructive">{errors.track.join(', ')}</p>
        )}
      </form>

      {state?.tracks && !hasTracks && (
        <p className="text-sm text-muted-foreground text-center">
          Nenhuma música encontrada.
        </p>
      )}

      {!isMobile && isPending ? (
        <div className="mt-4 w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full">
            {Array.from({ length: 3 * 10 }).map((_, idx) => (
              <div className="w-full h-24" key={idx}>
                <Skeleton />
              </div>
            ))}
          </div>
        </div>
      ) : (
        state?.tracks &&
        hasTracks && (
          <div className="mt-4 w-full h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full">
              {state.tracks.map((t, idx) => (
                <TrackItem
                  key={`${t.artists[0].name}-${t.title}-${idx}`}
                  track={t}
                  appendFooter={
                    <>
                      <div className="w-fit absolute top-2 right-2">
                        {t.existingTrack ? (
                          <Button variant="outline" className="w-28" asChild>
                            <Link href={`/tracks/${t.existingTrack.id}`}>
                              Ver notas
                            </Link>
                          </Button>
                        ) : (
                          <AddButton fullTrack={t} />
                        )}
                      </div>
                      <Link
                        href={`https://www.youtube.com/watch?v=${t.videoId}`}
                        target="_blank"
                        className="w-fit text-xs text-muted-foreground hover:text-primary"
                      >
                        Ouvir no YT Music
                      </Link>
                    </>
                  }
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
