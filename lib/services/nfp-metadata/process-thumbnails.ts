import { randomUUID } from 'node:crypto';
import { createTrackThumbnail } from './create-track-thumbnail';
import { uploadBufferToS3 } from './s3';
import type { ExternalTrackThumbnail } from './types';

export async function processThumbnails(
  trackId: string,
  thumbnails: ExternalTrackThumbnail[],
) {
  for (const thumbnail of thumbnails) {
    const response = await fetch(thumbnail.url);

    if (!response.ok) {
      throw new Error(
        `[nfp-metadata] Failed to download thumbnail ${thumbnail.url}: ${response.status} ${response.statusText}`,
      );
    }

    const thumbnailBuffer = Buffer.from(await response.arrayBuffer());
    const key = `${trackId}_${randomUUID()}.jpg`;
    const s3Url = await uploadBufferToS3({
      buffer: thumbnailBuffer,
      key,
      contentType: 'image/jpeg',
    });

    await createTrackThumbnail({
      trackId,
      url: s3Url,
      width: thumbnail.width,
      height: thumbnail.height,
    });
  }
}
