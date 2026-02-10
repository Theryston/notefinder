'use server';

import { auth } from '@/auth';
import { MAX_AVATAR_SIZE } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { uploadAvatarToS3 } from '@/lib/services/s3/upload-avatar';
import { revalidateTag } from 'next/cache';
import { DAILY_PRACTICE_TARGET_OPTIONS, updateNameSchema } from './schema';

export type UpdateNameState = {
  error?: {
    name?: string[];
    dailyPracticeTargetSeconds?: string[];
  };
  success?: string;
  values?: {
    name?: string;
    dailyPracticeTargetSeconds?: number;
  };
};

export type UploadAvatarState = {
  error?: string;
  success?: string;
  imageUrl?: string;
};

function normalizePracticeTargetSeconds(rawValue: FormDataEntryValue | null) {
  const value = Number(rawValue);
  if (
    DAILY_PRACTICE_TARGET_OPTIONS.includes(
      value as (typeof DAILY_PRACTICE_TARGET_OPTIONS)[number],
    )
  ) {
    return value;
  }

  return undefined;
}

export const onUpdateName = async (
  prevState: unknown,
  formData: FormData,
): Promise<UpdateNameState | void> => {
  const rawName = String(formData.get('name') || '').trim();
  const rawPracticeTarget = formData.get('dailyPracticeTargetSeconds');
  const normalizedPracticeTarget =
    normalizePracticeTargetSeconds(rawPracticeTarget);

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        error: {
          name: ['Não autenticado'],
        },
      };
    }

    const parsed = updateNameSchema.safeParse({
      name: rawName,
      dailyPracticeTargetSeconds: rawPracticeTarget,
    });

    if (!parsed.success) {
      return {
        error: parsed.error.flatten().fieldErrors,
        values: {
          name: rawName,
          dailyPracticeTargetSeconds: normalizedPracticeTarget,
        },
      };
    }

    const current = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        username: true,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: rawName,
        dailyPracticeTargetSeconds: parsed.data.dailyPracticeTargetSeconds,
      },
    });

    revalidateTag(`user_${userId}`, 'max');
    if (current?.username) revalidateTag(`user_${current.username}`, 'max');

    return {
      success: 'Informações atualizadas com sucesso',
      values: {
        name: rawName,
        dailyPracticeTargetSeconds: parsed.data.dailyPracticeTargetSeconds,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      error: {
        name: ['Não foi possível atualizar as informações'],
      },
      values: {
        name: rawName,
        dailyPracticeTargetSeconds: normalizedPracticeTarget,
      },
    };
  }
};

export const onUploadAvatar = async (
  prevState: unknown,
  formData: FormData,
): Promise<UploadAvatarState> => {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        error: 'Não autenticado',
      };
    }

    const file = formData.get('avatar') as File;

    if (!file || !(file instanceof File)) {
      return {
        error: 'Nenhum arquivo foi selecionado',
      };
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return {
        error: `A imagem deve ter no máximo ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
      };
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      return {
        error: 'Apenas imagens PNG, JPG ou WEBP são permitidas',
      };
    }

    const s3ImageUrl = await uploadAvatarToS3(userId, file);
    const imageUrl = `${s3ImageUrl}?cacheBust=${Date.now()}`;

    const current = await prisma.user.findFirst({
      where: {
        id: userId,
      },
      select: {
        username: true,
      },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        image: imageUrl,
      },
    });

    revalidateTag(`user_${userId}`, 'max');
    if (current?.username) revalidateTag(`user_${current.username}`, 'max');

    return {
      success: 'Avatar atualizado com sucesso',
      imageUrl,
    };
  } catch (error) {
    console.error(error);
    return {
      error: 'Não foi possível fazer upload do avatar',
    };
  }
};
