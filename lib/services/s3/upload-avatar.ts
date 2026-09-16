import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }

  return value;
}

function getS3Client() {
  return new S3Client({
    region: requiredEnv('CUSTOM_AWS_REGION_NAME'),
    credentials: {
      accessKeyId: requiredEnv('CUSTOM_AWS_ACCESS_KEY'),
      secretAccessKey: requiredEnv('CUSTOM_AWS_SECRET_ACCESS_KEY'),
    },
  });
}

export async function uploadAvatarToS3(
  userId: string,
  file: File,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `avatars/${userId}.png`;
  const s3Client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: requiredEnv('CUSTOM_AWS_BUCKET_NAME'),
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  return `https://files.notefinder.com.br/${key}`;
}
