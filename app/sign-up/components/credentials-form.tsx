'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { onSignupCredentials, type SignupCredentialsState } from '../actions';
import { useState } from 'react';

export function CredentialsForm({ redirectTo }: { redirectTo: string }) {
  const [stateCredentials, formActionCredentials, isPending] = useActionState(
    onSignupCredentials,
    null,
  );
  const [errors, setErrors] = useState<SignupCredentialsState['error']>({});

  useEffect(() => {
    setErrors(stateCredentials?.error || {});
  }, [stateCredentials]);

  return (
    <form className="flex flex-col gap-4" action={formActionCredentials}>
      <div className="flex flex-col gap-0">
        <Label htmlFor="name" className="mb-2">
          Nome
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          defaultValue={stateCredentials?.values?.name}
          onChange={() => setErrors({ ...errors, name: undefined })}
        />

        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.join(', ')}</p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        <Label htmlFor="username" className="mb-2">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          defaultValue={stateCredentials?.values?.username}
          onChange={() => setErrors({ ...errors, username: undefined })}
        />

        {errors.username && (
          <p className="text-sm text-destructive">
            {errors.username.join(', ')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={stateCredentials?.values?.email}
          onChange={() => setErrors({ ...errors, email: undefined })}
        />

        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.join(', ')}</p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        <Label htmlFor="password" className="mb-2">
          Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          defaultValue={stateCredentials?.values?.password}
          onChange={() => setErrors({ ...errors, password: undefined })}
        />

        {errors.password && (
          <p className="text-sm text-destructive">
            {errors.password.join(', ')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        <Label htmlFor="confirmPassword" className="mb-2">
          Confirmar senha
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          defaultValue={stateCredentials?.values?.confirmPassword}
          onChange={() => setErrors({ ...errors, confirmPassword: undefined })}
        />

        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.join(', ')}
          </p>
        )}
      </div>

      <input type="hidden" name="redirectTo" value={redirectTo || '/'} />

      <Button type="submit" className="w-full" isLoading={isPending}>
        Criar conta
      </Button>
    </form>
  );
}
