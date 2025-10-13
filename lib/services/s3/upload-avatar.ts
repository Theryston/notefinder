import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.CUSTOM_AWS_REGION_NAME!,
  credentials: {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadAvatarToS3(
  userId: string,
  file: File,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `avatars/${userId}.png`;

  const command = new PutObjectCommand({
    Bucket: process.env.CUSTOM_AWS_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: 'public-read',
  });

  await s3Client.send(command);

  return `https://${process.env.CUSTOM_AWS_BUCKET_NAME}.s3.${process.env.CUSTOM_AWS_REGION_NAME}.amazonaws.com/${key}`;
}
