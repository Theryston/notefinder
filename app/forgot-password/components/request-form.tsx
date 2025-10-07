'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  onForgotPasswordRequest,
  type ForgotPasswordRequestState,
} from '../actions';

export function RequestForm() {
  const [state, formAction, isPending] = useActionState(
    onForgotPasswordRequest,
    null,
  );
  const [errors, setErrors] = useState<ForgotPasswordRequestState['error']>({});

  useEffect(() => {
    setErrors(state?.error || {});
  }, [state]);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
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
          defaultValue={state?.values?.email}
          onChange={() => setErrors({})}
        />
        {errors?.email && (
          <p className="text-sm text-destructive">{errors.email.join(', ')}</p>
        )}
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Enviar código
      </Button>
    </form>
  );
}
