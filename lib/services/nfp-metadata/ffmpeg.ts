import { spawn } from 'node:child_process';

async function runFfmpeg(args: string[]) {
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

  await new Promise<void>((resolve, reject) => {
    const command = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    command.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    command.on('error', (error) => {
      reject(error);
    });

    command.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `[nfp-metadata] ffmpeg failed with code ${code ?? 'unknown'}: ${stderr}`,
        ),
      );
    });
  });
}

export async function convertAudioToWav(inputPath: string, outputPath: string) {
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-acodec',
    'pcm_s16le',
    outputPath,
  ]);
}

export async function convertAudioToMp3(inputPath: string, outputPath: string) {
  await runFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-vn',
    '-codec:a',
    'libmp3lame',
    '-q:a',
    '2',
    outputPath,
  ]);
}
