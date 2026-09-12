import { StreamingServer, PlayerOptions, CustomServerConfig } from '../types';
import { getMovieEmbedUrl, getTvEmbedUrl } from './vidking';

export const BUILT_IN_SERVERS: StreamingServer[] = [
  {
    id: 'vidking',
    name: 'VidKing',
    badge: 'Recommended',
    type: 'embed',
    description: 'High-speed 1080p stream with smart progress tracking and episode selector.',
    getMovieUrl: (tmdbId, options) => {
      return getMovieEmbedUrl(tmdbId, options);
    },
    getTvUrl: (tmdbId, season, episode, options) => {
      return getTvEmbedUrl(tmdbId, season, episode, options);
    },
  },
  {
    id: 'fsplus',
    name: 'FS Plus (BDIX)',
    badge: 'Free / BDIX',
    type: 'embed',
    description: 'Free high-speed BDIX bufferless streaming portal (fs.plus.net.bd) optimized for instant playback.',
    getMovieUrl: (_tmdbId, _options, title, year) => {
      const q = title ? (year ? `${title} ${year}` : title) : '';
      return `https://fs.plus.net.bd/?search=${encodeURIComponent(q)}`;
    },
    getTvUrl: (_tmdbId, season, episode, _options, title) => {
      const q = title ? `${title} S${season}E${episode}` : '';
      return `https://fs.plus.net.bd/?search=${encodeURIComponent(q)}`;
    },
  },
  {
    id: 'vidsrc',
    name: 'VidSrc Mirror',
    badge: 'Multi-Source',
    type: 'embed',
    description: 'Alternative multi-source streaming embed with auto-fallback servers.',
    getMovieUrl: (tmdbId) => {
      return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
    },
    getTvUrl: (tmdbId, season, episode) => {
      return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
    },
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    badge: 'Free Embed',
    type: 'embed',
    description: 'Global content mirror with multiple audio tracks and multi-language subtitles.',
    getMovieUrl: (tmdbId) => {
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
    },
    getTvUrl: (tmdbId, season, episode) => {
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
    },
  },
  {
    id: 'stremio',
    name: 'Stremio',
    badge: 'App & Web',
    type: 'stremio',
    description: 'Open-source media hub. Launch directly in Stremio Desktop / Mobile app or Stremio Web with Torrentio & CyberFlix addons.',
    getMovieUrl: (tmdbId, _options, title) => {
      return `https://web.stremio.com/#/search?search=${encodeURIComponent(title || `tmdb:${tmdbId}`)}`;
    },
    getTvUrl: (tmdbId, _season, _episode, _options, title) => {
      return `https://web.stremio.com/#/search?search=${encodeURIComponent(title || `tmdb:${tmdbId}`)}`;
    },
    stremioAppUrl: (type, tmdbId, season, episode, title) => {
      if (type === 'tv' && season && episode) {
        return `stremio://detail/series/${tmdbId}/${season}:${episode}`;
      }
      return title
        ? `stremio://search?search=${encodeURIComponent(title)}`
        : `stremio://detail/movie/${tmdbId}`;
    },
    stremioWebUrl: (_type, tmdbId, _season, _episode, title) => {
      return title
        ? `https://web.stremio.com/#/search?search=${encodeURIComponent(title)}`
        : `https://web.stremio.com/#/detail/movie/${tmdbId}`;
    },
  },
];

const CUSTOM_SERVERS_KEY = 'wtcflix_custom_servers';
const DEFAULT_SERVER_KEY = 'wtcflix_default_server';

/**
 * Parses a custom server URL template replacing placeholders
 */
export function resolveCustomServerUrl(
  template: string,
  params: {
    tmdbId: number;
    season?: number;
    episode?: number;
    title?: string;
    year?: number;
  }
): string {
  let url = template;
  url = url.replace(/\{tmdb\}/gi, params.tmdbId.toString());
  url = url.replace(/\{season\}/gi, (params.season || 1).toString());
  url = url.replace(/\{episode\}/gi, (params.episode || 1).toString());
  url = url.replace(/\{title\}/gi, encodeURIComponent(params.title || ''));
  url = url.replace(/\{year\}/gi, (params.year || '').toString());
  return url;
}

/**
 * Loads user-defined custom servers from storage
 */
export function getSavedCustomServers(): CustomServerConfig[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SERVERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Saves a new custom server configuration
 */
export function saveCustomServerConfig(config: CustomServerConfig): void {
  try {
    const list = getSavedCustomServers();
    const index = list.findIndex((c) => c.id === config.id);
    if (index > -1) {
      list[index] = config;
    } else {
      list.push(config);
    }
    localStorage.setItem(CUSTOM_SERVERS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('wtcflix_servers_updated'));
  } catch (err) {
    console.error('Failed to save custom server:', err);
  }
}

/**
 * Deletes a custom server configuration
 */
export function deleteCustomServerConfig(id: string): void {
  try {
    const list = getSavedCustomServers().filter((c) => c.id !== id);
    localStorage.setItem(CUSTOM_SERVERS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('wtcflix_servers_updated'));
  } catch (err) {
    console.error('Failed to delete custom server:', err);
  }
}

/**
 * Converts a custom server config into a StreamingServer instance
 */
function createCustomStreamingServer(config: CustomServerConfig): StreamingServer {
  return {
    id: `custom_${config.id}`,
    name: config.name || 'Custom Server',
    badge: 'Custom',
    type: 'custom',
    description: config.notes || 'User configured streaming server endpoint.',
    getMovieUrl: (tmdbId, _options, title, year) => {
      return resolveCustomServerUrl(config.movieUrlTemplate, { tmdbId, title, year });
    },
    getTvUrl: (tmdbId, season, episode, _options, title, year) => {
      return resolveCustomServerUrl(config.tvUrlTemplate, { tmdbId, season, episode, title, year });
    },
  };
}

/**
 * Retrieves all available servers (built-in + user custom)
 */
export function getAllAvailableServers(): StreamingServer[] {
  const customConfigs = getSavedCustomServers();
  const customServers = customConfigs.map(createCustomStreamingServer);
  return [...BUILT_IN_SERVERS, ...customServers];
}

/**
 * Gets server by ID with fallback to VidKing
 */
export function getServerById(id?: string): StreamingServer {
  const all = getAllAvailableServers();
  if (id) {
    const found = all.find((s) => s.id === id);
    if (found) return found;
  }
  // Check user default preference
  const defaultId = localStorage.getItem(DEFAULT_SERVER_KEY);
  if (defaultId) {
    const preferred = all.find((s) => s.id === defaultId);
    if (preferred) return preferred;
  }
  return BUILT_IN_SERVERS[0]; // VidKing
}

/**
 * Set user default server preference
 */
export function setDefaultServerPreference(serverId: string): void {
  try {
    localStorage.setItem(DEFAULT_SERVER_KEY, serverId);
    window.dispatchEvent(new Event('wtcflix_servers_updated'));
  } catch {
    // Ignore
  }
}

export function getDefaultServerPreference(): string {
  try {
    return localStorage.getItem(DEFAULT_SERVER_KEY) || 'vidking';
  } catch {
    return 'vidking';
  }
}
