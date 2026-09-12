import React, { useState, useEffect } from 'react';
import { Play, Info, Star, Plus, Check, Film, Tv, Volume2 } from 'lucide-react';
import { MediaItem } from '../types';

interface HeroBannerProps {
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onMoreInfo: (item: MediaItem) => void;
  onOpenTrailer: (youtubeKey: string, title: string) => void;
  watchlistIds: number[];
  onToggleWatchlist: (id: number) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  items,
  onPlay,
  onMoreInfo,
  onOpenTrailer,
  watchlistIds,
  onToggleWatchlist,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const featured = items.length > 0 ? items[currentIndex] : null;

  // Auto-rotate featured item every 10 seconds if user is idle
  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!featured) return null;

  const isWatchlist = watchlistIds.includes(featured.id);

  return (
    <div className="relative w-full min-h-[580px] sm:min-h-[640px] md:min-h-[720px] flex items-center bg-black overflow-hidden pt-16">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0 z-0">
        <img
          key={featured.id}
          src={featured.backdropPath}
          alt={featured.title}
          className="w-full h-full object-cover object-center animate-in fade-in zoom-in-105 duration-1000"
        />
        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/40" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Tag Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-red-600/40">
              {featured.type === 'tv' ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
              <span>{featured.type === 'tv' ? 'Featured Series' : 'Featured Movie'}</span>
            </span>

            <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-900/80 backdrop-blur-md text-amber-400 text-xs font-bold border border-white/10">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{featured.rating.toFixed(1)}</span>
            </span>

            <span className="text-xs text-neutral-300 font-medium px-2 py-0.5 rounded bg-white/10">
              {featured.releaseYear}
            </span>

            {featured.runtime && (
              <span className="text-xs text-neutral-300 font-medium px-2 py-0.5 rounded bg-white/10">
                {Math.floor(featured.runtime / 60)}h {featured.runtime % 60}m
              </span>
            )}

            {featured.totalSeasons && (
              <span className="text-xs text-neutral-300 font-medium px-2 py-0.5 rounded bg-white/10">
                {featured.totalSeasons} {featured.totalSeasons === 1 ? 'Season' : 'Seasons'}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight font-display uppercase leading-tight drop-shadow-lg mb-3">
            {featured.title}
          </h1>

          {/* Tagline */}
          {featured.tagline && (
            <p className="text-sm sm:text-base text-red-400 font-semibold italic mb-3 drop-shadow">
              "{featured.tagline}"
            </p>
          )}

          {/* Overview */}
          <p className="text-sm sm:text-base text-neutral-300 line-clamp-3 md:line-clamp-4 leading-relaxed mb-6 max-w-xl drop-shadow">
            {featured.overview}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {featured.genres.map((genre) => (
              <span
                key={genre}
                className="text-xs px-2.5 py-1 rounded-full bg-neutral-800/80 text-neutral-300 border border-neutral-700/60 font-medium"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Watch Now Button */}
            <button
              id="hero-watch-now-btn"
              onClick={() => onPlay(featured)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Watch Now</span>
            </button>

            {/* More Info Button */}
            <button
              id="hero-more-info-btn"
              onClick={() => onMoreInfo(featured)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-700/90 text-white font-semibold text-sm sm:text-base border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            >
              <Info className="w-5 h-5 text-neutral-300" />
              <span>Details</span>
            </button>

            {/* Trailer button */}
            {featured.trailerYoutubeKey && (
              <button
                id="hero-trailer-btn"
                onClick={() => onOpenTrailer(featured.trailerYoutubeKey!, featured.title)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-sm font-medium backdrop-blur-md transition-colors"
              >
                <Film className="w-4 h-4 text-red-400" />
                <span>Trailer</span>
              </button>
            )}

            {/* Watchlist button */}
            <button
              id="hero-watchlist-btn"
              onClick={() => onToggleWatchlist(featured.id)}
              className={`p-3 rounded-xl border transition-colors ${
                isWatchlist
                  ? 'bg-red-600/20 text-red-400 border-red-500/40'
                  : 'bg-neutral-900/80 text-white border-white/20 hover:bg-white/10'
              }`}
              title={isWatchlist ? 'Remove from My List' : 'Add to My List'}
            >
              {isWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Featured Switcher Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx ? 'w-8 bg-red-600' : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              title={item.title}
            />
          ))}
        </div>
      )}
    </div>
  );
};
