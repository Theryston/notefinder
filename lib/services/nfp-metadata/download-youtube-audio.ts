import { wait } from '@trigger.dev/sdk';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { convertAudioToWav } from './ffmpeg';
import { cleanupTempFiles, uploadBufferToS3 } from './s3';

type YoutubeDownloadMetadataResponse = {
  progress_url?: string;
};

type YoutubeDownloadProgressResponse = {
  progress?: number;
  success?: number;
  download_url?: string;
};

const YOUTUBE_DOWNLOAD_API_URL =
  'https://youtube-info-download-api.p.rapidapi.com/ajax/download.php';
const YOUTUBE_DOWNLOAD_API_HOST = 'youtube-info-download-api.p.rapidapi.com';
const POLL_INTERVAL_SECONDS = 5;
const MAX_PROGRESS_POLLS = 1000;

async function getYoutubeProgressUrl(videoId: string) {
  const rapidApiKey = process.env.RAPIDAPI_API_KEY;

  if (!rapidApiKey) {
    throw new Error('[nfp-metadata] Missing RAPIDAPI_API_KEY');
  }

  const queryParams = new URLSearchParams({
    format: 'mp3',
    add_info: '0',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    audio_quality: '128',
    allow_extended_duration: 'false',
    no_merge: 'true',
    audio_language: 'en',
  });

  const metadataResponse = await fetch(
    `${YOUTUBE_DOWNLOAD_API_URL}?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'x-rapidapi-host': YOUTUBE_DOWNLOAD_API_HOST,
        'x-rapidapi-key': rapidApiKey,
      },
    },
  );

  if (!metadataResponse.ok) {
    throw new Error(
      `[nfp-metadata] Failed to get download metadata for ${videoId}: ${metadataResponse.status} ${metadataResponse.statusText}`,
    );
  }

  const metadata =
    (await metadataResponse.json()) as YoutubeDownloadMetadataResponse;

  if (!metadata.progress_url) {
    throw new Error(
      `[nfp-metadata] Download metadata did not return progress_url for ${videoId}`,
    );
  }

  return metadata.progress_url;
}

async function waitForYoutubeAudioUrl(progressUrl: string, videoId: string) {
  for (let pollIndex = 0; pollIndex < MAX_PROGRESS_POLLS; pollIndex++) {
    const progressResponse = await fetch(progressUrl);

    if (!progressResponse.ok) {
      throw new Error(
        `[nfp-metadata] Failed to poll download progress for ${videoId}: ${progressResponse.status} ${progressResponse.statusText}`,
      );
    }

    const progressData =
      (await progressResponse.json()) as YoutubeDownloadProgressResponse;

    const hasEnded =
      progressData.progress === 1000 || progressData.success === 1;

    if (hasEnded) {
      if (!progressData.download_url) {
        throw new Error(
          `[nfp-metadata] Missing download_url after progress completion for ${videoId}`,
        );
      }

      return progressData.download_url;
    }

    await wait.for({ seconds: POLL_INTERVAL_SECONDS });
  }

  throw new Error(
    `[nfp-metadata] Progress timeout while downloading YouTube audio for ${videoId}`,
  );
}

export async function downloadYoutubeAudio(videoId: string) {
  const progressUrl = await getYoutubeProgressUrl(videoId);
  const downloadUrl = await waitForYoutubeAudioUrl(progressUrl, videoId);
  const audioResponse = await fetch(downloadUrl);

  if (!audioResponse.ok) {
    throw new Error(
      `[nfp-metadata] Failed to download YouTube audio for ${videoId}: ${audioResponse.status} ${audioResponse.statusText}`,
    );
  }

  const mp3FilePath = path.join(tmpdir(), `${videoId}-${randomUUID()}.mp3`);
  const wavFilePath = path.join(tmpdir(), `${videoId}-${randomUUID()}.wav`);

  try {
    const mp3Buffer = Buffer.from(await audioResponse.arrayBuffer());
    await writeFile(mp3FilePath, mp3Buffer);
    await convertAudioToWav(mp3FilePath, wavFilePath);

    const wavBuffer = await readFile(wavFilePath);

    return uploadBufferToS3({
      buffer: wavBuffer,
      key: `${videoId}.wav`,
      contentType: 'audio/wav',
    });
  } finally {
    await cleanupTempFiles([mp3FilePath, wavFilePath]);
  }
}
