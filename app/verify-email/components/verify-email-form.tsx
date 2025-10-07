'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { onResendCode, onVerifyEmail, type VerifyEmailState } from '../actions';
import { useRouter } from 'next/navigation';

export function VerifyEmailForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  const [verifyState, verifyAction, isVerifying] = useActionState(
    onVerifyEmail,
    null,
  );
  const [resendState, resendAction, isResending] = useActionState(
    onResendCode,
    null,
  );

  const [code, setCode] = useState('');
  const [message, setMessage] = useState<VerifyEmailState | null>(null);

  useEffect(() => {
    if (verifyState?.success) {
      setMessage(verifyState);
      router.push(redirectTo || '/');
    } else if (verifyState?.error) {
      setMessage(verifyState);
    }
  }, [verifyState, redirectTo, router]);

  useEffect(() => {
    if (resendState?.success || resendState?.error) {
      setMessage(resendState);
    }
  }, [resendState]);

  return (
    <div className="flex flex-col gap-4">
      <form action={verifyAction} className="flex flex-col gap-4">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          name="code"
          containerClassName="justify-center"
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

        <input type="hidden" name="redirectTo" value={redirectTo || '/'} />

        {message?.error && (
          <p className="text-sm text-destructive text-center">
            {message.error}
          </p>
        )}
        {message?.success && !verifyState?.success && (
          <p className="text-sm text-green-600 text-center">
            {message.success}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isVerifying}>
          Verificar email
        </Button>
      </form>

      <form action={resendAction} className="flex flex-col gap-2">
        <Button
          type="submit"
          variant="ghost"
          className="w-full"
          isLoading={isResending}
        >
          Enviar código novamente
        </Button>
      </form>
    </div>
  );
}
