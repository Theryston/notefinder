'use client';

import { useActionState, useEffect, useState } from 'react';
import { onSetupUsername, type SetupUsernameState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import slugify from 'slugify';

export function UsernameForm({
  redirectTo,
  name,
}: {
  redirectTo: string;
  name: string;
}) {
  const [state, formAction, isPending] = useActionState(onSetupUsername, null);
  const [errors, setErrors] = useState<SetupUsernameState['error']>({});
  const [autoUsername, setAutoUsername] = useState('');

  useEffect(() => {
    const slug = slugify(name, { lower: true, strict: true, replacement: '_' });
    const random = Math.random().toString(36).substring(2, 15);
    const username = `${slug}_${random}`;
    setAutoUsername(username);
  }, [name]);

  useEffect(() => {
    setErrors(state?.error || {});
  }, [state]);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      <div className="flex flex-col gap-0">
        <Label htmlFor="username" className="mb-2">
          Nome de usuário
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="seu_nome"
          required
          defaultValue={state?.values?.username || autoUsername}
          onChange={() => setErrors({})}
        />
        {errors?.username && (
          <p className="text-sm text-destructive">
            {errors.username.join(', ')}
          </p>
        )}
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo || '/'} />

      <Button type="submit" className="w-full" isLoading={isPending}>
        Salvar
      </Button>
    </form>
  );
}
