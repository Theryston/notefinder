import { randomUUID } from 'node:crypto';
import {
  cleanupTempFiles,
  downloadFileToTempPath,
  uploadBufferToS3,
} from './s3';
import OpenAI from 'openai';
import fs from 'fs';

export async function extractLyrics(vocalsMp3Url: string) {
  const openAiApiKey = process.env.OPENAI_API_KEY;

  if (!openAiApiKey) {
    throw new Error('[nfp-metadata] Missing OPENAI_API_KEY');
  }

  const openai = new OpenAI({ apiKey: openAiApiKey });

  const vocalsMp3Path = await downloadFileToTempPath(vocalsMp3Url, '.mp3');

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(vocalsMp3Path),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment', 'word'],
    });

    const lyricsKey = `${randomUUID()}_lyrics.json`;
    const lyricsBuffer = Buffer.from(
      JSON.stringify(transcription, null, 2),
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
