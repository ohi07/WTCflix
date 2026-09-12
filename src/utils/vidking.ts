import { PlayerOptions } from '../types';

/**
 * Validates and sanitizes a TMDB ID to prevent injection and malformed inputs.
 */
export function sanitizeTmdbId(tmdbId: string | number): number | null {
  if (typeof tmdbId === 'number') {
    return Number.isInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;
  }
  if (typeof tmdbId === 'string') {
    const trimmed = tmdbId.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = parseInt(trimmed, 10);
      return parsed > 0 ? parsed : null;
    }
  }
  return null;
}

/**
 * Validates season or episode number.
 */
export function sanitizePositiveInt(value: string | number, fallback = 1): number {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value.trim(), 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : fallback;
  }
  return fallback;
}

/**
 * Sanitizes hex color without '#'
 */
export function sanitizeColor(color?: string, fallback = 'e50914'): string {
  if (!color) return fallback;
  const cleaned = color.replace(/^#/, '').trim();
  return /^[0-9a-fA-F]{3,8}$/.test(cleaned) ? cleaned : fallback;
}

/**
 * Builds the VidKing movie embed URL according to specifications.
 * Format: https://www.vidking.net/embed/movie/{tmdbId}?color=e50914&autoPlay=true&progress=120
 */
export function getMovieEmbedUrl(
  tmdbId: string | number,
  options: PlayerOptions = {}
): string {
  const sanitizedId = sanitizeTmdbId(tmdbId);
  if (!sanitizedId) {
    throw new Error(`Invalid TMDB ID: ${tmdbId}`);
  }

  const url = new URL(`https://www.vidking.net/embed/movie/${sanitizedId}`);
  const params = new URLSearchParams();

  // Color parameter (default 'e50914' red)
  const color = sanitizeColor(options.color);
  if (color) {
    params.set('color', color);
  }

  // Autoplay
  if (options.autoPlay !== undefined) {
    params.set('autoPlay', options.autoPlay ? 'true' : 'false');
  }

  // Progress start point in seconds
  if (options.progress !== undefined && options.progress > 0) {
    const progressSeconds = Math.floor(options.progress);
    if (progressSeconds > 0) {
      params.set('progress', progressSeconds.toString());
    }
  }

  const queryString = params.toString();
  return queryString ? `${url.toString()}?${queryString}` : url.toString();
}

/**
 * Builds the VidKing TV episode embed URL according to specifications.
 * Format: https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true
 */
export function getTvEmbedUrl(
  tmdbId: string | number,
  season: string | number,
  episode: string | number,
  options: PlayerOptions = {}
): string {
  const sanitizedId = sanitizeTmdbId(tmdbId);
  if (!sanitizedId) {
    throw new Error(`Invalid TMDB ID: ${tmdbId}`);
  }

  const s = sanitizePositiveInt(season, 1);
  const ep = sanitizePositiveInt(episode, 1);

  const url = new URL(`https://www.vidking.net/embed/tv/${sanitizedId}/${s}/${ep}`);
  const params = new URLSearchParams();

  // Color parameter
  const color = sanitizeColor(options.color);
  if (color) {
    params.set('color', color);
  }

  // Autoplay
  if (options.autoPlay !== undefined) {
    params.set('autoPlay', options.autoPlay ? 'true' : 'false');
  }

  // TV specific parameters (enabled by default as requested)
  if (options.nextEpisode !== undefined) {
    params.set('nextEpisode', options.nextEpisode ? 'true' : 'false');
  } else {
    params.set('nextEpisode', 'true');
  }

  if (options.episodeSelector !== undefined) {
    params.set('episodeSelector', options.episodeSelector ? 'true' : 'false');
  } else {
    params.set('episodeSelector', 'true');
  }

  // Progress start point
  if (options.progress !== undefined && options.progress > 0) {
    const progressSeconds = Math.floor(options.progress);
    if (progressSeconds > 0) {
      params.set('progress', progressSeconds.toString());
    }
  }

  const queryString = params.toString();
  return queryString ? `${url.toString()}?${queryString}` : url.toString();
}

/**
 * Format seconds into mm:ss or hh:mm:ss format
 */
export function formatSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hrs > 0) {
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Relative time formatter (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
