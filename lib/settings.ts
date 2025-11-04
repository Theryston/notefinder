import { Runtime } from './generated/prisma';
import prisma from './prisma';

export async function getSettings() {
  let currentSettings = await prisma.settings.findFirst();

  if (!currentSettings) {
    currentSettings = await prisma.settings.create({
      data: {
        usesGpu: false,
        runtime: Runtime.AWS,
      },
    });
  }

  return currentSettings;
}
