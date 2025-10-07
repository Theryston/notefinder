'use server';

import prisma from '@/lib/prisma';
import moment from 'moment';
import { auth, signIn } from '@/auth';
import { isNextRedirectError } from '@/lib/utils';
import { sendEmailVerifyCode } from '@/lib/services/users/send-email-verify-code';

export type VerifyEmailState = {
  error?: string;
  success?: string;
};

export const onVerifyEmail = async (
  prevState: unknown,
  formData: FormData,
): Promise<VerifyEmailState | void> => {
  const code = String(formData.get('code') || '').trim();
  const redirectTo = String(formData.get('redirectTo') || '/');

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: 'Não autenticado' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailVerified: true,
        email: true,
        password: true,
        accounts: { select: { provider: true } },
      },
    });

    const isGoogle = user?.accounts.some(
      (account) => account.provider === 'google',
    );

    if (user?.emailVerified || isGoogle) {
      return { success: 'Email já verificado' };
    }

    if (!code || code.length !== 6) {
      return { error: 'Código inválido' };
    }

    const record = await prisma.emailVerificationCode.findFirst({
      where: {
        userId,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return { error: 'Código inválido ou expirado' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerificationCode.updateMany({
      where: { userId },
      data: { expiresAt: moment().subtract(1, 'minutes').toDate() },
    });

    await signIn('credentials', {
      email: user?.email,
      password: user?.password,
      hashedPassword: user?.password,
      redirectTo,
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: 'Não foi possível verificar o email' };
  }
};

export const onResendCode = async (): Promise<VerifyEmailState | void> => {
  try {
    const session = await auth();
    const email = session?.user?.email;
    const userId = session?.user?.id;

    if (!userId || !email) {
      return { error: 'Não autenticado' };
    }

    await sendEmailVerifyCode(email);
    return { success: 'Código reenviado com sucesso' };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return { error: 'Não foi possível reenviar o código' };
  }
};
