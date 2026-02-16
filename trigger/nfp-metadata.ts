import { TrackStatus } from '@/lib/generated/prisma/client';
import { compactAudios } from '@/lib/services/nfp-metadata/compact-audios';
import { downloadYoutubeAudio } from '@/lib/services/nfp-metadata/download-youtube-audio';
import { extractLyrics } from '@/lib/services/nfp-metadata/extract-lyrics';
import {
  getTrack,
  getTrackOrThrow,
} from '@/lib/services/nfp-metadata/get-track';
import { processThumbnails } from '@/lib/services/nfp-metadata/process-thumbnails';
import { shouldRunStatus } from '@/lib/services/nfp-metadata/should-run-status';
import { startNfpAudioJob } from '@/lib/services/nfp-metadata/start-nfp-audio-job';
import type { ExternalTrack } from '@/lib/services/nfp-metadata/types';
import { updateTrack } from '@/lib/services/nfp-metadata/update-track';
import { updateTrackStatus } from '@/lib/services/nfp-metadata/update-track-status';
import { logger, retry, schemaTask, type RetryOptions } from '@trigger.dev/sdk';
import z from 'zod';

const stepRetryConfig = {
  statusUpdate: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 10_000,
    randomize: true,
  },
  downloadingThumbnails: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 10_000,
    randomize: true,
  },
  downloadingVideo: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  nfpAudio: {
    maxAttempts: 5,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 30_000,
    randomize: true,
  },
  compactAudios: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 20_000,
    randomize: true,
  },
  extractingLyrics: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 2_000,
    maxTimeoutInMs: 20_000,
    randomize: true,
  },
  completed: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 10_000,
    randomize: true,
  },
  error: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 10_000,
    randomize: true,
  },
} as const satisfies Record<string, RetryOptions>;

