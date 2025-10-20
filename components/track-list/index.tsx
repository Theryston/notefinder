'use client';

import { GetTrackCustomWhereWithCacheConditions } from '@/lib/services/track/get-track-cached';
import { Track, TrackItem } from '../track-item';
import { useState } from 'react';
import { getTrackList } from './actions';
import { dbTrackToTrackItem } from '@/lib/utils';
import { Button } from '../ui/button';
import Link from 'next/link';

export type PaginationType = {
  page: number;
  total: number;
  take: number;
  cacheTags: string[];
  conditions: GetTrackCustomWhereWithCacheConditions[];
};

export function TrackList({
  itemVariant = 'default',
  tracks: initialTracks,
  title,
  customAction,
  pagination,
  endMessage,
}: {
  itemVariant?: 'default' | 'numbered';
  tracks: Track[];
  title?: string;
  customAction?: React.ReactNode;
  pagination?: PaginationType;
  endMessage?: React.ReactNode;
}) {
  const [tracks, setTracks] = useState(initialTracks);
  const [page, setPage] = useState(pagination?.page || 1);
  const [take, setTake] = useState(pagination?.take || 10);
  const [total, setTotal] = useState(pagination?.total || 0);
  const [isFetching, setIsFetching] = useState(false);
  const [conditions, setConditions] = useState(pagination?.conditions || []);

  const hasNextPage = page * take < total;

  const fetchTracks = async (params: {
    page: number;
    take: number;
    conditions: GetTrackCustomWhereWithCacheConditions[];
    cacheTags: string[];
  }) => {
    setIsFetching(true);

    try {
      const { tracks, total } = await getTrackList(
        params.page,
        params.take,
        params.conditions,
        params.cacheTags,
      );

      setPage(params.page);
      setTake(params.take);
      setTotal(total);
      setConditions(params.conditions);
      setTracks((prev) => [...prev, ...tracks.map(dbTrackToTrackItem)]);
    } finally {
      setIsFetching(false);
    }
  };

  if (tracks.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {title && <h2 className="text-xl font-bold">{title}</h2>}
        {customAction}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map((track, index) => (
          <TrackItem
            key={track.videoId}
            track={track}
            href={`/tracks/${track.id}`}
            customThumbnail={
              itemVariant === 'numbered' && (
                <Link
                  href={`/tracks/${track.id}`}
                  className="text-xl font-bold size-20 flex items-center justify-center hover:text-primary"
                >
                  {(index + 1).toString().padStart(2, '0')}
                </Link>
              )
            }
          />
        ))}
      </div>

      <div className="flex justify-center">
        {pagination && hasNextPage ? (
          <Button
            isLoading={isFetching}
            onClick={() =>
              fetchTracks({
                page: page + 1,
                take,
                conditions,
                cacheTags: pagination.cacheTags,
              })
            }
          >
            Carregar mais
          </Button>
        ) : endMessage ? (
          <div className="text-sm text-muted-foreground text-center">
            {endMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}
