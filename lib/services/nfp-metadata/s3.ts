import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

let cachedS3Client: S3Client | null = null;

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`[nfp-metadata] Missing required env: ${name}`);
  }

  return value;
}

function getS3Client() {
  if (cachedS3Client) {
    return cachedS3Client;
  }

  cachedS3Client = new S3Client({
    region: requiredEnv('CUSTOM_AWS_REGION_NAME'),
    credentials: {
      accessKeyId: requiredEnv('CUSTOM_AWS_ACCESS_KEY'),
      secretAccessKey: requiredEnv('CUSTOM_AWS_SECRET_ACCESS_KEY'),
    },
  });

  return cachedS3Client;
}

type UploadBufferToS3Input = {
  buffer: Buffer;
  key: string;
  contentType?: string;
};

export async function uploadBufferToS3({
  buffer,
  key,
  contentType,
}: UploadBufferToS3Input) {
  const bucketName = requiredEnv('CUSTOM_AWS_BUCKET_NAME');

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ACL: 'public-read',
      ContentType: contentType,
    }),
  );

  return `https://files.notefinder.com.br/${key}`;
}

export async function downloadFileToTempPath(url: string, suffix: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `[nfp-metadata] Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(tmpdir(), `${randomUUID()}${suffix}`);

  await writeFile(filePath, buffer);

  return filePath;
}

export async function cleanupTempFiles(paths: Array<string | undefined>) {
  for (const filePath of paths) {
    if (!filePath) {
      continue;
    }

    try {
      await rm(filePath, { force: true });
    } catch (error) {
      console.warn(`[nfp-metadata] Failed to delete temporary file: ${filePath}`, {
        error,
      });
    }
  }
}
