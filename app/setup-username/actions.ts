'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { isNextRedirectError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setupUsernameSchema } from './schema';

export type SetupUsernameState = {
  error?: { username?: string[] };
  success?: string;
  values?: { username?: string };
};

export const onSetupUsername = async (
  prevState: unknown,
  formData: FormData,
): Promise<SetupUsernameState | void> => {
  const rawUsername = String(formData.get('username') || '').trim();
  const redirectTo = String(formData.get('redirectTo') || '/');

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: { username: ['Não autenticado'] } };
    }

    const username = rawUsername.toLowerCase();

    const parsed = setupUsernameSchema.safeParse({ username });

    if (!parsed.success) {
      return {
        error: parsed.error.flatten().fieldErrors,
        values: { username },
      };
    }

    const exists = await prisma.user.findFirst({ where: { username } });
    if (exists) {
      return {
        error: { username: ['Este nome de usuário já está em uso'] },
        values: { username: rawUsername },
      };
    }

    await prisma.user.update({ where: { id: userId }, data: { username } });

    revalidatePath('/');
    redirect(redirectTo);
  } catch (error) {
    console.error(error);
    if (isNextRedirectError(error)) throw error;
    return {
      error: { username: ['Não foi possível salvar o nome de usuário'] },
      values: { username: rawUsername },
    };
  }
};
