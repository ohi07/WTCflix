import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  icon?: React.ReactNode;
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  watchlistIds: number[];
  onToggleWatchlist: (id: number) => void;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  icon,
  items,
  onSelect,
  onPlay,
  watchlistIds,
  onToggleWatchlist,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative group/row my-8">
      {/* Row Header */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-red-500">{icon}</span>}
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            {title}
          </h2>
          <span className="text-xs text-neutral-500 font-medium ml-1">
            ({items.length})
          </span>
        </div>
      </div>

      {/* Slider Area */}
      <div className="relative max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-neutral-950/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 hover:scale-110 hover:bg-neutral-900 transition-all shadow-xl"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        >
          {items.map((item) => (
            <div
              key={`${title}-${item.id}`}
              className="w-[170px] sm:w-[200px] md:w-[220px] shrink-0"
            >
              <MediaCard
                item={item}
                onSelect={onSelect}
                onPlay={onPlay}
                isWatchlist={watchlistIds.includes(item.id)}
                onToggleWatchlist={onToggleWatchlist}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-neutral-950/80 border border-white/20 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover/row:opacity-100 hover:scale-110 hover:bg-neutral-900 transition-all shadow-xl"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};
