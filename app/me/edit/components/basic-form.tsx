'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { onUpdateName, type UpdateNameState } from '../actions';
import { toast } from 'sonner';
import Link from 'next/link';

export function BasicForm({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const [state, formAction, isPending] = useActionState(onUpdateName, null);
  const [errors, setErrors] = useState<UpdateNameState['error']>({});

  useEffect(() => {
    setErrors(state?.error || {});
    if (state?.success) toast.success(state?.success);
  }, [state]);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
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
          defaultValue={state?.values?.name ?? defaultName}
          onChange={() => setErrors({})}
        />
        {errors?.name && (
          <p className="text-sm text-destructive">{errors.name.join(', ')}</p>
        )}
      </div>

      <div className="flex flex-col gap-0">
        <Label htmlFor="email" className="mb-2">
          E-mail
        </Label>
        <Input
          id="email"
          name="email"
          type="text"
          autoComplete="email"
          value={defaultEmail}
          disabled
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="mb-2">
            Senha
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs underline underline-offset-4 hover:text-primary"
          >
            Altere a senha aqui
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="text"
          autoComplete="password"
          value="********"
          disabled
        />
      </div>

      <Button type="submit" className="w-full" isLoading={isPending}>
        Salvar
      </Button>
    </form>
  );
}
