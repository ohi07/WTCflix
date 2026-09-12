import React, { useState, useEffect } from 'react';
import { X, Play, Film, Tv, Settings2, Sparkles, AlertCircle, ExternalLink, ArrowRight, Search, Star, Loader2, Check, ShieldCheck } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { sanitizeTmdbId, sanitizePositiveInt, getMovieEmbedUrl, getTvEmbedUrl } from '../utils/vidking';
import { VidKingPlayer } from './VidKingPlayer';
import { navigateTo } from '../utils/router';
import { searchTmdb } from '../services/tmdb';

interface DirectStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectStreamModal: React.FC<DirectStreamModalProps> = ({ isOpen, onClose }) => {
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const [tmdbIdInput, setTmdbIdInput] = useState<string>('1078605'); // Red One
  const [seasonInput, setSeasonInput] = useState<string>('1');
  const [episodeInput, setEpisodeInput] = useState<string>('8');
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Title Search state
  const [titleSearchInput, setTitleSearchInput] = useState<string>('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<MediaItem | null>(null);

  // Debounced search on title input
  useEffect(() => {
    if (!titleSearchInput.trim() || titleSearchInput.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const { items } = await searchTmdb(titleSearchInput, 'multi', 1);
        setSearchResults(items.slice(0, 6));
      } catch (err) {
        console.error('TMDB Search error in modal:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [titleSearchInput]);

  const handleSelectSearchResult = (item: MediaItem) => {
    setSelectedResult(item);
    setMediaType(item.type);
    setTmdbIdInput(item.id.toString());
    setSeasonInput('1');
    setEpisodeInput('1');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  // Presets
  const presets = [
    { label: 'Movie: Red One (1078605)', type: 'movie' as MediaType, id: '1078605', season: '1', ep: '1' },
    { label: 'TV: Fallout S1:E8 (119051)', type: 'tv' as MediaType, id: '119051', season: '1', ep: '8' },
    { label: 'Movie: Deadpool & Wolverine (533535)', type: 'movie' as MediaType, id: '533535', season: '1', ep: '1' },
    { label: 'Movie: Dune: Part Two (693134)', type: 'movie' as MediaType, id: '693134', season: '1', ep: '1' },
    { label: 'TV: Stranger Things S4:E1 (66732)', type: 'tv' as MediaType, id: '66732', season: '4', ep: '1' },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    setMediaType(preset.type);
    setTmdbIdInput(preset.id);
    setSeasonInput(preset.season);
    setEpisodeInput(preset.ep);
    setErrorMessage('');
  };

  const buildSyntheticMedia = (id: number): MediaItem => {
    return {
      id,
      type: mediaType,
      title: mediaType === 'movie' ? `TMDB Movie #${id}` : `TMDB TV Series #${id}`,
      overview: `Direct multi-server streaming for TMDB ID ${id}.`,
      backdropPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1280&q=80',
      posterPath: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
      releaseYear: new Date().getFullYear(),
      genres: ['Stream', 'Custom'],
      rating: 8.0,
      cast: [],
    };
  };

  const handleLaunch = () => {
    const validId = sanitizeTmdbId(tmdbIdInput);
    if (!validId) {
      setErrorMessage('Please enter a valid numeric TMDB ID (e.g. 1078605).');
      return;
    }

    setErrorMessage('');
    const syntheticMedia = buildSyntheticMedia(validId);
    setActiveMedia(syntheticMedia);
  };

  const handleOpenDedicatedPage = () => {
    const validId = sanitizeTmdbId(tmdbIdInput);
    if (!validId) {
      setErrorMessage('Please enter a valid numeric TMDB ID.');
      return;
    }
    onClose();
    if (mediaType === 'movie') {
      navigateTo({ page: 'watch-movie', id: validId });
    } else {
      const s = sanitizePositiveInt(seasonInput, 1);
      const ep = sanitizePositiveInt(episodeInput, 1);
      navigateTo({ page: 'watch-tv', id: validId, season: s, episode: ep });
    }
  };

  // Preview the generated URL
  let previewUrl = '';
  const parsedId = sanitizeTmdbId(tmdbIdInput);
  if (parsedId) {
    try {
      if (mediaType === 'movie') {
        previewUrl = getMovieEmbedUrl(parsedId, { color: 'e50914', autoPlay: true });
      } else {
        const s = sanitizePositiveInt(seasonInput, 1);
        const ep = sanitizePositiveInt(episodeInput, 1);
        previewUrl = getTvEmbedUrl(parsedId, s, ep, {
          color: 'e50914',
          autoPlay: true,
          nextEpisode: true,
          episodeSelector: true,
        });
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-white/15 rounded-2xl p-6 shadow-2xl text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Play className="w-4 h-4 fill-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Direct TMDB Stream Launcher</h2>
              <p className="text-xs text-neutral-400">
                Play any movie or TV series in the world by entering its TMDB ID
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeMedia ? (
          /* Active Player View */
          <div className="space-y-4">
            <VidKingPlayer
              media={activeMedia}
              seasonNumber={sanitizePositiveInt(seasonInput, 1)}
              episodeNumber={sanitizePositiveInt(episodeInput, 1)}
              onClose={() => setActiveMedia(null)}
            />
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveMedia(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 rounded-xl"
              >
                &larr; Configure Another ID
              </button>
              <button
                onClick={handleOpenDedicatedPage}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-xs font-semibold text-white rounded-xl"
              >
                <span>Open in Dedicated URL Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Configuration Form */
          <div className="space-y-5">
            {/* Live Search by Title from TMDB */}
            <div className="p-3.5 bg-neutral-900/90 border border-white/10 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-red-500" />
                  Search Title from TMDB Database
                </label>
                <span className="text-[10px] text-emerald-400 font-medium">Auto-fills TMDB ID</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={titleSearchInput}
                  onChange={(e) => setTitleSearchInput(e.target.value)}
                  placeholder="Type any title (e.g. Breaking Bad, Dune, Inception, Fallout)..."
                  className="w-full pl-3.5 pr-9 py-2 bg-neutral-950 border border-neutral-700 focus:border-red-500 rounded-lg text-white text-xs placeholder-neutral-500 focus:outline-none"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-red-500 animate-spin" />
                )}
              </div>

              {selectedResult && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/40 border border-red-500/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={selectedResult.posterPath}
                      alt={selectedResult.title}
                      className="w-6 h-8 rounded object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{selectedResult.title}</p>
                      <p className="text-[10px] text-neutral-400">
                        {selectedResult.type === 'tv' ? 'TV Series' : 'Movie'} ({selectedResult.releaseYear}) • TMDB ID: {selectedResult.id}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold shrink-0">
                    <Check className="w-3 h-3" /> Selected
                  </span>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pt-1">
                  {searchResults.map((item) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                        selectedResult?.id === item.id
                          ? 'bg-red-950/60 border-red-500 text-white'
                          : 'bg-neutral-950/60 border-white/5 hover:border-white/20 text-neutral-300'
                      }`}
                    >
                      <img
                        src={item.posterPath}
                        alt={item.title}
                        className="w-7 h-10 object-cover rounded bg-neutral-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold truncate">{item.title}</p>
                        <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                          <span className="uppercase font-semibold text-red-400">{item.type}</span>
                          <span>•</span>
                          <span>{item.releaseYear}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500">ID: {item.id}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Or pick a popular preset:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/20 text-xs text-neutral-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Type Switcher */}
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Content Type:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMediaType('movie')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    mediaType === 'movie'
                      ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Movie</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('tv')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    mediaType === 'tv'
                      ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                      : 'bg-neutral-900/60 border-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>TV Series</span>
                </button>
              </div>
            </div>

            {/* TMDB ID Input */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                TMDB ID
              </label>
              <input
                type="text"
                value={tmdbIdInput}
                onChange={(e) => setTmdbIdInput(e.target.value)}
                placeholder="e.g. 1078605 or 119051"
                className="w-full px-3.5 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Find IDs on themoviedb.org from the URL (e.g. /movie/1078605)
              </p>
            </div>

            {/* TV Season & Episode fields */}
            {mediaType === 'tv' && (
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-neutral-900/80 border border-white/5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Season Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={seasonInput}
                    onChange={(e) => setSeasonInput(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Episode Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={episodeInput}
                    onChange={(e) => setEpisodeInput(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            )}

            {/* Protected Stream Status (URLs kept private) */}
            {previewUrl && (
              <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">
                      Protected Stream Channel Configured
                    </span>
                    <span className="text-[11px] text-neutral-400">
                      Private encrypted feed ready for TMDB #{parsedId} {mediaType === 'tv' ? `(S${seasonInput} E${episodeInput})` : ''}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-emerald-900/40 text-emerald-300 font-bold border border-emerald-500/30 shrink-0">
                  READY
                </span>
              </div>
            )}

            {/* Error prompt */}
            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-900/50">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleOpenDedicatedPage}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
              >
                <span>Open Dedicated Stream Page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunch}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Launch Stream</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
