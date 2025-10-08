import { Thumbnail } from '@/lib/services/notefinder-worker/types';
import { cn, getBiggestOne } from '@/lib/utils';
import Image from 'next/image';

type Track = {
  title: string;
  artists: { name: string }[];
  thumbnails?: {
    url: string;
    width: number;
  }[];
  videoId: string;
};

type Props = {
  track: Track;
  format?: 'line';
  appendFooter?: React.ReactNode;
  customThumbnail?: React.ReactNode;
};

export function TrackItem({
  track,
  format = 'line',
  appendFooter,
  customThumbnail,
}: Props) {
  let biggestThumbnail = getBiggestOne(
    track.thumbnails || [],
    'width',
  ) as Thumbnail;

  if (!biggestThumbnail) {
    biggestThumbnail = {
      url: '/track-placeholder.png',
      width: 500,
      height: 500,
    };
  }

  return (
    <div
      key={`${track.artists[0].name}-${track.title}`}
      className={cn('w-full h-full relative hover:bg-muted rounded-md p-2', {
        'flex gap-2': format === 'line',
      })}
    >
      {customThumbnail
        ? customThumbnail
        : biggestThumbnail?.url && (
            <Image
              src={`https://image.coollabs.io/image/${biggestThumbnail.url}`}
              alt={track.title}
              width={500}
              height={500}
              className={cn('rounded-md', {
                'w-20 h-20 object-cover': format === 'line',
              })}
              unoptimized
            />
          )}
      <div className="flex flex-col gap-1">
        <div className="font-medium">{track.title}</div>
        <div className="text-sm text-muted-foreground">
          {track.artists[0].name}
        </div>

        {appendFooter}
      </div>
    </div>
  );
}
