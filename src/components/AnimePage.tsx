import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Tv,
  Film,
  SlidersHorizontal,
  Flame,
  Star,
  Play,
  Bookmark,
  Search,
  Filter,
  Loader2,
  Calendar,
} from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';
import { MEDIA_CATALOG } from '../data/mediaData';
import { getAnimeMedia } from '../services/tmdb';

interface AnimePageProps {
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  watchlistIds: number[];
  onToggleWatchlist: (id: number) => void;
  initialGenre?: string;
}

const ANIME_GENRES = [
  'All',
  'Action',
  'Fantasy',
  'Adventure',
  'Sci-Fi',
  'Romance',
  'Comedy',
  'Supernatural',
];

export const AnimePage: React.FC<AnimePageProps> = ({
  onSelect,
  onPlay,
  watchlistIds,
  onToggleWatchlist,
  initialGenre = 'All',
}) => {
  const [activeType, setActiveType] = useState<'all' | 'tv' | 'movie'>('all');
  const [selectedSubGenre, setSelectedSubGenre] = useState<string>(initialGenre);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'newest'>('popularity');
  const [animeItems, setAnimeItems] = useState<MediaItem[]>(() =>
    MEDIA_CATALOG.filter((m) => m.genres.includes('Anime') || m.genres.includes('Animation'))
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>('');

  // Fetch anime content from TMDB with language='ja' and genre='16'
  useEffect(() => {
    let isCancelled = false;
    const fetchAnime = async () => {
      setIsLoading(true);
      try {
        const results = await getAnimeMedia(activeType, 1);
        if (!isCancelled && results.length > 0) {
          // Merge with bundled catalog anime to guarantee high-quality metadata & posters
          const bundled = MEDIA_CATALOG.filter((m) => m.genres.includes('Anime'));
          const merged = [...bundled, ...results].filter(
            (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index
          );
          setAnimeItems(merged);
        }
      } catch (err) {
        console.warn('Failed to load live anime feed:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchAnime();
    return () => {
      isCancelled = true;
    };
  }, [activeType]);

  // Filter and sort items
  const filteredAnime = useMemo(() => {
    let list = [...animeItems];

    // Filter by type
    if (activeType !== 'all') {
      list = list.filter((m) => m.type === activeType);
    }

    // Filter by sub-genre
    if (selectedSubGenre && selectedSubGenre !== 'All') {
      list = list.filter((m) =>
        m.genres.some((g) => g.toLowerCase().includes(selectedSubGenre.toLowerCase()))
      );
    }

    // Filter by local search query
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
          m.overview.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.releaseYear - a.releaseYear);
    } else {
      list.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return list;
  }, [animeItems, activeType, selectedSubGenre, localSearch, sortBy]);

  // Spotlight banner anime item
  const spotlightItem = useMemo(() => {
    return (
      animeItems.find((m) => m.title.includes('Demon Slayer')) ||
      animeItems.find((m) => m.title.includes('Jujutsu')) ||
      animeItems[0]
    );
  }, [animeItems]);

  return (
    <div className="min-h-screen text-neutral-100 pt-20 pb-16">
      {/* 1. Anime Spotlight Showcase Banner */}
      {spotlightItem && (
        <div className="relative w-full overflow-hidden mb-8 border-b border-white/10 bg-neutral-950">
          {/* Backdrop Image with gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={spotlightItem.backdropPath}
              alt={spotlightItem.title}
              className="w-full h-full object-cover object-top opacity-35 blur-[1px] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="max-w-2xl">
              {/* Japanese Aesthetic Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-600/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>JAPANESE ANIMATION • アニメ</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-900/80 border border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {spotlightItem.rating.toFixed(1)}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight uppercase leading-none drop-shadow-md mb-2">
                {spotlightItem.title}
              </h1>

              {spotlightItem.originalTitle && (
                <p className="text-sm font-semibold text-red-400/90 tracking-wider mb-3">
                  {spotlightItem.originalTitle}
                </p>
              )}

              <p className="text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed mb-6 max-w-xl">
                {spotlightItem.overview}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onPlay(spotlightItem)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-red-600/40 transition-all hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Stream Anime</span>
                </button>
                <button
                  onClick={() => onSelect(spotlightItem)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold border border-white/10 transition-all cursor-pointer"
                >
                  <span>More Details</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Anime Catalog Grid & Filter System */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-wide">
                Anime Hub
              </h2>
              <span className="text-xs text-neutral-400 font-medium ml-1">
                ({filteredAnime.length} titles available)
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Stream popular Japanese series, movies, and simulcasts with multiple high-speed servers.
            </p>
          </div>

          {/* Quick Search & Sort within Anime */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search anime..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="bg-neutral-900/80 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-500 w-44 sm:w-56"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-900/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="popularity">Most Popular</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Latest Releases</option>
            </select>
          </div>
        </div>

        {/* 3. Category & Genre Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          {/* Type Toggle: All / Series / Movies */}
          <div className="inline-flex p-1 bg-neutral-900 rounded-xl border border-white/10 self-start">
            <button
              onClick={() => setActiveType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeType === 'all'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Anime
            </button>
            <button
              onClick={() => setActiveType('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeType === 'tv'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Series</span>
            </button>
            <button
              onClick={() => setActiveType('movie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeType === 'movie'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Movies</span>
            </button>
          </div>

          {/* Sub-genre Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <SlidersHorizontal className="w-4 h-4 text-neutral-500 shrink-0 mr-1" />
            {ANIME_GENRES.map((genre) => {
              const isSelected = selectedSubGenre === genre;
              return (
                <button
                  key={genre}
                  onClick={() => setSelectedSubGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Ultra-Wide Anime Media Grid (Zero desktop black bars!) */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="text-xs text-neutral-400">Loading Anime Sanctuary catalog...</p>
          </div>
        ) : filteredAnime.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {filteredAnime.map((item) => (
              <MediaCard
                key={`anime-${item.id}`}
                item={item}
                onSelect={(it) => onSelect(it)}
                onPlay={onPlay}
                isWatchlist={watchlistIds.includes(item.id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center text-neutral-400">
            <Sparkles className="w-12 h-12 text-neutral-600 mb-3" />
            <h3 className="text-lg font-semibold text-white">No Anime Titles Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
              Try selecting another genre or clear the search filter to explore more anime.
            </p>
            <button
              onClick={() => {
                setSelectedSubGenre('All');
                setLocalSearch('');
                setActiveType('all');
              }}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
