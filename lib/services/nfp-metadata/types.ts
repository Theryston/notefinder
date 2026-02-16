export type ExternalTrackThumbnail = {
  url: string;
  width?: number;
  height?: number;
};

export type ExternalTrack = {
  videoId?: string;
  thumbnails?: ExternalTrackThumbnail[];
  [key: string]: unknown;
};

export type TrackMediaUrls = {
  musicMp3Url: string;
  vocalsMp3Url: string;
};
