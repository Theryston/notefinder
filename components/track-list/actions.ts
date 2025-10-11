'use server';

import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';

export const getTrackList = async (
  page: number,
  take: number,
  conditions: GetTrackCustomWhereWithCacheConditions[],
  cacheTags: string[],
) => {
  const { tracks, total } = await getTrackCustomWhereWithCache({
    conditions,
    take,
    page,
    cacheTags,
  });

  return { tracks, total };
};
