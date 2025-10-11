import { UserSectionVisibilityValue } from '@prisma/client';

export const DEFAULT_SECTION_VISIBILITY: Record<
  string,
  UserSectionVisibilityValue
> = {
  PROCESSING_TRACKS: 'PUBLIC',
  ADDED_TRACKS: 'PUBLIC',
  FAVORITE_TRACKS: 'PUBLIC',
  RECENT_VIEWS: 'ME_ONLY',
};

export const MAX_SITEMAP_SIZE = 50000;
