import { Thumbnail } from '@/lib/services/notefinder-ytmusic/types';
import { cn, getBiggestOne } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { PlayIcon } from 'lucide-react';
import { TrackStatus } from '@prisma/client';
import { STATUS_INFO } from '@/lib/constants';

export type Track = {
  id?: string;
  title: string;
  artists: { name: string; id?: string }[];
  thumbnails?: {
    url: string;
    width: number;
  }[];
  status?: TrackStatus;
  videoId: string;
};

type Props = {
  track: Track;
  format?: 'line';
  appendFooter?: React.ReactNode;
  customThumbnail?: React.ReactNode;
  href?: string;
  onGoToTrack?: () => void;
  showPlayButton?: boolean;
};

export function TrackItem({
  track,
  format = 'line',
  appendFooter,
  customThumbnail,
  href,
  onGoToTrack,
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
      key={`${track.artists[0].name}-${track.title}-${Math.random()}`}
      className={cn('w-full h-full relative rounded-md p-2 group', {
        'flex gap-2': format === 'line',
        'hover:bg-primary/10': !!href,
      })}
    >
      {customThumbnail ? (
        customThumbnail
      ) : biggestThumbnail?.url && href ? (
        <Link href={href}>
          <TrackImage
            track={track}
            format={format}
            biggestThumbnail={biggestThumbnail}
            onGoToTrack={onGoToTrack}
          />
        </Link>
      ) : (
        <TrackImage
          track={track}
          format={format}
          biggestThumbnail={biggestThumbnail}
          onGoToTrack={onGoToTrack}
        />
      )}
      <div className="flex flex-col gap-1 w-full">
        <TrackDetails track={track} href={href} onGoToTrack={onGoToTrack} />
        {appendFooter}
      </div>
    </div>
  );
}

function TrackDetails({
  track,
  href,
  onGoToTrack,
}: {
  track: Track;
  href?: string;
  onGoToTrack?: () => void;
}) {
  const firstArtist = track.artists[0];
  const statusInfo =
    track.status && track.status !== 'COMPLETED'
      ? STATUS_INFO[track.status]
      : null;

  return (
    <>
      <div className="flex gap-1 items-center w-full justify-between flex-wrap">
        {href ? (
          <Link href={href} className="font-medium hover:text-primary">
            {track.title}
          </Link>
        ) : (
          <div
            className="font-medium hover:text-primary cursor-pointer"
            onClick={onGoToTrack}
          >
            {track.title}
          </div>
        )}
        {statusInfo && (
          <span
            className={[
              'text-xs px-2 py-0.5 rounded-full font-medium',
              track.status === 'ERROR'
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : 'bg-primary/10 text-primary border border-primary/20',
            ].join(' ')}
            style={{ marginLeft: 6 }}
          >
            {statusInfo.title}
          </span>
        )}
      </div>
      {firstArtist.id ? (
        <Link
          href={`/artists/${firstArtist.id}`}
          className="text-sm text-muted-foreground hover:text-primary"
        >
          {firstArtist.name}
        </Link>
      ) : (
        <div className="text-sm text-muted-foreground">{firstArtist.name}</div>
      )}

      <Link
        href={`https://www.youtube.com/watch?v=${track.videoId}`}
        target="_blank"
        className="w-fit text-xs text-muted-foreground hover:text-primary"
      >
        Ouvir no YT Music
      </Link>
    </>
  );
}

function TrackImage({
  track,
  format,
  biggestThumbnail,
  onGoToTrack,
}: {
  track: Track;
  format: 'line';
  biggestThumbnail: Thumbnail;
  onGoToTrack?: () => void;
}) {
  return (
    <div
      className={cn('relative rounded-md overflow-hidden flex-shrink-0', {
        'size-20': format === 'line',
      })}
    >
      <Image
        src={`https://image.coollabs.io/image/${biggestThumbnail.url}`}
        alt={track.title}
        fill
        className="object-cover"
        unoptimized
      />
      <div
        className="group-hover:opacity-100 opacity-0 transition-opacity duration-300 bg-black/50 absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
        onClick={onGoToTrack}
      >
        <PlayIcon className="size-6 text-white" />
      </div>
    </div>
  );
}
