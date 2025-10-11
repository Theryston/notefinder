import { filterValidIds } from '@/lib/utils';
import { getNotefinderYtMusicClient } from './get-client';
import { NotefinderYtmusicSearchResponse } from './types';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';

export const notefinderYtmusicSearch = async (params: {
  query: string;
  filter?: string;
  ignore_spelling?: boolean;
  limit?: number;
}): Promise<NotefinderYtmusicSearchResponse[]> => {
  'use cache: remote';
  cacheLife('max');
  cacheTag(`search_${params.query}`);

  console.log(`Searching for ${params.query} on Notefinder YT Music`);

  const client = await getNotefinderYtMusicClient();
  const response = await client.get('/ytmusic/search', {
    params,
  });
  return filterValidIds(response.data);
};
