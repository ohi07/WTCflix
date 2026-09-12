import React, { useState, useEffect } from 'react';
import { Play, Star, Plus, Check, Tv, Film } from 'lucide-react';
import { MediaItem } from '../types';
import { getWatchProgress } from '../utils/storage';
import { formatSeconds } from '../utils/vidking';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  isWatchlist?: boolean;
  onToggleWatchlist?: (id: number) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onSelect,
  onPlay,
  isWatchlist = false,
  onToggleWatchlist,
}) => {
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [hasProgress, setHasProgress] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [remainingTimeStr, setRemainingTimeStr] = useState<string>('');

  useEffect(() => {
    const checkProgress = () => {
      const prog = getWatchProgress(item.type, item.id);
      if (prog && prog.currentTime > 10) {
        setHasProgress(true);
        setProgressPercent(prog.progress || (prog.duration > 0 ? (prog.currentTime / prog.duration) * 100 : 0));
        if (prog.duration > prog.currentTime) {
          const rem = prog.duration - prog.currentTime;
          setRemainingTimeStr(`${Math.ceil(rem / 60)}m left`);
        }
      } else {
        setHasProgress(false);
      }
    };

    checkProgress();
    window.addEventListener('wtcflix_progress_updated', checkProgress);
    return () => window.removeEventListener('wtcflix_progress_updated', checkProgress);
  }, [item.id, item.type]);

  return (
    <div
      id={`media-card-${item.id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/60 border border-white/5 hover:border-red-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-red-950/30 hover:-translate-y-1.5 cursor-pointer"
      onClick={() => onSelect(item)}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-900 animate-pulse flex items-center justify-center">
            <Film className="w-8 h-8 text-neutral-800" />
          </div>
        )}
        <img
          src={item.posterPath}
          alt={item.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
            {item.type === 'tv' ? <Tv className="w-3 h-3 text-red-400" /> : <Film className="w-3 h-3 text-red-400" />}
            <span>{item.type === 'tv' ? 'TV Series' : 'Movie'}</span>
          </span>

          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold border border-white/10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{item.rating.toFixed(1)}</span>
          </span>
        </div>

        {/* Hover Overlay with Quick Action Buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <button
              id={`card-play-btn-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(item);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/40 transition-all hover:scale-[1.02]"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{hasProgress ? 'Resume' : 'Watch Now'}</span>
            </button>

            {onToggleWatchlist && (
              <button
                id={`card-watchlist-btn-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(item.id);
                }}
                className={`p-2 rounded-lg border transition-colors ${
                  isWatchlist
                    ? 'bg-red-600/20 text-red-400 border-red-500/40 hover:bg-red-600/30'
                    : 'bg-neutral-900/80 text-white border-white/20 hover:bg-white/20'
                }`}
                title={isWatchlist ? 'Remove from My List' : 'Add to My List'}
              >
                {isWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="text-[11px] text-neutral-300 line-clamp-2">
            {item.overview}
          </div>
        </div>

        {/* Stored playback progress bar indicator at bottom of poster */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1">
        <div>
          <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
            <span>{item.releaseYear}</span>
            <span>•</span>
            <span className="truncate">{item.genres.slice(0, 2).join(', ')}</span>
            {remainingTimeStr && (
              <>
                <span>•</span>
                <span className="text-red-400 font-medium">{remainingTimeStr}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
