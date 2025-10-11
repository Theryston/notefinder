'use server';

import { auth } from '@/auth';
import { DEFAULT_SECTION_VISIBILITY } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { UserSectionVisibilityValue } from '@prisma/client';
import { revalidateTag } from 'next/cache';

type ToggleViewState = {
  value: UserSectionVisibilityValue;
  ignoreAction: boolean;
};

export const toggleView = async (
  prevState: ToggleViewState,
  formData: FormData,
): Promise<ToggleViewState> => {
  const sectionKey = formData.get('sectionKey');
  const ignoreAction = formData.get('ignoreAction') === 'true';
  if (!sectionKey && !ignoreAction)
    return { value: prevState.value, ignoreAction: prevState.ignoreAction };

  const defaultVisibility = DEFAULT_SECTION_VISIBILITY[sectionKey as string];

  const session = await auth();
  if (!session?.user?.id)
    return { value: prevState.value, ignoreAction: prevState.ignoreAction };

  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
  });

  if (!user)
    return { value: prevState.value, ignoreAction: prevState.ignoreAction };

  const sectionVisibility = await prisma.userSectionVisibility.findFirst({
    where: { userId: session.user.id, key: sectionKey as string },
  });

  if (ignoreAction)
    return {
      value: sectionVisibility?.value ?? defaultVisibility,
      ignoreAction: prevState.ignoreAction,
    };

  const currentVisibility = sectionVisibility?.value ?? defaultVisibility;
  const newVisibility = currentVisibility === 'PUBLIC' ? 'ME_ONLY' : 'PUBLIC';

  if (sectionVisibility) {
    await prisma.userSectionVisibility.update({
      where: { id: sectionVisibility.id },
      data: {
        value: newVisibility,
      },
    });
  } else {
    await prisma.userSectionVisibility.create({
      data: {
        userId: session.user.id,
        key: sectionKey as string,
        value: newVisibility,
      },
    });
  }

  revalidateTag(`user_${user.username}`);

  return {
    value: newVisibility,
    ignoreAction,
  };
};
