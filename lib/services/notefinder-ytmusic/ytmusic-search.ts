import { filterValidIds } from '@/lib/utils';
import { getNotefinderYtMusicClient } from './get-client';
import { NotefinderYtmusicSearchResponse } from './types';
import { unstable_cacheTag as cacheTag } from 'next/cache';

export const notefinderYtmusicSearch = async (params: {
  query: string;
  filter?: string;
  ignore_spelling?: boolean;
  limit?: number;
}): Promise<NotefinderYtmusicSearchResponse[]> => {
  'use cache: remote';
  cacheTag(`search_${params.query}`);

  console.log(`Searching for ${params.query} on Notefinder YT Music`);

  if (!params.filter) params.filter = 'songs';
  if (!params.ignore_spelling) params.ignore_spelling = false;
  if (!params.limit) params.limit = 30;

  const client = await getNotefinderYtMusicClient();
  const response = await client.get('', {
    params,
  });
  return filterValidIds(response.data);
};
