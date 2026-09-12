import React, { useEffect } from 'react';
import { X, Film } from 'lucide-react';

interface TrailerModalProps {
  youtubeKey: string | null;
  title: string;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ youtubeKey, title, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (youtubeKey) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [youtubeKey, onClose]);

  if (!youtubeKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-white truncate">
              {title} - Official Trailer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&rel=0`}
            title={`${title} Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
