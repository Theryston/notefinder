export interface NotefinderWorkerYtmusicSearchResponse {
  category: string;
  resultType: string;
  title: string;
  album: CollapsedAlbum;
  inLibrary: boolean;
  feedbackTokens: CollapsedFeedbackTokens;
  videoId: string;
  videoType: string;
  duration: string;
  year: unknown;
  artists: CollapsedArtist[];
  duration_seconds: number;
  views: string;
  isExplicit: boolean;
  thumbnails: Thumbnail[];
}

export interface CollapsedAlbum {
  name: string;
  id: string;
}

export interface CollapsedFeedbackTokens {
  add: unknown;
  remove: unknown;
}

export interface CollapsedArtist {
  name: string;
  id: string;
}

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}
