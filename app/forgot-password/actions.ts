'use server';

import prisma from '@/lib/prisma';
import { isNextRedirectError } from '@/lib/utils';
import { sendForgotPasswordCode } from '@/lib/services/users/send-forgot-password-code';
import { redirect } from 'next/navigation';
import { hash } from 'bcryptjs';
import moment from 'moment';
import { forgotPasswordResetSchema } from './schema';

export type ForgotPasswordRequestState = {
  error?: { email?: string[] };
  success?: string;
  values?: { email?: string };
};

export type ForgotPasswordResetState = {
  error?: { code?: string[]; password?: string[]; confirmPassword?: string[] };
  success?: string;
  values?: { code?: string; password?: string; confirmPassword?: string };
};

export const onForgotPasswordRequest = async (
  prevState: unknown,
  formData: FormData,
): Promise<ForgotPasswordRequestState | void> => {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();

  try {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: { email: ['Email inválido'] }, values: { email } };
    }

    await sendForgotPasswordCode(email);

    redirect(`/forgot-password/reset?email=${encodeURIComponent(email)}`);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error(error);
    return {
      error: { email: ['Não foi possível iniciar a recuperação'] },
      values: { email },
    };
  }
};

export const onForgotPasswordReset = async (
  prevState: unknown,
  formData: FormData,
): Promise<ForgotPasswordResetState | void> => {
  const code = String(formData.get('code') || '').trim();
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  try {
    const validatedFields = forgotPasswordResetSchema.safeParse({
      code,
      email,
      password,
      confirmPassword,
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
        values: { code, password, confirmPassword },
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      // Fake wait to prevent user enumeration
      const timeToWait = Math.floor(Math.random() * 801) + 200;
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
      return { success: 'Se o email existir, será enviado um código' };
    }

    const record = await prisma.forgotPasswordCode.findFirst({
      where: {
        userId: user.id,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        error: { code: ['Código inválido ou expirado'] },
        values: { code, password, confirmPassword },
      };
    }

    const passwordHash = await hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    await prisma.forgotPasswordCode.updateMany({
      where: { userId: user.id },
      data: { expiresAt: moment().subtract(1, 'minutes').toDate() },
    });

    redirect('/sign-in');
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error(error);
    return {
      error: { code: ['Não foi possível redefinir a senha'] },
      values: { code, password, confirmPassword },
    };
  }
};

export const onResendCode = async (
  prevState: unknown,
  formData: FormData,
): Promise<ForgotPasswordResetState | void> => {
  try {
    const email = String(formData.get('email') || '')
      .trim()
      .toLowerCase();

    await sendForgotPasswordCode(email);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error(error);
    return { error: { code: ['Não foi possível reenviar o código'] } };
  }
};
