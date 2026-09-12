import { MediaType, WatchProgress } from '../types';
import { getCurrentUser } from './auth';

const LEGACY_PROGRESS_KEY = 'wtcflix_watch_progress';
const LEGACY_WATCHLIST_KEY = 'wtcflix_watchlist';

/**
 * Gets the storage key prefix for the currently active user (or guest)
 */
function getUserKeyPrefix(): string {
  const user = getCurrentUser();
  return user ? user.id : 'guest';
}

function getProgressStorageKey(): string {
  const prefix = getUserKeyPrefix();
  return `wtcflix_progress_${prefix}`;
}

function getWatchlistStorageKey(): string {
  const prefix = getUserKeyPrefix();
  return `wtcflix_watchlist_${prefix}`;
}

/**
 * Builds the unique storage key for a movie or TV episode
 */
export function buildProgressKey(
  mediaType: MediaType,
  tmdbId: number,
  season?: number,
  episode?: number
): string {
  if (mediaType === 'tv') {
    return `tv:${tmdbId}:${season || 1}:${episode || 1}`;
  }
  return `movie:${tmdbId}`;
}

/**
 * Retrieves all stored watch progress items sorted by last watched timestamp descending.
 */
export function getAllWatchProgress(): WatchProgress[] {
  try {
    const key = getProgressStorageKey();
    let raw = localStorage.getItem(key);

    // Fallback to legacy key for guest if new key is empty
    if (!raw && getUserKeyPrefix() === 'guest') {
      raw = localStorage.getItem(LEGACY_PROGRESS_KEY);
    }

    if (!raw) return [];
    const parsed: Record<string, WatchProgress> = JSON.parse(raw);
    const list = Object.values(parsed);
    return list.sort((a, b) => b.lastWatched - a.lastWatched);
  } catch (err) {
    console.error('Failed to load watch progress from localStorage:', err);
    return [];
  }
}

/**
 * Retrieves progress for a specific movie or TV episode.
 */
export function getWatchProgress(
  mediaType: MediaType,
  tmdbId: number,
  season?: number,
  episode?: number
): WatchProgress | null {
  try {
    const progressKey = buildProgressKey(mediaType, tmdbId, season, episode);
    const key = getProgressStorageKey();
    let raw = localStorage.getItem(key);

    if (!raw && getUserKeyPrefix() === 'guest') {
      raw = localStorage.getItem(LEGACY_PROGRESS_KEY);
    }

    if (!raw) return null;
    const parsed: Record<string, WatchProgress> = JSON.parse(raw);
    return parsed[progressKey] || null;
  } catch (err) {
    console.error('Failed to fetch watch progress:', err);
    return null;
  }
}

/**
 * Saves or updates playback progress for an item under the active user account.
 */
export function saveWatchProgress(progressItem: WatchProgress): void {
  try {
    const user = getCurrentUser();
    const key = getProgressStorageKey();
    let raw = localStorage.getItem(key);

    if (!raw && getUserKeyPrefix() === 'guest') {
      raw = localStorage.getItem(LEGACY_PROGRESS_KEY);
    }

    const progressMap: Record<string, WatchProgress> = raw ? JSON.parse(raw) : {};

    progressMap[progressItem.key] = {
      ...progressItem,
      userId: user?.id,
      lastWatched: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(progressMap));

    // Also update legacy key if guest
    if (!user) {
      localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(progressMap));
    }

    // Dispatch a custom storage event so all components react immediately
    window.dispatchEvent(new Event('wtcflix_progress_updated'));
  } catch (err) {
    console.error('Failed to save watch progress:', err);
  }
}

/**
 * Removes a specific progress item
 */
export function removeWatchProgress(progressKey: string): void {
  try {
    const key = getProgressStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const progressMap: Record<string, WatchProgress> = JSON.parse(raw);
    delete progressMap[progressKey];
    localStorage.setItem(key, JSON.stringify(progressMap));

    if (getUserKeyPrefix() === 'guest') {
      localStorage.setItem(LEGACY_PROGRESS_KEY, JSON.stringify(progressMap));
    }

    window.dispatchEvent(new Event('wtcflix_progress_updated'));
  } catch (err) {
    console.error('Failed to remove progress:', err);
  }
}

/**
 * Clears all watch history for current user
 */
export function clearAllWatchProgress(): void {
  try {
    const key = getProgressStorageKey();
    localStorage.removeItem(key);
    if (getUserKeyPrefix() === 'guest') {
      localStorage.removeItem(LEGACY_PROGRESS_KEY);
    }
    window.dispatchEvent(new Event('wtcflix_progress_updated'));
  } catch (err) {
    console.error('Failed to clear progress:', err);
  }
}

/**
 * Watchlist helpers partitioned by user
 */
export function getWatchlistIds(): number[] {
  try {
    const key = getWatchlistStorageKey();
    let raw = localStorage.getItem(key);
    if (!raw && getUserKeyPrefix() === 'guest') {
      raw = localStorage.getItem(LEGACY_WATCHLIST_KEY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleWatchlistId(id: number): boolean {
  try {
    const list = getWatchlistIds();
    const index = list.indexOf(id);
    let isAdded = false;
    if (index > -1) {
      list.splice(index, 1);
      isAdded = false;
    } else {
      list.push(id);
      isAdded = true;
    }
    const key = getWatchlistStorageKey();
    localStorage.setItem(key, JSON.stringify(list));

    if (getUserKeyPrefix() === 'guest') {
      localStorage.setItem(LEGACY_WATCHLIST_KEY, JSON.stringify(list));
    }

    window.dispatchEvent(new Event('wtcflix_watchlist_updated'));
    return isAdded;
  } catch {
    return false;
  }
}

export function isIdInWatchlist(id: number): boolean {
  const list = getWatchlistIds();
  return list.includes(id);
}

/**
 * Watch Statistics calculation
 */
export function getWatchStats(): {
  totalSeconds: number;
  totalWatchedItems: number;
  completedItems: number;
} {
  const items = getAllWatchProgress();
  let totalSeconds = 0;
  let completedItems = 0;

  for (const item of items) {
    totalSeconds += item.currentTime || 0;
    if (item.progress >= 90) {
      completedItems++;
    }
  }

  return {
    totalSeconds,
    totalWatchedItems: items.length,
    completedItems,
  };
}

/**
 * Exports user data as JSON
 */
export function exportUserData(): string {
  const user = getCurrentUser();
  const data = {
    user: user || { id: 'guest', username: 'guest' },
    progress: getAllWatchProgress(),
    watchlist: getWatchlistIds(),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Imports user data from JSON
 */
export function importUserData(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed.progress)) {
      const progressKey = getProgressStorageKey();
      const progressMap: Record<string, WatchProgress> = {};
      for (const item of parsed.progress) {
        if (item.key) {
          progressMap[item.key] = item;
        }
      }
      localStorage.setItem(progressKey, JSON.stringify(progressMap));
    }
    if (Array.isArray(parsed.watchlist)) {
      const watchlistKey = getWatchlistStorageKey();
      localStorage.setItem(watchlistKey, JSON.stringify(parsed.watchlist));
    }
    window.dispatchEvent(new Event('wtcflix_progress_updated'));
    window.dispatchEvent(new Event('wtcflix_watchlist_updated'));
    return true;
  } catch (err) {
    console.error('Failed to import user data:', err);
    return false;
  }
}
