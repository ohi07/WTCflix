import React, { useEffect, useState, useRef } from 'react';
import {
  Play,
  RotateCcw,
  ExternalLink,
  X,
  Settings2,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Tv,
  ShieldCheck,
} from 'lucide-react';
import { MediaItem, VidKingPlayerEventData, WatchProgress, StreamingServer } from '../types';
import { formatSeconds } from '../utils/vidking';
import { saveWatchProgress, getWatchProgress, buildProgressKey } from '../utils/storage';
import { getServerById, getAllAvailableServers } from '../utils/servers';
import { ServerSelector } from './ServerSelector';

interface VidKingPlayerProps {
  media: MediaItem;
  seasonNumber?: number;
  episodeNumber?: number;
  onEpisodeChange?: (season: number, episode: number) => void;
  onClose?: () => void;
  initialProgress?: number; // In seconds
  autoPlay?: boolean;
  themeColor?: string; // Hex without #
  activeServerId?: string;
  onServerChange?: (serverId: string) => void;
}

export const VidKingPlayer: React.FC<VidKingPlayerProps> = ({
  media,
  seasonNumber = 1,
  episodeNumber = 1,
  onEpisodeChange,
  onClose,
  initialProgress,
  autoPlay = true,
  themeColor = 'e50914',
  activeServerId = 'vidking',
  onServerChange,
}) => {
  const [currentServerId, setCurrentServerId] = useState<string>(activeServerId);
  const [playerColor, setPlayerColor] = useState<string>(themeColor);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(autoPlay);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<string>('ready');
  const [currentTime, setCurrentTime] = useState<number>(initialProgress || 0);
  const [duration, setDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [showResumePrompt, setShowResumePrompt] = useState<boolean>(false);
  const [savedResumeSeconds, setSavedResumeSeconds] = useState<number>(0);
  const [activeProgressSeconds, setActiveProgressSeconds] = useState<number | undefined>(initialProgress);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync server prop if changed externally
  useEffect(() => {
    if (activeServerId && activeServerId !== currentServerId) {
      setCurrentServerId(activeServerId);
      setIframeLoaded(false);
      setIframeKey(Date.now());
    }
  }, [activeServerId]);

  const activeServer: StreamingServer = getServerById(currentServerId);

  // Check if there is previously stored progress for this item
  useEffect(() => {
    const existing = getWatchProgress(
      media.type,
      media.id,
      media.type === 'tv' ? seasonNumber : undefined,
      media.type === 'tv' ? episodeNumber : undefined
    );

    if (existing && existing.currentTime > 30 && (!initialProgress || initialProgress === 0)) {
      setSavedResumeSeconds(Math.floor(existing.currentTime));
      setShowResumePrompt(true);
    } else if (initialProgress && initialProgress > 0) {
      setActiveProgressSeconds(initialProgress);
      setShowResumePrompt(false);
    }
  }, [media.id, media.type, seasonNumber, episodeNumber, initialProgress]);

  // Generate URL for active server
  let embedUrl = '';
  try {
    if (media.type === 'tv') {
      embedUrl = activeServer.getTvUrl(
        media.id,
        seasonNumber,
        episodeNumber,
        {
          color: playerColor,
          autoPlay: isAutoplay,
          nextEpisode: true,
          episodeSelector: true,
          progress: activeProgressSeconds,
        },
        media.title,
        media.releaseYear
      );
    } else {
      embedUrl = activeServer.getMovieUrl(
        media.id,
        {
          color: playerColor,
          autoPlay: isAutoplay,
          progress: activeProgressSeconds,
        },
        media.title,
        media.releaseYear
      );
    }
  } catch (err) {
    console.error('Error generating embed URL:', err);
  }

  // Handle postMessage events sent by embed players
  useEffect(() => {
    const handlePlayerMessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data);

          if (message && message.type === 'PLAYER_EVENT' && message.data) {
            const data: VidKingPlayerEventData = message.data;
            const eventName = data.event || 'update';
            setLastEvent(eventName);

            if (typeof data.currentTime === 'number') {
              setCurrentTime(data.currentTime);
            }
            if (typeof data.duration === 'number' && data.duration > 0) {
              setDuration(data.duration);
            }
            if (typeof data.progress === 'number') {
              setProgressPercent(data.progress);
            }

            let episodeTitle: string | undefined;
            if (media.type === 'tv' && media.seasons) {
              const currentSeason = media.seasons.find((s) => s.seasonNumber === seasonNumber);
              const currentEp = currentSeason?.episodes.find((e) => e.episodeNumber === episodeNumber);
              episodeTitle = currentEp?.title;
            }

            const curTime = data.currentTime || currentTime;
            const dur = data.duration || duration;
            const pct = data.progress !== undefined ? data.progress : dur > 0 ? (curTime / dur) * 100 : 0;

            if (curTime > 5) {
              const progressRecord: WatchProgress = {
                key: buildProgressKey(
                  media.type,
                  media.id,
                  media.type === 'tv' ? seasonNumber : undefined,
                  media.type === 'tv' ? episodeNumber : undefined
                ),
                tmdbId: media.id,
                mediaType: media.type,
                title: media.title,
                posterPath: media.posterPath,
                backdropPath: media.backdropPath,
                season: media.type === 'tv' ? seasonNumber : undefined,
                episode: media.type === 'tv' ? episodeNumber : undefined,
                episodeTitle,
                currentTime: curTime,
                duration: dur,
                progress: Math.min(100, Math.max(0, Math.round(pct * 10) / 10)),
                lastWatched: Date.now(),
              };

              saveWatchProgress(progressRecord);
            }
          }
        } catch {
          // Ignore non-JSON postMessage payloads
        }
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => {
      window.removeEventListener('message', handlePlayerMessage);
    };
  }, [media, seasonNumber, episodeNumber, currentTime, duration]);

  const handleServerSwitch = (newServerId: string) => {
    setCurrentServerId(newServerId);
    setIframeLoaded(false);
    setIframeKey(Date.now());
    if (onServerChange) {
      onServerChange(newServerId);
    }
  };

  const handleApplyResume = (resumeSeconds: number) => {
    setActiveProgressSeconds(resumeSeconds);
    setShowResumePrompt(false);
    setIframeKey(Date.now());
  };

  const handleStartFromBeginning = () => {
    setActiveProgressSeconds(0);
    setShowResumePrompt(false);
    setIframeKey(Date.now());
  };

  // Find next episode if TV
  const currentSeason = media.seasons?.find((s) => s.seasonNumber === seasonNumber);
  const hasNextEpisode =
    media.type === 'tv' &&
    currentSeason &&
    currentSeason.episodes.some((e) => e.episodeNumber === episodeNumber + 1);

  const handleNextEpisodeClick = () => {
    if (hasNextEpisode && onEpisodeChange) {
      onEpisodeChange(seasonNumber, episodeNumber + 1);
      setActiveProgressSeconds(0);
      setIframeKey(Date.now());
    }
  };

  // Stremio deep links
  const stremioAppHref = activeServer.stremioAppUrl
    ? activeServer.stremioAppUrl(media.type, media.id, seasonNumber, episodeNumber, media.title)
    : `stremio://detail/${media.type === 'tv' ? 'series' : 'movie'}/${media.id}`;

  const stremioWebHref = activeServer.stremioWebUrl
    ? activeServer.stremioWebUrl(media.type, media.id, seasonNumber, episodeNumber, media.title)
    : `https://web.stremio.com/#/search?search=${encodeURIComponent(media.title)}`;

  // FS Plus BDIX direct link
  const fsPlusSearchUrl = `https://fs.plus.net.bd/?search=${encodeURIComponent(
    media.title + (media.releaseYear ? ` ${media.releaseYear}` : '')
  )}`;

  return (
    <div className="w-full flex flex-col bg-[#09090b] rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-all">
      {/* Top Player Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900/90 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold tracking-wider uppercase">
            <Server className="w-3 h-3 text-red-500" />
            <span>{activeServer.name}</span>
          </span>
          <h3 className="text-sm sm:text-base font-semibold text-white truncate">
            {media.title}
          </h3>
          {media.type === 'tv' && (
            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-medium whitespace-nowrap">
              S{seasonNumber} : E{episodeNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Settings button */}
          <button
            id="player-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors ${
              showSettings ? 'bg-white/10 text-white' : ''
            }`}
            title="Player Settings & Color"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Open in external tab - fixes sandbox issues directly */}
          <a
            id="player-external-link"
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Open in Isolated Window (Fixes Sandbox Issues)"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close button */}
          {onClose && (
            <button
              id="player-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Server Selector Bar */}
      <ServerSelector
        currentServerId={currentServerId}
        onSelectServer={handleServerSwitch}
        mediaTitle={media.title}
        isTv={media.type === 'tv'}
      />

      {/* Settings Panel Toggle */}
      {showSettings && (
        <div className="bg-neutral-950/95 border-b border-white/10 px-4 py-3 text-xs text-neutral-300 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="player-autoplay-checkbox"
                type="checkbox"
                checked={isAutoplay}
                onChange={(e) => {
                  setIsAutoplay(e.target.checked);
                  setIframeKey(Date.now());
                }}
                className="w-3.5 h-3.5 accent-red-600 rounded bg-neutral-800 border-neutral-700"
              />
              <span>Autoplay on load</span>
            </label>

            <div className="flex items-center gap-1.5">
              <span>Accent Color:</span>
              {['e50914', '3b82f6', '10b981', 'f59e0b', '8b5cf6'].map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    setPlayerColor(hex);
                    setIframeKey(Date.now());
                  }}
                  style={{ backgroundColor: `#${hex}` }}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    playerColor === hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={`Color #${hex}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Protected CDN Stream Channel Active</span>
          </div>
        </div>
      )}

      {/* Resume Prompt Banner */}
      {showResumePrompt && (
        <div className="bg-gradient-to-r from-red-950/80 via-neutral-900 to-neutral-900 border-b border-red-500/30 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-200">
            <RotateCcw className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              You previously stopped at <strong className="text-white">{formatSeconds(savedResumeSeconds)}</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="resume-playback-btn"
              onClick={() => handleApplyResume(savedResumeSeconds)}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded shadow transition-colors"
            >
              Resume at {formatSeconds(savedResumeSeconds)}
            </button>
            <button
              id="restart-playback-btn"
              onClick={handleStartFromBeginning}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-neutral-300 text-xs rounded transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Server Specific Views: Stremio, FS Plus BDIX, or Standard Embed */}
      {currentServerId === 'stremio' ? (
        /* Stremio Hub Screen */
        <div className="relative w-full aspect-video bg-gradient-to-br from-[#120f26] via-[#09090b] to-[#1a0f1d] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-600/40 mb-4 animate-bounce">
            <Play className="w-8 h-8 fill-white text-white ml-0.5" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Watch "{media.title}" on Stremio
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-md mb-6 leading-relaxed">
            Stremio connects to high-speed community addons like <strong>Torrentio</strong>, <strong>CyberFlix</strong>, and <strong>Cinemeta</strong> with zero ads and bufferless 4K/1080p playback.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={stremioAppHref}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/40 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch in Stremio App</span>
            </a>

            <a
              href={stremioWebHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs sm:text-sm font-semibold border border-white/10 transition-colors"
            >
              <span>Open in Stremio Web</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => handleServerSwitch('vidking')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs transition-colors"
            >
              Switch back to Browser Embed
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 mt-5 max-w-xs">
            Requires Stremio installed on Windows, macOS, Linux, Android, iOS, or Android TV.
          </p>
        </div>
      ) : currentServerId === 'fsplus' ? (
        /* FS Plus BDIX Portal View */
        <div className="relative w-full aspect-video bg-gradient-to-br from-[#0a192f] via-[#09090b] to-[#0d1f38] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-600/30 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
            <span>BDIX Ultra Fast / Free Server</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Stream on FS Plus (BDIX)
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-md mb-6 leading-relaxed">
            FS Plus (<code>fs.plus.net.bd</code>) offers zero-buffering high-bandwidth streaming across BDIX network partners in South Asia.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={fsPlusSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-cyan-600/40 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Launch FS Plus Streaming Portal</span>
            </a>

            <button
              onClick={() => handleServerSwitch('vidking')}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors border border-white/10"
            >
              Use VidKing Browser Stream
            </button>
          </div>

          <p className="text-[11px] text-neutral-400 mt-4">
            Direct query: <code className="text-cyan-400">{media.title}</code>
          </p>
        </div>
      ) : (
        /* Standard Embed Player with Permissive Sandbox/Permissions */
        <div ref={containerRef} className="relative w-full aspect-video bg-black player-container">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 text-neutral-400 gap-3">
              <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs tracking-wider uppercase font-medium text-neutral-300">
                Connecting to {activeServer.name}...
              </span>
            </div>
          )}

          {/* Sandbox issue fix: comprehensive permissions & origin referrerPolicy */}
          <iframe
            key={iframeKey}
            id="wtcflix-player-iframe"
            src={embedUrl}
            title={`${media.title} Stream Player`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="origin"
            allowFullScreen
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Live Playback State & Controls Bar */}
      <div className="bg-neutral-950 px-4 py-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-neutral-300">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                lastEvent === 'play'
                  ? 'bg-emerald-500 animate-pulse'
                  : lastEvent === 'pause'
                  ? 'bg-amber-500'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="capitalize font-medium text-neutral-400">
              {lastEvent === 'ready' ? 'Server Connected' : `State: ${lastEvent}`}
            </span>
          </div>

          {(currentTime > 0 || duration > 0) && (
            <div className="flex items-center gap-1 text-neutral-300 font-mono">
              <span>{formatSeconds(currentTime)}</span>
              <span className="text-neutral-600">/</span>
              <span>{duration > 0 ? formatSeconds(duration) : '--:--'}</span>
              {progressPercent > 0 && (
                <span className="text-red-400 ml-1">({Math.round(progressPercent)}%)</span>
              )}
            </div>
          )}

          {currentTime > 30 && (
            <span className="inline-flex items-center gap-1 text-emerald-400/80 text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> Progress Saved to Account
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* External window shortcut if iframe has sandbox issues */}
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
            title="If stream is black or blocked by sandbox, click to view in separate window"
          >
            <span>Popout Player</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Next episode fast button if TV */}
          {media.type === 'tv' && hasNextEpisode && (
            <button
              id="player-next-episode-btn"
              onClick={handleNextEpisodeClick}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-600/90 hover:bg-red-600 text-white rounded text-xs font-medium transition-all"
            >
              <span>Next: S{seasonNumber} E{episodeNumber + 1}</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
