import { defineConfig } from '@trigger.dev/sdk/v3';
import { prismaExtension } from '@trigger.dev/build/extensions/prisma';
import { ffmpeg, syncVercelEnvVars } from '@trigger.dev/build/extensions/core';

export default defineConfig({
  project: 'proj_qyslrtmomvqhjrhieogh',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ['./trigger'],
  build: {
    extensions: [
      ffmpeg(),
      prismaExtension({
        mode: 'modern',
      }),
      syncVercelEnvVars({
        vercelAccessToken: process.env.VERCEL_ACCESS_TOKEN,
        projectId: process.env.VERCEL_PROJECT_ID,
      }),
    ],
  },
});
