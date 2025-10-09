import { filterValidIds } from '@/lib/utils';
import { getNotefinderYtMusicClient } from './get-client';
import { NotefinderYtmusicSearchResponse } from './types';

export const notefinderYtmusicSearch = async (params: {
  query: string;
  filter?: string;
  ignore_spelling?: boolean;
  limit?: number;
}): Promise<NotefinderYtmusicSearchResponse[]> => {
  const client = await getNotefinderYtMusicClient();
  const response = await client.get('/ytmusic/search', {
    params,
  });
  return filterValidIds(response.data);
};
