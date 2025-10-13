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
} from '@prisma/client';

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
  EXTRACTING_LYRICS: {
    percent: 20,
    title: 'Extraindo letra da música',
    description: 'Buscando e tratando a letra da música.',
    showBar: true,
  },
  EXTRACTING_VOCALS: {
    percent: 30,
    title: 'Separando vocais da música',
    description: 'Isolando a voz do instrumental.',
    showBar: true,
  },
  DETECTING_VOCALS_NOTES: {
    percent: 50,
    title: 'Detectando notas vocais da música',
    description: 'Analisando cada trecho para identificar as notas.',
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

export const CALCULATE_TRACK_SCORE_JOB_DELAY = 1000 * 60 * 60 * 1; // 1 hour

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
