import { filterValidIds } from '@/lib/utils';
import { getNotefinderWorkerClient } from './get-client';
import { NotefinderWorkerYtmusicSearchResponse } from './types';

export const notefinderWorkerYtmusicSearch = async (params: {
  query: string;
  filter?: string;
  ignore_spelling?: boolean;
  limit?: number;
}): Promise<NotefinderWorkerYtmusicSearchResponse[]> => {
  const client = await getNotefinderWorkerClient();
  const response = await client.get('/ytmusic/search', {
    params,
  });
  return filterValidIds(response.data);
};
