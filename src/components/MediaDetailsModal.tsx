import React, { useState, useEffect } from 'react';
import { X, Play, Star, Plus, Check, Clock, Calendar, Film, Tv, Share2, AlertCircle, ArrowRight } from 'lucide-react';
import { MediaItem, Season, Episode } from '../types';
import { VidKingPlayer } from './VidKingPlayer';
import { MediaCard } from './MediaCard';
import { getWatchProgress } from '../utils/storage';
import { navigateTo } from '../utils/router';

interface MediaDetailsModalProps {
  media: MediaItem;
  allMedia: MediaItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectRelated: (item: MediaItem) => void;
  onOpenTrailer: (youtubeKey: string, title: string) => void;
  isWatchlist: boolean;
  onToggleWatchlist: (id: number) => void;
  autoStartPlay?: boolean;
  initialSeason?: number;
  initialEpisode?: number;
}

export const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  media,
  allMedia,
  isOpen,
  onClose,
  onSelectRelated,
  onOpenTrailer,
  isWatchlist,
  onToggleWatchlist,
  autoStartPlay = false,
  initialSeason = 1,
  initialEpisode = 1,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(autoStartPlay);
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisode);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync state when media or initial values change
  useEffect(() => {
    setIsPlaying(autoStartPlay);
    setSelectedSeason(initialSeason);
    setSelectedEpisode(initialEpisode);
  }, [media.id, autoStartPlay, initialSeason, initialEpisode]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Active season and episodes
  const currentSeasonData = media.seasons?.find((s) => s.seasonNumber === selectedSeason) || media.seasons?.[0];
  const episodesList: Episode[] = currentSeasonData?.episodes || [];

  // Related items in same category or genre
  const relatedItems = allMedia
    .filter(
      (item) =>
        item.id !== media.id &&
        (item.type === media.type || item.genres.some((g) => media.genres.includes(g)))
    )
    .slice(0, 6);

  const handleEpisodeSelect = (epNumber: number) => {
    setSelectedEpisode(epNumber);
    setIsPlaying(true);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="media-details-dialog"
        className="relative w-full max-w-5xl bg-neutral-950 border border-white/10 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl my-auto text-neutral-200 flex flex-col max-h-[100vh] sm:max-h-[92vh]"
      >
        {/* Top Header Sticky Controls */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            id="details-share-btn"
            onClick={handleShare}
            className="p-2 rounded-full bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            title="Share"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <button
            id="details-close-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-red-600 text-neutral-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1">
          {/* Active Player View or Cinematic Backdrop */}
          {isPlaying ? (
            <div className="p-3 sm:p-6 bg-black">
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() => setIsPlaying(false)}
                  className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  ← Back to Details Overview
                </button>
                <button
                  onClick={() => {
                    onClose();
                    if (media.type === 'tv') {
                      navigateTo({ page: 'watch-tv', id: media.id, season: selectedSeason, episode: selectedEpisode });
                    } else {
                      navigateTo({ page: 'watch-movie', id: media.id });
                    }
                  }}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <span>Open Dedicated Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* VidKing Player Embed */}
              <VidKingPlayer
                media={media}
                seasonNumber={selectedSeason}
                episodeNumber={selectedEpisode}
                onEpisodeChange={(s, ep) => {
                  setSelectedSeason(s);
                  setSelectedEpisode(ep);
                }}
                onClose={() => setIsPlaying(false)}
              />
            </div>
          ) : (
            <div className="relative aspect-video sm:aspect-[21/9] w-full overflow-hidden bg-neutral-900">
              <img
                src={media.backdropPath}
                alt={media.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-transparent" />

              {/* Big Play Overlay Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  id="details-hero-play-btn"
                  onClick={() => setIsPlaying(true)}
                  className="group/btn flex items-center gap-3 px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-base shadow-2xl shadow-red-600/50 hover:scale-105 transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                  <span>
                    {media.type === 'tv'
                      ? `Watch S${selectedSeason} : E${selectedEpisode}`
                      : 'Watch Now'}
                  </span>
                </button>
              </div>

              {/* Title & Badges in Backdrop */}
              <div className="absolute bottom-4 left-4 sm:left-6 sm:bottom-6 right-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded bg-red-600 text-white text-xs font-black uppercase tracking-wider">
                    {media.type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-amber-400 text-xs font-bold border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{media.rating.toFixed(1)}</span>
                  </span>
                  <span className="text-xs text-neutral-300 font-medium px-2 py-0.5 rounded bg-black/60 border border-white/10">
                    {media.releaseYear}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white font-display uppercase tracking-tight">
                  {media.title}
                </h2>
              </div>
            </div>
          )}

          {/* Details Body */}
          <div className="p-4 sm:p-6 md:p-8 space-y-8">
            {/* Quick Action & Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div className="flex flex-wrap items-center gap-3">
                {!isPlaying && (
                  <button
                    id="details-watch-now-action-btn"
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>
                      {media.type === 'tv'
                        ? `Stream S${selectedSeason}:E${selectedEpisode}`
                        : 'Watch Now'}
                    </span>
                  </button>
                )}

                {media.trailerYoutubeKey && (
                  <button
                    id="details-trailer-btn"
                    onClick={() => onOpenTrailer(media.trailerYoutubeKey!, media.title)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium border border-white/10 transition-colors"
                  >
                    <Film className="w-4 h-4 text-red-400" />
                    <span>Watch Trailer</span>
                  </button>
                )}

                <button
                  id="details-toggle-watchlist-btn"
                  onClick={() => onToggleWatchlist(media.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    isWatchlist
                      ? 'bg-red-600/20 text-red-400 border-red-500/40'
                      : 'bg-neutral-900 text-neutral-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {isWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isWatchlist ? 'In My List' : 'Add to My List'}</span>
                </button>
              </div>

              {/* Runtime / Date Meta */}
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                {media.runtime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-400" />
                    <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>
                  </span>
                )}
                {media.releaseDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{media.releaseDate}</span>
                  </span>
                )}
                {media.director && (
                  <span>
                    Director: <strong className="text-white font-medium">{media.director}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Poster + Overview + Cast Split */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Poster Column */}
              <div className="hidden md:block md:col-span-1">
                <img
                  src={media.posterPath}
                  alt={media.title}
                  className="w-full rounded-xl border border-white/10 shadow-xl"
                />
              </div>

              {/* Story & Cast Column */}
              <div className="md:col-span-3 space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-red-400 font-bold mb-1.5">
                    Storyline
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                    {media.overview}
                  </p>
                </div>

                {/* Genres */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-2">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {media.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 rounded-lg bg-neutral-900 border border-white/10 text-xs font-medium text-neutral-300"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cast */}
                {media.cast && media.cast.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-neutral-400 font-bold mb-2.5">
                      Top Cast
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {media.cast.map((actor) => (
                        <div
                          key={actor.id}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-neutral-900/60 border border-white/5"
                        >
                          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {actor.profilePath ? (
                              <img
                                src={actor.profilePath}
                                alt={actor.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-neutral-400">
                                {actor.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {actor.name}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">
                              {actor.character}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TV Series Episode Explorer Section */}
            {media.type === 'tv' && media.seasons && media.seasons.length > 0 && (
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Tv className="w-5 h-5 text-red-500" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Episodes
                    </h3>
                  </div>

                  {/* Season Selector Dropdown/Tabs */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="season-select" className="text-xs text-neutral-400">
                      Season:
                    </label>
                    <select
                      id="season-select"
                      value={selectedSeason}
                      onChange={(e) => {
                        setSelectedSeason(Number(e.target.value));
                        setSelectedEpisode(1);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-red-500"
                    >
                      {media.seasons.map((s) => (
                        <option key={s.seasonNumber} value={s.seasonNumber}>
                          {s.name} ({s.episodeCount} Episodes)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Episodes Grid/List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {episodesList.map((ep) => {
                    const isCurrent =
                      selectedSeason === ep.seasonNumber && selectedEpisode === ep.episodeNumber;
                    const epProgress = getWatchProgress('tv', media.id, ep.seasonNumber, ep.episodeNumber);

                    return (
                      <div
                        key={`${ep.seasonNumber}-${ep.episodeNumber}`}
                        onClick={() => handleEpisodeSelect(ep.episodeNumber)}
                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                          isCurrent
                            ? 'bg-red-950/30 border-red-500 shadow-md shadow-red-950/50'
                            : 'bg-neutral-900/60 border-white/5 hover:border-white/20 hover:bg-neutral-900'
                        }`}
                      >
                        {/* Episode Thumbnail or Number */}
                        <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-white/10 flex items-center justify-center">
                          {ep.stillPath ? (
                            <img
                              src={ep.stillPath}
                              alt={ep.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-sm font-bold text-neutral-600 font-mono">
                              EP {ep.episodeNumber}
                            </div>
                          )}

                          {/* Play icon overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 fill-white text-white" />
                          </div>

                          {/* Episode number badge */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] font-bold text-white">
                            E{ep.episodeNumber}
                          </div>

                          {/* Progress bar on episode card */}
                          {epProgress && epProgress.currentTime > 10 && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                              <div
                                className="h-full bg-red-600"
                                style={{ width: `${Math.min(100, epProgress.progress || 0)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Episode details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-sm font-semibold truncate ${
                                isCurrent ? 'text-red-400' : 'text-white'
                              }`}>
                                {ep.episodeNumber}. {ep.title}
                              </h4>
                              {ep.runtimeMinutes && (
                                <span className="text-[11px] text-neutral-500 shrink-0">
                                  {ep.runtimeMinutes}m
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 line-clamp-2 mt-1">
                              {ep.overview}
                            </p>
                          </div>

                          {isCurrent && isPlaying && (
                            <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium mt-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span>Now Playing in VidKing Player</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related & Recommended Movies / TV Series */}
            {relatedItems.length > 0 && (
              <div className="border-t border-white/10 pt-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                  More Like This
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {relatedItems.map((item) => (
                    <MediaCard
                      key={`related-${item.id}`}
                      item={item}
                      onSelect={(rel) => onSelectRelated(rel)}
                      onPlay={(rel) => onSelectRelated(rel)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
