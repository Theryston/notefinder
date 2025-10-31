import { TimelineClient } from '@/components/timeline/timeline-client';
import { FullTrack, Lyrics } from '@/lib/constants';
import { Suspense } from 'react';
import { Skeleton } from '../sheleton';
import { auth } from '@/auth';
import { getUserById } from '@/lib/services/users/get-user';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { PlayingCopyright, Role } from '@/lib/generated/prisma';

export function Timeline({
  track,
  lyrics,
}: {
  track: FullTrack;
  lyrics?: Lyrics;
}) {
  if (!track) return null;
  if (!track.notes || track.notes.length === 0) return null;
  if (!track.ytId) return null;

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-4 sm:p-6">
          <Suspense fallback={<TimelineFallback />}>
            <TimelineContent track={track} lyrics={lyrics} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function getUserByIdWithCache(userId: string) {
  'use cache: remote';
  cacheTag(`user_${userId}`);
  return await getUserById(userId);
}

async function TimelineContent({
  track,
  lyrics,
}: {
  track: FullTrack;
  lyrics?: Lyrics;
}) {
  const directUrl: {
    musicUrl?: string;
    vocalsUrl?: string;
  } = {};
  let allowAudioTranspose = track.playingCopyright.includes(
    PlayingCopyright.ALLOW_TRANSPOSE,
  );
  let allowVocalsOnly = track.playingCopyright.includes(
    PlayingCopyright.ALLOW_VOCALS_ONLY,
  );

  if (track.playingCopyright.includes(PlayingCopyright.ALLOW_PLAY)) {
    directUrl.musicUrl = track.musicMp3Url || undefined;
    directUrl.vocalsUrl = allowVocalsOnly
      ? track.vocalsMp3Url || undefined
      : undefined;
  }

  if (
    !directUrl.musicUrl ||
    !directUrl.vocalsUrl ||
    !allowAudioTranspose ||
    !allowVocalsOnly
  ) {
    const session = await auth();
    const userId = session?.user?.id;

    if (userId) {
      const user = await getUserByIdWithCache(userId);

      if (user?.role === Role.ADMIN) {
        directUrl.musicUrl = track.musicMp3Url || undefined;
        directUrl.vocalsUrl = track.vocalsMp3Url || undefined;
        allowAudioTranspose = true;
        allowVocalsOnly = true;
      }
    }
  }

  return (
    <TimelineClient
      ytId={track.ytId}
      notes={track.notes}
      lyrics={lyrics}
      directUrl={directUrl}
      allowAudioTranspose={allowAudioTranspose}
    />
  );
}

function TimelineFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start w-full">
      <div className="w-full h-96 md:h-[80vh]">
        <Skeleton />
      </div>
      <div className="w-full h-96 hidden md:block">
        <Skeleton />
      </div>
    </div>
  );
}
