'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { toggleView } from '../../actions';
import { UserSectionVisibilityValue } from '@/lib/generated/prisma/client';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export function ToggleViewContent({ sectionKey }: { sectionKey: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const hasDoneInitialFetch = useRef(false);
  const [ignoreAction, setIgnoreAction] = useState(true);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'ME_ONLY'>('PUBLIC');
  const [state, handleToggleView, isPending] = useActionState(toggleView, {
    value: 'PUBLIC' as UserSectionVisibilityValue,
    ignoreAction: true,
  });

  useEffect(() => {
    if (hasDoneInitialFetch.current) return;
    formRef.current?.requestSubmit();
    hasDoneInitialFetch.current = true;
  }, [handleToggleView, formRef]);

  useEffect(() => {
    setVisibility(state.value as 'PUBLIC' | 'ME_ONLY');
  }, [state.value]);

  return (
    <form action={handleToggleView} ref={formRef}>
      <input
        type="hidden"
        name="ignoreAction"
        value={ignoreAction ? 'true' : 'false'}
      />
      <input type="hidden" name="sectionKey" value={sectionKey} />

      <Button
        size="icon"
        variant="ghost"
        isLoading={isPending && !ignoreAction}
        type="submit"
        onClick={() => setIgnoreAction(false)}
      >
        {visibility === 'PUBLIC' ? (
          <EyeIcon className="size-4" />
        ) : (
          <EyeOffIcon className="size-4" />
        )}
      </Button>
    </form>
  );
}
