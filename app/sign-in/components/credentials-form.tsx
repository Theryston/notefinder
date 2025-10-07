'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onSigninCredentials, type SigninCredentialsState } from '../actions';
import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CredentialsForm({ redirectTo }: { redirectTo: string }) {
  const [stateCredentials, formActionCredentials, isPending] = useActionState(
    onSigninCredentials,
    null,
  );
  const [errors, setErrors] = useState<SigninCredentialsState['error']>({});

  useEffect(() => {
    setErrors(stateCredentials?.error || {});
  }, [stateCredentials]);

  return (
    <form className="flex flex-col gap-4" action={formActionCredentials}>
      <div className="flex flex-col gap-0">
        <Label htmlFor="emailOrUsername" className="mb-2">
          Email ou username
        </Label>
        <Input
          id="emailOrUsername"
          name="emailOrUsername"
          type="text"
          autoComplete="emailOrUsername"
          required
          defaultValue={stateCredentials?.values?.emailOrUsername}
          onChange={() => setErrors({})}
        />
        {errors.emailOrUsername && (
          <p className="text-sm text-destructive">
            {errors.emailOrUsername.join(', ')}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-0">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/forgot-password"
            className="text-sm underline underline-offset-4 hover:text-primary"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue={stateCredentials?.values?.password}
          onChange={() => setErrors({})}
        />

        {errors.password && (
          <p className="text-sm text-destructive">
            {errors.password.join(', ')}
          </p>
        )}
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo || '/'} />

      <Button type="submit" className="w-full" isLoading={isPending}>
        Entrar
      </Button>
    </form>
  );
}
