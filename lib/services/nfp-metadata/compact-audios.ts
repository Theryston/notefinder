import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { convertAudioToMp3 } from './ffmpeg';
import { cleanupTempFiles, downloadFileToTempPath, uploadBufferToS3 } from './s3';
import type { TrackMediaUrls } from './types';

export async function compactAudios(
  musicUrl: string,
  vocalsUrl: string,
): Promise<TrackMediaUrls> {
  const musicWavPath = await downloadFileToTempPath(musicUrl, '.wav');
  const vocalsWavPath = await downloadFileToTempPath(vocalsUrl, '.wav');
  const musicMp3Path = path.join(tmpdir(), `${randomUUID()}.mp3`);
  const vocalsMp3Path = path.join(tmpdir(), `${randomUUID()}.mp3`);

  try {
    await convertAudioToMp3(musicWavPath, musicMp3Path);
    await convertAudioToMp3(vocalsWavPath, vocalsMp3Path);

    const musicMp3Buffer = await readFile(musicMp3Path);
    const vocalsMp3Buffer = await readFile(vocalsMp3Path);
    const musicKey = `${randomUUID()}_music.mp3`;
    const vocalsKey = `${randomUUID()}_vocals.mp3`;

    const [musicMp3Url, vocalsMp3Url] = await Promise.all([
      uploadBufferToS3({
        buffer: musicMp3Buffer,
        key: musicKey,
        contentType: 'audio/mpeg',
      }),
      uploadBufferToS3({
        buffer: vocalsMp3Buffer,
        key: vocalsKey,
        contentType: 'audio/mpeg',
      }),
    ]);

    return {
      musicMp3Url,
      vocalsMp3Url,
    };
  } finally {
    await cleanupTempFiles([
      musicWavPath,
      vocalsWavPath,
      musicMp3Path,
      vocalsMp3Path,
    ]);
  }
}
