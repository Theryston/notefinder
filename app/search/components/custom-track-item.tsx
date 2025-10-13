'use client';

import { NotefinderYtmusicSearchResponse } from '@/lib/services/notefinder-ytmusic/types';
import { Artist, Track } from '@/lib/generated/prisma';
import { useActionState, useRef } from 'react';
import { onAddNotes } from '../actions';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TrackItem } from '@/components/track-item';

export function CustomTrackItem({
  track,
}: {
  track: NotefinderYtmusicSearchResponse & {
    existingTrack?: Track & { artists: Artist[] };
  };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(onAddNotes, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(
        state.error.videoId?.join(', ') ||
          'Erro ao adicionar música ao catálogo',
      );
    }
  }, [state]);

  return (
    <div
      className={cn('w-full h-full', {
        'opacity-50 pointer-events-none': isPending,
      })}
    >
      {!track.existingTrack && (
        <form action={formAction} className="hidden" ref={formRef}>
          <input
            type="hidden"
            name="externalTrack"
            value={JSON.stringify(track)}
          />
        </form>
      )}
      <TrackItem
        key={`${track.artists[0].name}-${track.title}`}
        onGoToTrack={() => {
          if (formRef.current) formRef.current.requestSubmit();
        }}
        track={{
          ...track,
          artists: track.artists.map((a) => {
            const existingArtist = track.existingTrack?.artists.find(
              (ea) => a.id === ea.ytId,
            );

            return {
              name: a.name,
              id: existingArtist?.id || undefined,
            };
          }),
        }}
        href={
          track.existingTrack ? `/tracks/${track.existingTrack.id}` : undefined
        }
      />
    </div>
  );
}
