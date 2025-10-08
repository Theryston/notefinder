'use server';

import { signIn } from '@/auth';
import { isNextRedirectError } from '@/lib/utils';
import { signInSchema } from './schema';

export type SigninCredentialsState = {
  error: {
    emailOrUsername?: string[];
    password?: string[];
  };
  values: {
    emailOrUsername: string | undefined;
    password: string | undefined;
  };
};

export const onSigninCredentials = async (
  prevState: unknown,
  formData: FormData,
): Promise<SigninCredentialsState | void> => {
  const emailOrUsername = String(formData.get('emailOrUsername') || '');
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '/');

  try {
    const validatedFields = signInSchema.safeParse({
      emailOrUsername,
      password,
    });

    if (!validatedFields.success) {
      return {
        error: validatedFields.error.flatten().fieldErrors,
        values: { emailOrUsername, password },
      };
    }

    await signIn('credentials', {
      emailOrUsername,
      password,
      redirectTo,
    });
  } catch (error) {
    console.error(error);
    if (isNextRedirectError(error)) {
      throw error;
    }

    return {
      error: {
        emailOrUsername: ['Invalid credentials'],
        password: ['Invalid credentials'],
      },
      values: { emailOrUsername, password },
    };
  }
};

export const onSigninGoogle = async (formData: FormData) => {
  'use server';

  const redirectTo = String(formData.get('redirectTo') || '/');

  await signIn('google', {
    redirectTo,
  });
};
