import {
  Album,
  Artist,
  Prisma,
  Thumbnail,
  Track,
  TrackArtist,
  TrackNote,
  TrackStatus,
  TrackView,
  User,
  UserFavoriteTrack,
  UserSectionVisibility,
  UserSectionVisibilityValue,
} from '@/lib/generated/prisma/client';

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

export const FULL_TRACK_INCLUDE = {
  notes: true,
  thumbnails: true,
  album: true,
  creator: true,
  trackArtists: { include: { artist: true } },
  _count: { select: { views: true } },
};

export type LyricsWord = {
  word: string;
  start: number;
  end: number;
};

export type LyricsSegment = {
  avg_logprob: number;
  compression_ratio: number;
  end: number;
  id: number;
  no_speech_prob: number;
  seek: number;
  start: number;
  temperature: number;
  text: string;
  tokens: number[];
};

export type Lyrics = {
  words: LyricsWord[];
  segments?: LyricsSegment[];
};

export type FullTrack = Track & {
  notes: TrackNote[];
  thumbnails: Thumbnail[];
  album: Album;
  creator: User;
  trackArtists: TrackArtist & { artist: Artist }[];
  _count: { views: number };
};

export type FullUser = User & {
  tracks: MinimalTrack[];
  userSectionVisibility: UserSectionVisibility[];
  userFavoriteTracks: (UserFavoriteTrack & { track: MinimalTrack })[];
  trackViews: (TrackView & { track: MinimalTrack })[];
  _count: {
    tracks: number;
    userFavoriteTracks: number;
    trackViews: number;
  };
};

export type StatusInfo = {
  percent?: number;
  title: string;
  description: string;
  showBar: boolean;
};

export const STATUS_INFO: Record<TrackStatus, StatusInfo> = {
  QUEUED: {
    percent: 0,
    title: 'Na fila para começar',
    description: 'Aguardando disponibilidade para iniciar o processamento.',
    showBar: true,
  },
  DOWNLOADING_THUMBNAILS: {
    percent: 5,
    title: 'Baixando miniaturas',
    description: 'Estamos coletando as imagens do vídeo.',
    showBar: true,
  },
  DOWNLOADING_VIDEO: {
    percent: 10,
    title: 'Importando detalhes da música',
    description: 'Preparando o material para análise.',
    showBar: true,
  },
  EXTRACTING_VOCALS: {
    percent: 40,
    title: 'Separando vocais da música',
    description: 'Isolando a voz do instrumental.',
    showBar: true,
  },
  DETECTING_VOCALS_NOTES: {
    percent: 65,
    title: 'Detectando notas vocais da música',
    description: 'Analisando cada trecho para identificar as notas.',
    showBar: true,
  },
  EXTRACTING_LYRICS: {
    percent: 90,
    title: 'Extraindo letra da música',
    description: 'Buscando e tratando a letra da música.',
    showBar: true,
  },
  COMPLETED: {
    percent: 100,
    title: 'Concluído',
    description: 'Tudo pronto! As notas foram geradas com sucesso.',
    showBar: true,
  },
  ERROR: {
    title: 'Erro ao processar',
    description: 'Houve um problema ao processar a música.',
    showBar: false,
  },
};

export const MAX_STATIC_PAGES = 100;
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export const CALCULATE_TRACK_SCORE_JOB_DELAY_SECONDS = 60 * 15; // 15 minutes

export const DAILY_STREAK_TARGET_SECONDS = 60 * 5; // 5 minutes
export const DAILY_STREAK_HEARTBEAT_INTERVAL_MS = 5_000;
export const DAILY_STREAK_MAX_HEARTBEAT_SECONDS = 20;
export const DAILY_STREAK_SERVER_TIME_TOLERANCE_SECONDS = 0;

export type DailyPracticeStreakStatus = {
  isLoggedIn: boolean;
  day: string;
  listenedSeconds: number;
  targetSeconds: number;
  completedToday: boolean;
  currentStreakDays: number;
  remainingSeconds: number;
};

export const MINIMAL_TRACK_INCLUDE: Prisma.TrackInclude = {
  trackArtists: {
    include: { artist: true },
  },
  thumbnails: true,
};

export type MinimalTrack = Track & {
  trackArtists: { artist: Artist }[];
  thumbnails: Thumbnail[];
};

export const FULL_USER_INCLUDE: Prisma.UserInclude = {
  tracks: {
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: MINIMAL_TRACK_INCLUDE,
  },
  userSectionVisibility: true,
  userFavoriteTracks: {
    include: {
      track: {
        include: MINIMAL_TRACK_INCLUDE,
      },
    },
  },
  trackViews: {
    distinct: ['trackId'],
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      track: {
        include: MINIMAL_TRACK_INCLUDE,
      },
    },
  },
  _count: {
    select: {
      tracks: true,
      userFavoriteTracks: true,
      trackViews: true,
    },
  },
};
