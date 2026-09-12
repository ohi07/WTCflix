export type MediaType = 'movie' | 'tv';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string;
}

export interface Episode {
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  overview: string;
  runtimeMinutes?: number;
  stillPath?: string;
  airDate?: string;
}

export interface Season {
  seasonNumber: number;
  name: string;
  overview?: string;
  episodeCount: number;
  episodes: Episode[];
}

export interface MediaItem {
  id: number; // TMDB ID
  type: MediaType;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview: string;
  backdropPath: string;
  posterPath: string;
  releaseYear: number;
  releaseDate?: string;
  genres: string[];
  rating: number; // e.g. 8.4
  voteCount?: number;
  runtime?: number; // in minutes (for movies)
  totalSeasons?: number; // (for TV shows)
  cast: CastMember[];
  director?: string;
  seasons?: Season[];
  trailerYoutubeKey?: string;
  featured?: boolean;
  trending?: boolean;
  popular?: boolean;
  topRated?: boolean;
  recentlyAdded?: boolean;
}

export interface PlayerOptions {
  color?: string; // Player primary color without #, e.g. "e50914"
  autoPlay?: boolean;
  nextEpisode?: boolean; // TV only
  episodeSelector?: boolean; // TV only
  progress?: number; // In seconds
}

export interface WatchProgress {
  key: string; // e.g. 'movie:1078605' or 'tv:119051:1:8'
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  backdropPath: string;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  currentTime: number;
  duration: number;
  progress: number; // Percentage, e.g. 45.2
  lastWatched: number; // Epoch ms timestamp
  userId?: string;
}

export interface VidKingPlayerEventData {
  event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked' | string;
  currentTime: number;
  duration: number;
  progress: number;
  id?: string | number;
  mediaType?: string;
  season?: number;
  episode?: number;
  timestamp?: number;
}

export interface VidKingMessage {
  type: string;
  data: VidKingPlayerEventData;
}

// Custom Server Template Configuration
export interface CustomServerConfig {
  id: string;
  name: string;
  movieUrlTemplate: string; // e.g. "https://my-server.com/embed/movie/{tmdb}"
  tvUrlTemplate: string;    // e.g. "https://my-server.com/embed/tv/{tmdb}/{season}/{episode}"
  notes?: string;
}

// Streaming Server Definition
export interface StreamingServer {
  id: string;
  name: string;
  badge?: string;
  type: 'embed' | 'stremio' | 'redirect' | 'custom';
  description: string;
  getMovieUrl: (tmdbId: number, options?: PlayerOptions, title?: string, year?: number) => string;
  getTvUrl: (tmdbId: number, season: number, episode: number, options?: PlayerOptions, title?: string, year?: number) => string;
  stremioAppUrl?: (type: 'movie' | 'tv', tmdbId: number, season?: number, episode?: number, title?: string) => string;
  stremioWebUrl?: (type: 'movie' | 'tv', tmdbId: number, season?: number, episode?: number, title?: string) => string;
}

// User Profile for Registration & Data Tracking
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarSeed: string;
  createdAt: number;
  defaultServerId?: string;
  customServers?: CustomServerConfig[];
}

// Application Route Definition
export type AppRoute =
  | { page: 'home' }
  | { page: 'movies'; genre?: string }
  | { page: 'tv'; genre?: string }
  | { page: 'anime'; genre?: string }
  | { page: 'watchlist' }
  | { page: 'watch-movie'; id: number; serverId?: string }
  | { page: 'watch-tv'; id: number; season: number; episode: number; serverId?: string }
  | { page: 'direct'; tmdbId?: string; type?: MediaType; season?: number; episode?: number }
  | { page: 'account'; tab?: 'profile' | 'history' | 'servers' | 'settings' };
