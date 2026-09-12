import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Trash2, Clock, CheckCircle, Tv, Film } from 'lucide-react';
import { WatchProgress } from '../types';
import { getAllWatchProgress, removeWatchProgress, clearAllWatchProgress } from '../utils/storage';
import { formatSeconds, formatRelativeTime } from '../utils/vidking';

interface ContinueWatchingRowProps {
  onResume: (progress: WatchProgress) => void;
}

export const ContinueWatchingRow: React.FC<ContinueWatchingRowProps> = ({ onResume }) => {
  const [progressList, setProgressList] = useState<WatchProgress[]>([]);

  const loadProgress = () => {
    const list = getAllWatchProgress();
    // Filter items that have at least 15 seconds watched and haven't finished completely (>95%)
    const active = list.filter((item) => item.currentTime > 15);
    setProgressList(active);
  };

  useEffect(() => {
    loadProgress();
    window.addEventListener('wtcflix_progress_updated', loadProgress);
    return () => window.removeEventListener('wtcflix_progress_updated', loadProgress);
  }, []);

  const handleRemove = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    removeWatchProgress(key);
  };

  if (progressList.length === 0) {
    return null;
  }

  return (
    <section className="relative my-8">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <RotateCcw className="w-5 h-5 text-red-500" />
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            Continue Watching
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            ({progressList.length} in progress)
          </span>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Clear all playback history?')) {
              clearAllWatchProgress();
            }
          }}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Clear History
        </button>
      </div>

      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {progressList.slice(0, 8).map((item) => {
            const percentage =
              item.progress ||
              (item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0);
            const remaining =
              item.duration > item.currentTime ? item.duration - item.currentTime : 0;

            return (
              <div
                key={item.key}
                id={`continue-item-${item.key.replace(/:/g, '-')}`}
                onClick={() => onResume(item)}
                className="group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/80 border border-white/10 hover:border-red-500/60 shadow-lg hover:shadow-red-950/30 transition-all duration-300 cursor-pointer"
              >
                {/* Backdrop / Still Thumbnail with 16:9 Aspect */}
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
                  <img
                    src={item.backdropPath || item.posterPath}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase">
                      {item.mediaType === 'tv' ? (
                        <>
                          <Tv className="w-3 h-3 text-red-400" />
                          <span>S{item.season}:E{item.episode}</span>
                        </>
                      ) : (
                        <>
                          <Film className="w-3 h-3 text-red-400" />
                          <span>Movie</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleRemove(e, item.key)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-neutral-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove from Continue Watching"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50 group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Red Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-neutral-800">
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${Math.min(100, Math.max(3, percentage))}%` }}
                    />
                  </div>
                </div>

                {/* Details Bottom */}
                <div className="p-3 flex flex-col justify-between gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      {formatRelativeTime(item.lastWatched)}
                    </span>
                  </div>

                  {item.episodeTitle && (
                    <p className="text-xs text-neutral-400 truncate">
                      {item.episodeTitle}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1 font-mono">
                    <span>{formatSeconds(item.currentTime)} watched</span>
                    {remaining > 0 ? (
                      <span className="text-red-400 font-sans font-medium">
                        {Math.ceil(remaining / 60)} min left
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1 font-sans">
                        <CheckCircle className="w-3 h-3" /> Finished
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