const externalTrackSchema = z
  .object({
    videoId: z.string().optional(),
    thumbnails: z
      .array(
        z.object({
          url: z.string(),
          width: z.number().optional(),
          height: z.number().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

const nfpMetadataSchema = z.object({
  trackId: z.string().optional(),
  track: z
    .object({
      id: z.string(),
    })
    .optional(),
  externalTrack: externalTrackSchema.optional().nullable(),
});

type RunStepWithRetryInput<T> = {
  groupName: string;
  retryOptions: RetryOptions;
  run: () => Promise<T>;
};

async function runStepWithRetry<T>({
  groupName,
  retryOptions,
  run,
}: RunStepWithRetryInput<T>) {
  return logger.trace(groupName, async () =>
    retry.onThrow(async ({ attempt, maxAttempts }) => {
      logger.info(`[nfp-metadata] ${groupName} (${attempt}/${maxAttempts})`);
      return run();
    }, retryOptions),
  );
}

function requireExternalTrackVideoId(externalTrack: ExternalTrack) {
  if (!externalTrack.videoId) {
    throw new Error(
      '[nfp-metadata] externalTrack.videoId is required for DOWNLOADING_VIDEO',
    );
  }

  return externalTrack.videoId;
}

function requireExternalTrackThumbnails(externalTrack: ExternalTrack) {
  if (!externalTrack.thumbnails?.length) {
    throw new Error(
      '[nfp-metadata] externalTrack.thumbnails is required for DOWNLOADING_THUMBNAILS',
    );
  }

  return externalTrack.thumbnails;
}

export const nfpMetadataTask = schemaTask({
  id: 'nfp-metadata',
  maxDuration: 3600,
  retry: {
    maxAttempts: 1,
  },
  schema: nfpMetadataSchema,
  run: async (payload) => {
    const trackId = payload.trackId ?? payload.track?.id;

    if (!trackId) {
      throw new Error('[nfp-metadata] Missing trackId');
    }

    logger.info(`[nfp-metadata] Processing track ${trackId}`);

    let track = await getTrack(trackId);

    if (!track) {
      logger.warn(`[nfp-metadata] Track ${trackId} not found`);

      return {
        trackId,
        completed: false,
        deferredToNfpAudio: false,
        reason: 'track_not_found',
      };
    }

    if (!payload.externalTrack) {
      await runStepWithRetry({
        groupName: 'marking-error-missing-external-track',
        retryOptions: stepRetryConfig.error,
        run: async () =>
          updateTrackStatus({
            trackId,
            status: TrackStatus.ERROR,
          }),
      });

      return {
        trackId,
        completed: false,
        deferredToNfpAudio: false,
        reason: 'missing_external_track',
      };
    }

    const externalTrack = payload.externalTrack as ExternalTrack;

    try {
      if (shouldRunStatus(track.status, TrackStatus.DOWNLOADING_THUMBNAILS)) {
        await runStepWithRetry({
          groupName: 'downloading-thumbnails',
          retryOptions: stepRetryConfig.downloadingThumbnails,
          run: async () => {
            const thumbnails = requireExternalTrackThumbnails(externalTrack);

            await updateTrackStatus({
              trackId,
              status: TrackStatus.DOWNLOADING_THUMBNAILS,
            });

            await processThumbnails(trackId, thumbnails);
          },
        });

        track = await getTrackOrThrow(trackId);
      }

      if (shouldRunStatus(track.status, TrackStatus.DOWNLOADING_VIDEO)) {
        await runStepWithRetry({
          groupName: 'downloading-video',
          retryOptions: stepRetryConfig.downloadingVideo,
          run: async () => {
            const videoId = requireExternalTrackVideoId(externalTrack);

            await updateTrackStatus({
              trackId,
              status: TrackStatus.DOWNLOADING_VIDEO,
            });

            const musicUrl = await downloadYoutubeAudio(videoId);

            await updateTrack(trackId, { musicUrl });
          },
        });

        track = await getTrackOrThrow(trackId);
      }

      if (
        shouldRunStatus(track.status, TrackStatus.EXTRACTING_VOCALS) ||
        shouldRunStatus(track.status, TrackStatus.DETECTING_VOCALS_NOTES)
      ) {
        await runStepWithRetry({
          groupName: 'starting-nfp-audio-job',
          retryOptions: stepRetryConfig.nfpAudio,
          run: async () => startNfpAudioJob(trackId),
        });

        return {
          trackId,
          completed: false,
          deferredToNfpAudio: true,
          status: track.status,
        };
      }

      if (shouldRunStatus(track.status, TrackStatus.EXTRACTING_LYRICS)) {
        await runStepWithRetry({
          groupName: 'updating-extracting-lyrics-status',
          retryOptions: stepRetryConfig.statusUpdate,
          run: async () =>
            updateTrackStatus({
              trackId,
              status: TrackStatus.EXTRACTING_LYRICS,
            }),
        });

        track = await getTrackOrThrow(trackId);

        if (!track.musicMp3Url || !track.vocalsMp3Url) {
          try {
            await runStepWithRetry({
              groupName: 'compacting-audios',
              retryOptions: stepRetryConfig.compactAudios,
              run: async () => {
                const latestTrack = await getTrackOrThrow(trackId);

                if (!latestTrack.musicUrl || !latestTrack.vocalsUrl) {
                  throw new Error(
                    `[nfp-metadata] Track ${trackId} does not have musicUrl/vocalsUrl for compaction`,
                  );
                }

                const mp3Urls = await compactAudios(
                  latestTrack.musicUrl,
                  latestTrack.vocalsUrl,
                );

                await updateTrack(trackId, mp3Urls);
              },
            });

            track = await getTrackOrThrow(trackId);
          } catch (error) {
            logger.error(
              `[nfp-metadata] Ignoring audio compaction failure for track ${trackId}`,
              { error },
            );
          }
        }

        if (!track.lyricsUrl) {
          try {
            await runStepWithRetry({
              groupName: 'extracting-lyrics',
              retryOptions: stepRetryConfig.extractingLyrics,
              run: async () => {
                const latestTrack = await getTrackOrThrow(trackId);

                if (!latestTrack.vocalsMp3Url) {
                  throw new Error(
                    `[nfp-metadata] Track ${trackId} does not have vocalsMp3Url`,
                  );
                }

                const lyricsUrl = await extractLyrics(latestTrack.vocalsMp3Url);

                await updateTrack(trackId, { lyricsUrl });
              },
            });

            track = await getTrackOrThrow(trackId);
          } catch (error) {
            logger.error(
              `[nfp-metadata] Ignoring lyrics extraction failure for track ${trackId}`,
              { error },
            );
          }
        }
      }

      if (
        shouldRunStatus(track.status, TrackStatus.COMPLETED) &&
        track.status !== TrackStatus.ERROR
      ) {
        await runStepWithRetry({
          groupName: 'marking-completed',
          retryOptions: stepRetryConfig.completed,
          run: async () =>
            updateTrackStatus({
              trackId,
              status: TrackStatus.COMPLETED,
            }),
        });

        track = await getTrackOrThrow(trackId);
      }

      logger.info(`[nfp-metadata] Processed track ${trackId}`, {
        status: track.status,
      });

      return {
        trackId,
        completed: track.status === TrackStatus.COMPLETED,
        deferredToNfpAudio: false,
        status: track.status,
      };
    } catch (error) {
      await runStepWithRetry({
        groupName: 'marking-error',
        retryOptions: stepRetryConfig.error,
        run: async () =>
          updateTrackStatus({
            trackId,
            status: TrackStatus.ERROR,
          }),
      });

      throw error;
    }
  },
});
