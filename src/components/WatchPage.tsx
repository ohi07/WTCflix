import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Play,
  Share2,
  Tv,
  Film,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Loader2,
  Maximize2,
  Layout,
  Sun,
  Moon,
  Volume2,
  Sliders,
  Eye,
  EyeOff,
  Flame,
  Monitor,
  Lightbulb,
} from 'lucide-react';
import { MediaItem, Episode } from '../types';
import { VidKingPlayer } from './VidKingPlayer';
import { TrailerModal } from './TrailerModal';
import { navigateTo } from '../utils/router';
import { isIdInWatchlist, toggleWatchlistId } from '../utils/storage';
import { getTvSeasonEpisodes, getMediaDetails } from '../services/tmdb';

interface WatchPageProps {
  media: MediaItem;
  initialSeason?: number;
  initialEpisode?: number;
  initialServerId?: string;
  allMedia: MediaItem[];
}

export const WatchPage: React.FC<WatchPageProps> = ({
  media,
  initialSeason = 1,
  initialEpisode = 1,
  initialServerId = 'vidking',
  allMedia,
}) => {
  const [activeMedia, setActiveMedia] = useState<MediaItem>(media);
  const [currentSeason, setCurrentSeason] = useState<number>(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState<number>(initialEpisode);
  const [activeServerId, setActiveServerId] = useState<string>(initialServerId);
  const [isWatchlist, setIsWatchlist] = useState<boolean>(false);
  const [showTrailer, setShowTrailer] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [seasonEpisodesMap, setSeasonEpisodesMap] = useState<Record<number, Episode[]>>({});
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState<boolean>(false);

  // Desktop Viewport Layout Mode:
  // 'cockpit' = Side-by-side zero-waste layout (Player on left + Live Companion Dock on right)
  // 'imax' = Edge-to-Edge full desktop width theater
  // 'ambient' = Atmospheric theatrical wings with deep ambient glow
  const [desktopViewMode, setDesktopViewMode] = useState<'cockpit' | 'imax' | 'ambient'>('cockpit');

  // Ambilight Side Wings intensity
  const [ambientGlow, setAmbientGlow] = useState<'vivid' | 'soft' | 'off'>('vivid');

  // Cinema Lights Dimmer
  const [cinemaLightsOff, setCinemaLightsOff] = useState<boolean>(false);

  // Sync activeMedia when media prop changes
  useEffect(() => {
    setActiveMedia(media);
  }, [media]);

  // Load real TMDB TV seasons if incomplete
  useEffect(() => {
    if (activeMedia.type !== 'tv') return;

    if (!activeMedia.seasons || activeMedia.seasons.length <= 1) {
      getMediaDetails(activeMedia.id, 'tv')
        .then((full) => {
          if (full) setActiveMedia(full);
        })
        .catch(console.warn);
    }
  }, [activeMedia.id, activeMedia.type]);

  // Load real TMDB TV episodes for current season
  useEffect(() => {
    if (activeMedia.type !== 'tv') return;
    if (seasonEpisodesMap[currentSeason] && seasonEpisodesMap[currentSeason].length > 0) return;

    setIsLoadingEpisodes(true);
    getTvSeasonEpisodes(activeMedia.id, currentSeason)
      .then((eps) => {
        if (eps && eps.length > 0) {
          setSeasonEpisodesMap((prev) => ({ ...prev, [currentSeason]: eps }));
        }
      })
      .catch(console.warn)
      .finally(() => setIsLoadingEpisodes(false));
  }, [activeMedia.id, activeMedia.type, currentSeason]);

  // Sync watchlist status
  useEffect(() => {
    setIsWatchlist(isIdInWatchlist(media.id));
    const handleStorageUpdate = () => setIsWatchlist(isIdInWatchlist(media.id));
    window.addEventListener('wtcflix_watchlist_updated', handleStorageUpdate);
    return () => window.removeEventListener('wtcflix_watchlist_updated', handleStorageUpdate);
  }, [media.id]);

  // Update document title for dynamic page
  useEffect(() => {
    if (media.type === 'tv') {
      document.title = `${media.title} (S${currentSeason}:E${currentEpisode}) - WTCflix`;
    } else {
      document.title = `${media.title} (${media.releaseYear}) - WTCflix`;
    }
    return () => {
      document.title = 'WTCflix - Stream Movies & TV Shows';
    };
  }, [media, currentSeason, currentEpisode]);

  // Handle episode change and update dynamic browser URL
  const handleEpisodeSelect = (seasonNum: number, episodeNum: number) => {
    setCurrentSeason(seasonNum);
    setCurrentEpisode(episodeNum);
    navigateTo({
      page: 'watch-tv',
      id: activeMedia.id,
      season: seasonNum,
      episode: episodeNum,
      serverId: activeServerId,
    });
  };

  const handleToggleWatchlist = () => {
    toggleWatchlistId(activeMedia.id);
    setIsWatchlist(!isWatchlist);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const selectedSeasonObj = activeMedia.seasons?.find((s) => s.seasonNumber === currentSeason);
  const currentEpisodesList: Episode[] =
    seasonEpisodesMap[currentSeason] && seasonEpisodesMap[currentSeason].length > 0
      ? seasonEpisodesMap[currentSeason]
      : selectedSeasonObj?.episodes || [];

  // Related items
  const relatedItems = allMedia
    .filter((m) => m.id !== activeMedia.id && (m.type === activeMedia.type || m.genres.some((g) => activeMedia.genres.includes(g))))
    .slice(0, 6);

  // Cycle Ambilight glow intensity
  const cycleAmbientGlow = () => {
    if (ambientGlow === 'vivid') setAmbientGlow('soft');
    else if (ambientGlow === 'soft') setAmbientGlow('off');
    else setAmbientGlow('vivid');
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-neutral-100 pt-16 sm:pt-20 pb-16 overflow-x-hidden">
      {/* 1. Dynamic Theatrical Ambilight Wings (Left & Right Margins) */}
      <div
        className={`hidden lg:block fixed left-0 top-1/3 -translate-y-1/2 w-96 h-[750px] pointer-events-none rounded-full transition-all duration-700 z-0 ${
          ambientGlow === 'vivid'
            ? 'opacity-40 scale-100'
            : ambientGlow === 'soft'
            ? 'opacity-20 scale-90'
            : 'opacity-0 scale-75'
        }`}
        style={{
          background: `radial-gradient(ellipse at left, rgba(239, 68, 68, 0.4), rgba(185, 28, 28, 0.15), transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />
      <div
        className={`hidden lg:block fixed right-0 top-1/3 -translate-y-1/2 w-96 h-[750px] pointer-events-none rounded-full transition-all duration-700 z-0 ${
          ambientGlow === 'vivid'
            ? 'opacity-40 scale-100'
            : ambientGlow === 'soft'
            ? 'opacity-20 scale-90'
            : 'opacity-0 scale-75'
        }`}
        style={{
          background: `radial-gradient(ellipse at right, rgba(168, 85, 247, 0.35), rgba(239, 68, 68, 0.2), transparent 70%)`,
          filter: 'blur(100px)',
        }}
      />

      {/* Background Ambience Backdrop */}
      <div className="fixed inset-0 pointer-events-none opacity-25 z-0">
        <img
          src={activeMedia.backdropPath}
          alt={activeMedia.title}
          className="w-full h-full object-cover blur-3xl scale-110"
        />
        <div className="absolute inset-0 bg-[#070709]/85" />
      </div>

      {/* Floating Lights-On Restorer button when lights are dimmed */}
      {cinemaLightsOff && (
        <button
          onClick={() => setCinemaLightsOff(false)}
          className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-amber-400 border border-amber-400/30 shadow-2xl backdrop-blur-md text-xs font-bold animate-pulse cursor-pointer transition-all"
        >
          <Lightbulb className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Restore Lights</span>
        </button>
      )}

      {/* Main Content Container: Expands fluidly up to 1780px */}
      <div
        className={`relative z-10 mx-auto px-3 sm:px-6 lg:px-10 transition-all duration-300 ${
          desktopViewMode === 'imax' || desktopViewMode === 'cockpit'
            ? 'max-w-[1780px]'
            : 'max-w-6xl'
        }`}
      >
        {/* Navigation & Desktop Cinema Control Bar */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 py-3 border-b border-white/10 mb-4 transition-opacity duration-300 ${
            cinemaLightsOff ? 'opacity-30 hover:opacity-100' : 'opacity-100'
          }`}
        >
          {/* Left: Breadcrumbs & Back */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white border border-white/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Browse</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className="hidden sm:inline">Playing:</span>
              <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                {activeMedia.title}
              </span>
              {activeMedia.type === 'tv' && (
                <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-mono font-bold">
                  S{currentSeason}:E{currentEpisode}
                </span>
              )}
            </div>
          </div>

          {/* Right: Desktop Theater Mode Controls (Solves the desktop black bar issue creatively) */}
          <div className="hidden md:flex items-center gap-2 bg-neutral-900/90 p-1 rounded-xl border border-white/10 text-xs shadow-lg">
            <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 tracking-wider">
              Desktop Mode:
            </span>

            {/* Studio Cockpit Mode (Zero-waste side-by-side dock) */}
            <button
              onClick={() => setDesktopViewMode('cockpit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                desktopViewMode === 'cockpit'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Studio Cockpit: Side-by-side player & live episode dock"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Studio Dock</span>
            </button>

            {/* IMAX Mode (Edge-to-Edge ultra-wide) */}
            <button
              onClick={() => setDesktopViewMode('imax')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                desktopViewMode === 'imax'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="IMAX Mode: Ultra-wide edge-to-edge cinema"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>IMAX Wide</span>
            </button>

            {/* Ambient Aura Mode */}
            <button
              onClick={() => setDesktopViewMode('ambient')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                desktopViewMode === 'ambient'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Ambient Mode: Radiant theatrical glow aura"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ambilight Aura</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-1" />

            {/* Ambilight Intensity Toggle */}
            <button
              onClick={cycleAmbientGlow}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-neutral-300 hover:text-white hover:bg-white/5 transition-all"
              title={`Side Ambilight: ${ambientGlow.toUpperCase()}`}
            >
              <Sun
                className={`w-3.5 h-3.5 ${
                  ambientGlow === 'vivid'
                    ? 'text-amber-400 fill-amber-400'
                    : ambientGlow === 'soft'
                    ? 'text-neutral-400'
                    : 'text-neutral-600'
                }`}
              />
              <span className="capitalize text-[11px]">{ambientGlow} Glow</span>
            </button>

            {/* Cinema Lights Dimmer Toggle */}
            <button
              onClick={() => setCinemaLightsOff(!cinemaLightsOff)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${
                cinemaLightsOff
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title="Dim theater room lights"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{cinemaLightsOff ? 'Lights Dimmed' : 'Dim Lights'}</span>
            </button>
          </div>
        </div>

        {/* 2. Top Theater Area */}
        {desktopViewMode === 'cockpit' ? (
          /* Studio Cockpit Layout: Player on Left (72%), Interactive Companion Dock on Right (28%) */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 items-start">
            {/* Left Col: Main Player */}
            <div className="xl:col-span-8 2xl:col-span-9">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10">
                <VidKingPlayer
                  media={activeMedia}
                  seasonNumber={currentSeason}
                  episodeNumber={currentEpisode}
                  onEpisodeChange={handleEpisodeSelect}
                  activeServerId={activeServerId}
                  onServerChange={(srv) => setActiveServerId(srv)}
                />
              </div>
            </div>

            {/* Right Col: Live Desktop Companion Dock (Eliminates desktop black space!) */}
            <div className="xl:col-span-4 2xl:col-span-3 space-y-4">
              {activeMedia.type === 'tv' && activeMedia.seasons && activeMedia.seasons.length > 0 ? (
                /* Live TV Companion Dock */
                <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-bold text-white tracking-wide">Live Episode Dock</h3>
                      {isLoadingEpisodes && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />}
                    </div>

                    {/* Season Selector */}
                    {activeMedia.seasons.length > 1 && (
                      <div className="relative">
                        <select
                          value={currentSeason}
                          onChange={(e) => handleEpisodeSelect(parseInt(e.target.value, 10), 1)}
                          className="appearance-none bg-neutral-950 border border-neutral-700 text-white text-xs rounded-lg px-2.5 py-1 pr-7 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          {activeMedia.seasons.map((s) => (
                            <option key={s.seasonNumber} value={s.seasonNumber}>
                              S{s.seasonNumber}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Scrollable list of episodes */}
                  <div className="space-y-2 max-h-[460px] xl:max-h-[520px] 2xl:max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
                    {currentEpisodesList.map((ep) => {
                      const isCurrent = ep.episodeNumber === currentEpisode;

                      return (
                        <button
                          key={ep.episodeNumber}
                          onClick={() => handleEpisodeSelect(currentSeason, ep.episodeNumber)}
                          className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                            isCurrent
                              ? 'bg-red-600/20 border-red-500/60 shadow-md shadow-red-950/40'
                              : 'bg-neutral-950/50 border-white/5 hover:border-white/20 hover:bg-neutral-800/80'
                          }`}
                        >
                          <div className="relative w-16 h-11 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                            {ep.stillPath ? (
                              <img
                                src={ep.stillPath}
                                alt={ep.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
                                E{ep.episodeNumber}
                              </div>
                            )}
                            {isCurrent && (
                              <div className="absolute inset-0 bg-red-600/50 flex items-center justify-center">
                                <Play className="w-4 h-4 fill-white text-white" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span
                                className={`text-xs font-bold truncate ${
                                  isCurrent ? 'text-red-400' : 'text-white'
                                }`}
                              >
                                {ep.episodeNumber}. {ep.title}
                              </span>
                              {ep.runtimeMinutes && (
                                <span className="text-[10px] text-neutral-400 shrink-0">
                                  {ep.runtimeMinutes}m
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-2 leading-snug">
                              {ep.overview}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Movie Companion Dock: Recommended Titles & Quick Stream Health */
                <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-bold text-white">Up Next & More</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                      {activeMedia.releaseYear}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[460px] xl:max-h-[520px] 2xl:max-h-[620px] overflow-y-auto pr-1 no-scrollbar">
                    {relatedItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          navigateTo(
                            item.type === 'movie'
                              ? { page: 'watch-movie', id: item.id }
                              : { page: 'watch-tv', id: item.id, season: 1, episode: 1 }
                          )
                        }
                        className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/80 border border-white/5 hover:border-red-500/40 transition-all cursor-pointer group"
                      >
                        <img
                          src={item.posterPath}
                          alt={item.title}
                          className="w-12 aspect-[2/3] object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              {item.rating.toFixed(1)}
                            </span>
                            <span>•</span>
                            <span>{item.type === 'movie' ? 'Movie' : 'Series'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* IMAX or Ambient Mode: Single full-width player */
          <div className="mb-8">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10">
              <VidKingPlayer
                media={activeMedia}
                seasonNumber={currentSeason}
                episodeNumber={currentEpisode}
                onEpisodeChange={handleEpisodeSelect}
                activeServerId={activeServerId}
                onServerChange={(srv) => setActiveServerId(srv)}
              />
            </div>
          </div>
        )}

        {/* 3. Media Details & Secondary Section */}
        <div
          className={`transition-opacity duration-300 ${
            cinemaLightsOff ? 'opacity-20 hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Synopsis, Cast, Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {activeMedia.type === 'movie' ? 'Movie' : 'TV Series'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {activeMedia.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {activeMedia.releaseYear}
                  </span>
                  {activeMedia.runtime && (
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activeMedia.runtime}m
                    </span>
                  )}
                  {activeMedia.totalSeasons && (
                    <span className="text-xs text-neutral-400">
                      {activeMedia.totalSeasons} {activeMedia.totalSeasons === 1 ? 'Season' : 'Seasons'}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-wide">
                  {activeMedia.title}
                </h1>
                {activeMedia.tagline && (
                  <p className="text-sm text-red-400/90 font-medium italic mt-1">
                    "{activeMedia.tagline}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleToggleWatchlist}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isWatchlist
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  {isWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  <span>{isWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                </button>

                {activeMedia.trailerYoutubeKey && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Watch Trailer</span>
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
              </div>

              {/* Overview */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
                  Storyline
                </h3>
                <p className="text-neutral-300 text-sm leading-relaxed">{activeMedia.overview}</p>
              </div>

              {/* Genre Chips */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 text-[11px]">
                  Genres
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeMedia.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-white/5 text-xs text-neutral-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cast Members */}
              {activeMedia.cast && activeMedia.cast.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 text-[11px]">
                    Featured Cast
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {activeMedia.cast.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/60 border border-white/5"
                      >
                        {member.profilePath ? (
                          <img
                            src={member.profilePath}
                            alt={member.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{member.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Secondary TV Season & Episode List (only if NOT in cockpit mode) */}
            <div className="space-y-6">
              {desktopViewMode !== 'cockpit' && activeMedia.type === 'tv' && activeMedia.seasons && activeMedia.seasons.length > 0 ? (
                <div className="bg-neutral-950/80 border border-white/10 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <Tv className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-bold text-white">All Episodes</h3>
                      {isLoadingEpisodes && <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />}
                    </div>

                    {activeMedia.seasons.length > 1 && (
                      <div className="relative">
                        <select
                          value={currentSeason}
                          onChange={(e) => handleEpisodeSelect(parseInt(e.target.value, 10), 1)}
                          className="appearance-none bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-red-500 cursor-pointer"
                        >
                          {activeMedia.seasons.map((s) => (
                            <option key={s.seasonNumber} value={s.seasonNumber}>
                              Season {s.seasonNumber}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {currentEpisodesList.map((ep) => {
                      const isCurrent = ep.episodeNumber === currentEpisode;

                      return (
                        <button
                          key={ep.episodeNumber}
                          onClick={() => handleEpisodeSelect(currentSeason, ep.episodeNumber)}
                          className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                            isCurrent
                              ? 'bg-red-600/15 border-red-500/50 shadow'
                              : 'bg-neutral-900/60 border-white/5 hover:border-white/20 hover:bg-neutral-900'
                          }`}
                        >
                          <div className="relative w-16 h-11 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                            {ep.stillPath ? (
                              <img
                                src={ep.stillPath}
                                alt={ep.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
                                E{ep.episodeNumber}
                              </div>
                            )}
                            {isCurrent && (
                              <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                                <Play className="w-4 h-4 fill-white text-white" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-xs font-bold text-white truncate">
                                {ep.episodeNumber}. {ep.title}
                              </span>
                              {ep.runtimeMinutes && (
                                <span className="text-[10px] text-neutral-400 shrink-0">
                                  {ep.runtimeMinutes}m
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-tight">
                              {ep.overview}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Poster Card & Metadata */
                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-neutral-900/60 p-4">
                  <img
                    src={activeMedia.posterPath}
                    alt={activeMedia.title}
                    className="w-full aspect-[2/3] object-cover rounded-xl shadow-lg mb-4"
                  />
                  <div className="space-y-2 text-xs text-neutral-400">
                    {activeMedia.director && (
                      <div className="flex justify-between">
                        <span>Director:</span>
                        <span className="text-white font-medium">{activeMedia.director}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>TMDB ID:</span>
                      <span className="font-mono text-red-400">{activeMedia.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Release:</span>
                      <span className="text-neutral-200">{activeMedia.releaseDate || activeMedia.releaseYear}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Titles */}
          {relatedItems.length > 0 && (
            <div className="mt-14 pt-8 border-t border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span>More Like This</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {relatedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      navigateTo(
                        item.type === 'movie'
                          ? { page: 'watch-movie', id: item.id }
                          : { page: 'watch-tv', id: item.id, season: 1, episode: 1 }
                      )
                    }
                    className="group cursor-pointer space-y-2"
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/10 group-hover:border-red-500 transition-all">
                      <img
                        src={item.posterPath}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold text-white truncate group-hover:text-red-400">
                      {item.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && media.trailerYoutubeKey && (
        <TrailerModal
          youtubeKey={media.trailerYoutubeKey}
          title={media.title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
};
