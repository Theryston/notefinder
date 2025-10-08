'use client';

import { Button } from '@/components/ui/button';
import { useActionState, useEffect } from 'react';
import { onAddNotes } from '../actions';
import { toast } from 'sonner';
import { NotefinderWorkerYtmusicSearchResponse } from '@/lib/services/notefinder-worker/types';

export function AddButton({
  fullTrack,
}: {
  fullTrack: NotefinderWorkerYtmusicSearchResponse;
}) {
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
    <form action={formAction}>
      <input
        type="hidden"
        name="externalTrack"
        value={JSON.stringify(fullTrack)}
      />

      <Button variant="outline" className="w-32" isLoading={isPending}>
        Detectar notas
      </Button>
    </form>
  );
}
