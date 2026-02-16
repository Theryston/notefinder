import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  cleanupTempFiles,
  downloadFileToTempPath,
  uploadBufferToS3,
} from './s3';

export async function extractLyrics(vocalsMp3Url: string) {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error('[nfp-metadata] Missing OPENAI_API_KEY');
  }

  const vocalsMp3Path = await downloadFileToTempPath(vocalsMp3Url, '.mp3');

  try {
    const vocalsMp3Buffer = await readFile(vocalsMp3Path);
    const formData = new FormData();

    formData.append(
      'file',
      new Blob([vocalsMp3Buffer], { type: 'audio/mpeg' }),
      'vocals.mp3',
    );
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(
        `[nfp-metadata] Failed to transcribe audio: ${response.status} ${response.statusText}`,
      );
    }

    const transcriptionResult = await response.json();
    const lyricsKey = `${randomUUID()}_lyrics.json`;
    const lyricsBuffer = Buffer.from(
      JSON.stringify(transcriptionResult, null, 2),
      'utf8',
    );

    return uploadBufferToS3({
      buffer: lyricsBuffer,
      key: lyricsKey,
      contentType: 'application/json',
    });
  } finally {
    await cleanupTempFiles([vocalsMp3Path]);
  }
}
