'use server';

import { signIn } from '@/auth';
import { isNextRedirectError } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { signUpSchema } from './schema';
import { hash } from 'bcryptjs';
import { sendEmailVerifyCode } from '@/lib/services/users/send-email-verify-code';

export type SignupCredentialsState = {
  error: {
    name?: string[];
    username?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  values: {
    name: string | undefined;
    username: string | undefined;
    email: string | undefined;
    password: string | undefined;
    confirmPassword: string | undefined;
  };
};

export const onSignupCredentials = async (
  prevState: unknown,
  formData: FormData,
): Promise<SignupCredentialsState | void> => {
  const name = String(formData.get('name') || '');
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');
  const username = String(formData.get('username') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  try {
    const parsed = signUpSchema.safeParse({
      name,
      username,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      return {
        error: parsed.error.flatten().fieldErrors,
        values: { name, username, email, password, confirmPassword },
      };
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return {
        error: {
          username: ['Username already in use'],
        },
        values: { name, username, email, password, confirmPassword },
      };
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });

    if (existingEmail) {
      return {
        error: {
          email: ['Email already in use'],
        },
        values: { name, username, email, password, confirmPassword },
      };
    }

    const passwordHash = await hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: passwordHash,
      },
    });

    await sendEmailVerifyCode(email);

    await signIn('credentials', {
      emailOrUsername: email,
      password,
      redirectTo: `/verify-email${redirectTo ? `?redirectTo=${redirectTo}` : ''}`,
    });
  } catch (error) {
    console.error(error);
    if (isNextRedirectError(error)) {
      throw error;
    }

    return {
      error: {
        email: ['Unable to sign up with these credentials'],
      },
      values: { name, username, email, password, confirmPassword },
    };
  }
};

export const onSignupGoogle = async (formData: FormData) => {
  'use server';

  const redirectTo = String(formData.get('redirectTo') || '/');

  await signIn('google', {
    redirectTo,
  });
};
