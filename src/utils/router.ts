import { AppRoute, MediaType } from '../types';

/**
 * Converts an AppRoute object into a clean URL path
 */
export function routeToUrl(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'movies':
      return route.genre && route.genre !== 'All'
        ? `/movies?genre=${encodeURIComponent(route.genre)}`
        : '/movies';
    case 'tv':
      return route.genre && route.genre !== 'All'
        ? `/tv?genre=${encodeURIComponent(route.genre)}`
        : '/tv';
    case 'anime':
      return route.genre && route.genre !== 'All'
        ? `/anime?genre=${encodeURIComponent(route.genre)}`
        : '/anime';
    case 'watchlist':
      return '/watchlist';
    case 'watch-movie':
      return route.serverId
        ? `/movie/${route.id}?server=${encodeURIComponent(route.serverId)}`
        : `/movie/${route.id}`;
    case 'watch-tv':
      return route.serverId
        ? `/tv/${route.id}/${route.season}/${route.episode}?server=${encodeURIComponent(route.serverId)}`
        : `/tv/${route.id}/${route.season}/${route.episode}`;
    case 'direct':
      if (route.tmdbId) {
        return `/direct?id=${encodeURIComponent(route.tmdbId)}&type=${route.type || 'movie'}${
          route.type === 'tv' ? `&s=${route.season || 1}&e=${route.episode || 1}` : ''
        }`;
      }
      return '/direct';
    case 'account':
      return route.tab ? `/account?tab=${route.tab}` : '/account';
    default:
      return '/';
  }
}

/**
 * Parses the current browser URL (path and query params) into an AppRoute
 */
export function parseCurrentRoute(): AppRoute {
  try {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    const params = new URLSearchParams(window.location.search);

    // Support query parameter overrides (e.g. ?page=movie&id=1078605 or ?watch=1078605)
    const qPage = params.get('page');
    if (qPage === 'movie') {
      const id = parseInt(params.get('id') || '0', 10);
      if (id > 0) {
        return { page: 'watch-movie', id, serverId: params.get('server') || undefined };
      }
    }
    if (qPage === 'tv') {
      const id = parseInt(params.get('id') || '0', 10);
      const season = parseInt(params.get('s') || params.get('season') || '1', 10);
      const episode = parseInt(params.get('e') || params.get('episode') || '1', 10);
      if (id > 0) {
        return { page: 'watch-tv', id, season, episode, serverId: params.get('server') || undefined };
      }
    }
    if (qPage === 'account' || qPage === 'profile') {
      return { page: 'account', tab: (params.get('tab') as any) || 'profile' };
    }
    if (qPage === 'anime') {
      return { page: 'anime', genre: params.get('genre') || 'All' };
    }
    if (qPage === 'direct') {
      return {
        page: 'direct',
        tmdbId: params.get('id') || undefined,
        type: (params.get('type') as MediaType) || 'movie',
        season: parseInt(params.get('s') || '1', 10),
        episode: parseInt(params.get('e') || '1', 10),
      };
    }

    // Path matching
    // /movie/:id
    const movieMatch = path.match(/^\/movie\/(\d+)$/);
    if (movieMatch) {
      return {
        page: 'watch-movie',
        id: parseInt(movieMatch[1], 10),
        serverId: params.get('server') || undefined,
      };
    }

    // /tv/:id/:season/:episode or /tv/:id
    const tvMatch = path.match(/^\/tv\/(\d+)(?:\/(\d+)\/(\d+))?$/);
    if (tvMatch) {
      return {
        page: 'watch-tv',
        id: parseInt(tvMatch[1], 10),
        season: tvMatch[2] ? parseInt(tvMatch[2], 10) : 1,
        episode: tvMatch[3] ? parseInt(tvMatch[3], 10) : 1,
        serverId: params.get('server') || undefined,
      };
    }

    // /movies
    if (path === '/movies') {
      return { page: 'movies', genre: params.get('genre') || 'All' };
    }

    // /tv
    if (path === '/tv') {
      return { page: 'tv', genre: params.get('genre') || 'All' };
    }

    // /anime
    if (path === '/anime') {
      return { page: 'anime', genre: params.get('genre') || 'All' };
    }

    // /watchlist
    if (path === '/watchlist') {
      return { page: 'watchlist' };
    }

    // /account or /profile
    if (path === '/account' || path === '/profile') {
      return { page: 'account', tab: (params.get('tab') as any) || 'profile' };
    }

    // /direct
    if (path === '/direct') {
      return {
        page: 'direct',
        tmdbId: params.get('id') || undefined,
        type: (params.get('type') as MediaType) || 'movie',
        season: parseInt(params.get('s') || '1', 10),
        episode: parseInt(params.get('e') || '1', 10),
      };
    }

    return { page: 'home' };
  } catch (err) {
    console.error('Failed to parse route:', err);
    return { page: 'home' };
  }
}

/**
 * Navigates to a specific route, updating browser address bar and history
 */
export function navigateTo(target: AppRoute | string, replace = false): void {
  const url = typeof target === 'string' ? target : routeToUrl(target);
  
  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }

  // Scroll to top on navigation
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Dispatch custom route changed event
  window.dispatchEvent(new Event('wtcflix_route_changed'));
}
