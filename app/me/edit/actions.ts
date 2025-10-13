'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidateTag } from 'next/cache';
import { updateNameSchema } from './schema';
import { uploadAvatarToS3 } from '@/lib/services/s3/upload-avatar';
import { MAX_AVATAR_SIZE } from '@/lib/constants';

export type UpdateNameState = {
  error?: { name?: string[] };
  success?: string;
  values?: { name?: string };
};

export type UploadAvatarState = {
  error?: string;
  success?: string;
  imageUrl?: string;
};

export const onUpdateName = async (
  prevState: unknown,
  formData: FormData,
): Promise<UpdateNameState | void> => {
  const rawName = String(formData.get('name') || '').trim();

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { error: { name: ['Não autenticado'] } };
    }

    const parsed = updateNameSchema.safeParse({ name: rawName });

    if (!parsed.success) {
      return {
        error: parsed.error.flatten().fieldErrors,
        values: { name: rawName },
      };
    }

    const current = await prisma.user.findFirst({
      where: { id: userId },
      select: { username: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { name: rawName },
    });

    revalidateTag(`user_${userId}`);
    if (current?.username) revalidateTag(`user_${current.username}`);

    return {
      success: 'Informações atualizadas com sucesso',
      values: { name: rawName },
    };
  } catch (error) {
    console.error(error);
    return {
      error: { name: ['Não foi possível atualizar o nome'] },
      values: { name: rawName },
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
      return { error: 'Não autenticado' };
    }

    const file = formData.get('avatar') as File;

    if (!file || !(file instanceof File)) {
      return { error: 'Nenhum arquivo foi selecionado' };
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return {
        error: `A imagem deve ter no máximo ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
      };
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      return { error: 'Apenas imagens PNG, JPG ou WEBP são permitidas' };
    }

    const s3ImageUrl = await uploadAvatarToS3(userId, file);
    const imageUrl = s3ImageUrl + '?cacheBust=' + Date.now();

    const current = await prisma.user.findFirst({
      where: { id: userId },
      select: { username: true },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    revalidateTag(`user_${userId}`);
    if (current?.username) revalidateTag(`user_${current.username}`);

    return { success: 'Avatar atualizado com sucesso', imageUrl };
  } catch (error) {
    console.error(error);
    return { error: 'Não foi possível fazer upload do avatar' };
  }
};
