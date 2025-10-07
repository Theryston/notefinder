'use client';

import { useActionState, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  onForgotPasswordReset,
  onResendCode,
  type ForgotPasswordResetState,
} from '../actions';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';

export function ResetForm({ email }: { email: string }) {
  const [state, formAction, isPending] = useActionState(
    onForgotPasswordReset,
    null,
  );
  const [, resendCodeAction, isResending] = useActionState(onResendCode, null);
  const [errors, setErrors] = useState<ForgotPasswordResetState['error']>({});
  const [code, setCode] = useState('');

  useEffect(() => {
    setErrors(state?.error || {});
  }, [state]);

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-col gap-4" action={formAction}>
        <div className="flex flex-col gap-2 items-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              setCode(value);
              setErrors({});
            }}
            name="code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {errors?.code && (
            <p className="text-sm text-destructive">{errors.code.join(', ')}</p>
          )}
        </div>

        <div className="flex flex-col gap-0">
          <Label htmlFor="password" className="mb-2">
            Nova senha
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            defaultValue={state?.values?.password}
            onChange={() => setErrors({})}
          />
          {errors?.password && (
            <p className="text-sm text-destructive">
              {errors.password.join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-0">
          <Label htmlFor="confirmPassword" className="mb-2">
            Confirmar nova senha
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            defaultValue={state?.values?.confirmPassword}
            onChange={() => setErrors({})}
          />
          {errors?.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.join(', ')}
            </p>
          )}
        </div>

        <input type="hidden" name="email" value={email} />

        <Button type="submit" className="w-full" isLoading={isPending}>
          Redefinir senha
        </Button>
      </form>

      <form action={resendCodeAction}>
        <input type="hidden" name="email" value={email} />

        <Button
          variant="ghost"
          type="submit"
          className="w-full"
          isLoading={isResending}
        >
          Reenviar código
        </Button>
      </form>
    </div>
  );
}
