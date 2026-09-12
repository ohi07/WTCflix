import { MediaItem, MediaType, Episode, Season, CastMember } from '../types';

const CLIENT_TMDB_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NjZiYmE3ZDBiODZmN2IwNjZmYjI3YjE5OWMxZDgxMCIsIm5iZiI6MTYzMzg5MTA0Ny4yMTIsInN1YiI6IjYxNjMzMmU3MjE2MjFiMDA4ZTllMmNiZiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ajnJmnfjSI9somZdLiG7mpC8BxEdD9LqqSnloKQZ-88';
const TMDB_API_BASE = 'https://api.themoviedb.org/3';

// Genre ID to Name mapping
const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War',
};

const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export function getPosterUrl(path?: string | null, size = 'w500'): string {
  if (!path) {
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80';
  }
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path?: string | null, fallbackPoster?: string | null, size = 'w1280'): string {
  if (path) {
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  }
  if (fallbackPoster) {
    return getPosterUrl(fallbackPoster, 'w780');
  }
  return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1280&q=80';
}

/**
 * Universal fetcher that tries local /api/tmdb first, with client-side TMDB fallback
 */
async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const queryStr = new URLSearchParams(params).toString();
  const apiPath = `/api/tmdb${endpoint}${queryStr ? `?${queryStr}` : ''}`;

  try {
    const res = await fetch(apiPath);
    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Continue to direct TMDB fallback
  }

  // Fallback: Direct TMDB API call with token
  const directUrl = `${TMDB_API_BASE}${endpoint}${queryStr ? `?${queryStr}` : ''}`;
  const res = await fetch(directUrl, {
    headers: {
      Authorization: `Bearer ${CLIENT_TMDB_TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`TMDB error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

/**
 * Maps TMDB Raw Movie or TV show into our standard MediaItem
 */
export function mapTmdbToMediaItem(raw: any, explicitType?: MediaType): MediaItem {
  const isTv =
    explicitType === 'tv' ||
    raw.media_type === 'tv' ||
    (raw.first_air_date !== undefined && raw.release_date === undefined);
  const type: MediaType = isTv ? 'tv' : 'movie';

  const title = raw.title || raw.name || raw.original_title || raw.original_name || 'Untitled';
  const releaseDate = raw.release_date || raw.first_air_date || '';
  let releaseYear = new Date().getFullYear();
  if (releaseDate) {
    const y = parseInt(releaseDate.substring(0, 4), 10);
    if (!isNaN(y)) releaseYear = y;
  }

  // Genres
  let genres: string[] = [];
  if (Array.isArray(raw.genres) && raw.genres.length > 0) {
    genres = raw.genres.map((g: any) => g.name || GENRE_MAP[g.id] || 'General');
  } else if (Array.isArray(raw.genre_ids) && raw.genre_ids.length > 0) {
    genres = raw.genre_ids.map((id: number) => GENRE_MAP[id] || 'General').filter(Boolean);
  }
  if (genres.length === 0) {
    genres = [isTv ? 'TV Series' : 'Movie'];
  }

  // Cast
  const cast: CastMember[] = [];
  if (raw.credits && Array.isArray(raw.credits.cast)) {
    raw.credits.cast.slice(0, 10).forEach((c: any) => {
      cast.push({
        id: c.id,
        name: c.name,
        character: c.character || 'Cast',
        profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined,
      });
    });
  }

  // Trailer
  let trailerYoutubeKey: string | undefined = undefined;
  if (raw.videos && Array.isArray(raw.videos.results)) {
    const trailer =
      raw.videos.results.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer') ||
      raw.videos.results.find((v: any) => v.site === 'YouTube');
    if (trailer) {
      trailerYoutubeKey = trailer.key;
    }
  }

  // Seasons (for TV)
  let seasons: Season[] | undefined = undefined;
  if (isTv && Array.isArray(raw.seasons)) {
    seasons = raw.seasons
      .filter((s: any) => s.season_number > 0) // exclude specials by default
      .map((s: any) => ({
        seasonNumber: s.season_number,
        name: s.name || `Season ${s.season_number}`,
        overview: s.overview,
        episodeCount: s.episode_count || 0,
        episodes: [], // Episodes are loaded on demand or when season selected
      }));
  }

  // Director
  let director: string | undefined = undefined;
  if (raw.credits && Array.isArray(raw.credits.crew)) {
    const dir = raw.credits.crew.find((cr: any) => cr.job === 'Director');
    if (dir) director = dir.name;
  }

  return {
    id: raw.id,
    type,
    title,
    originalTitle: raw.original_title || raw.original_name,
    tagline: raw.tagline || undefined,
    overview: raw.overview || 'No description available for this title.',
    posterPath: getPosterUrl(raw.poster_path),
    backdropPath: getBackdropUrl(raw.backdrop_path, raw.poster_path),
    releaseYear,
    releaseDate,
    genres,
    rating: typeof raw.vote_average === 'number' ? Math.round(raw.vote_average * 10) / 10 : 7.0,
    voteCount: raw.vote_count || 0,
    runtime: raw.runtime || (Array.isArray(raw.episode_run_time) ? raw.episode_run_time[0] : undefined),
    totalSeasons: raw.number_of_seasons || (seasons ? seasons.length : undefined),
    cast,
    director,
    seasons,
    trailerYoutubeKey,
    popular: (raw.popularity || 0) > 40,
    trending: (raw.vote_count || 0) > 100,
    topRated: (raw.vote_average || 0) >= 8.0,
  };
}

/**
 * Search multi, movies, or TV shows via TMDB
 */
export async function searchTmdb(
  query: string,
  type: 'multi' | 'movie' | 'tv' = 'multi',
  page = 1
): Promise<{ items: MediaItem[]; totalResults: number; totalPages: number }> {
  if (!query.trim()) {
    return { items: [], totalResults: 0, totalPages: 0 };
  }

  const data: any = await tmdbFetch('/search', {
    query: query.trim(),
    type,
    page: page.toString(),
  });

  const rawResults: any[] = data.results || [];
  const items = rawResults
    .filter((r) => r.media_type !== 'person' && (r.poster_path || r.backdrop_path || r.title || r.name))
    .map((r) => mapTmdbToMediaItem(r, type === 'multi' ? undefined : type));

  return {
    items,
    totalResults: data.total_results || items.length,
    totalPages: data.total_pages || 1,
  };
}

/**
 * Get live trending movies & TV shows
 */
export async function getTrendingMedia(
  type: 'all' | 'movie' | 'tv' = 'all',
  timeWindow: 'day' | 'week' = 'week'
): Promise<MediaItem[]> {
  try {
    const data: any = await tmdbFetch('/trending', {
      type,
      timeWindow,
    });
    const results: any[] = data.results || [];
    return results
      .filter((r) => r.media_type !== 'person')
      .map((r) => mapTmdbToMediaItem(r, type === 'all' ? undefined : type));
  } catch (err) {
    console.error('Failed to get trending media:', err);
    return [];
  }
}

/**
 * Get popular movies or TV shows
 */
export async function getPopularMedia(type: 'movie' | 'tv' = 'movie', page = 1): Promise<MediaItem[]> {
  try {
    const data: any = await tmdbFetch('/popular', {
      type,
      page: page.toString(),
    });
    const results: any[] = data.results || [];
    return results.map((r) => mapTmdbToMediaItem(r, type));
  } catch (err) {
    console.error(`Failed to get popular ${type}:`, err);
    return [];
  }
}

/**
 * Get top rated movies or TV shows
 */
export async function getTopRatedMedia(type: 'movie' | 'tv' = 'movie', page = 1): Promise<MediaItem[]> {
  try {
    const data: any = await tmdbFetch('/top_rated', {
      type,
      page: page.toString(),
    });
    const results: any[] = data.results || [];
    return results.map((r) => mapTmdbToMediaItem(r, type));
  } catch (err) {
    console.error(`Failed to get top rated ${type}:`, err);
    return [];
  }
}

/**
 * Discover movies or TV shows by genre
 */
export async function discoverByGenre(
  type: 'movie' | 'tv',
  genreName: string,
  page = 1
): Promise<MediaItem[]> {
  try {
    const genreId = GENRE_NAME_TO_ID[genreName];
    const params: Record<string, string> = {
      type,
      page: page.toString(),
      sort_by: 'popularity.desc',
    };
    if (genreId) {
      params.with_genres = genreId.toString();
    }

    const data: any = await tmdbFetch('/discover', params);
    const results: any[] = data.results || [];
    return results.map((r) => mapTmdbToMediaItem(r, type));
  } catch (err) {
    console.error(`Failed to discover by genre ${genreName}:`, err);
    return [];
  }
}

/**
 * Discover Anime (Japanese Animation series and movies)
 */
export async function getAnimeMedia(
  type: 'all' | 'movie' | 'tv' = 'all',
  page = 1
): Promise<MediaItem[]> {
  try {
    if (type === 'all') {
      const [tvRes, movieRes] = await Promise.allSettled([
        tmdbFetch<any>('/discover', {
          type: 'tv',
          with_genres: '16',
          with_original_language: 'ja',
          sort_by: 'popularity.desc',
          page: page.toString(),
        }),
        tmdbFetch<any>('/discover', {
          type: 'movie',
          with_genres: '16',
          with_original_language: 'ja',
          sort_by: 'popularity.desc',
          page: page.toString(),
        }),
      ]);

      const tvItems: MediaItem[] =
        tvRes.status === 'fulfilled' && tvRes.value?.results
          ? tvRes.value.results.map((r: any) => mapTmdbToMediaItem(r, 'tv'))
          : [];
      const movieItems: MediaItem[] =
        movieRes.status === 'fulfilled' && movieRes.value?.results
          ? movieRes.value.results.map((r: any) => mapTmdbToMediaItem(r, 'movie'))
          : [];

      // Interleave items
      const combined: MediaItem[] = [];
      const maxLen = Math.max(tvItems.length, movieItems.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < tvItems.length) combined.push(tvItems[i]);
        if (i < movieItems.length) combined.push(movieItems[i]);
      }
      return combined;
    }

    const data: any = await tmdbFetch('/discover', {
      type,
      with_genres: '16',
      with_original_language: 'ja',
      sort_by: 'popularity.desc',
      page: page.toString(),
    });

    const results: any[] = data.results || [];
    return results.map((r) => mapTmdbToMediaItem(r, type));
  } catch (err) {
    console.error('Failed to get anime media:', err);
    return [];
  }
}

/**
 * Fetch complete media details by ID, including credits, videos, and recommendations
 */
export async function getMediaDetails(id: number, type: MediaType): Promise<MediaItem> {
  const endpoint = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
  const data: any = await tmdbFetch(endpoint);
  return mapTmdbToMediaItem(data, type);
}

/**
 * Fetch TV Season Episodes list
 */
export async function getTvSeasonEpisodes(tvId: number, seasonNumber: number): Promise<Episode[]> {
  try {
    const data: any = await tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);
    const episodesRaw: any[] = data.episodes || [];
    return episodesRaw.map((ep: any) => ({
      episodeNumber: ep.episode_number,
      seasonNumber: ep.season_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      overview: ep.overview || 'No episode overview provided.',
      runtimeMinutes: ep.runtime || undefined,
      stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : undefined,
      airDate: ep.air_date,
    }));
  } catch (err) {
    console.error(`Failed to fetch season ${seasonNumber} for TV ${tvId}:`, err);
    return [];
  }
}
