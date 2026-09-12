import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  X,
  Bookmark,
  Tv,
  Clapperboard,
  Compass,
  PlayCircle,
  Menu,
  User,
  UserCheck,
  Sparkles,
  Star,
  Play,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { UserProfile, MediaItem } from '../types';
import { getCurrentUser, getAvatarUrl } from '../utils/auth';
import { searchTmdb } from '../services/tmdb';
import { navigateTo } from '../utils/router';

interface NavbarProps {
  currentTab: 'home' | 'movies' | 'tv' | 'anime' | 'watchlist' | 'account' | 'movie' | 'direct';
  onSelectTab: (tab: any) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenDirectStream: () => void;
  onOpenAuth: () => void;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onOpenDirectStream,
  onOpenAuth,
  watchlistCount,
}) => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [suggestions, setSuggestions] = useState<MediaItem[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Live auto-suggestions from TMDB
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingSuggestions(true);
        const { items } = await searchTmdb(searchQuery, 'multi', 1);
        setSuggestions(items.slice(0, 5));
        setShowSuggestions(true);
      } catch (err) {
        console.error('TMDB live suggestions error:', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const syncUser = () => setUser(getCurrentUser());
    window.addEventListener('wtcflix_auth_changed', syncUser);
    return () => window.removeEventListener('wtcflix_auth_changed', syncUser);
  }, []);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        onSearchChange('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-neutral-950/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40 py-2.5'
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent py-3.5'
      }`}
    >
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-8">
          <button
            id="nav-logo"
            onClick={() => {
              onSelectTab('home');
              onSearchChange('');
            }}
            className="flex items-center gap-2.5 group cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/40 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-white font-display uppercase leading-none">
                WTC<span className="text-red-500">FLIX</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold leading-none mt-0.5">
                Streaming Hub
              </span>
            </div>
          </button>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <button
              id="nav-home-btn"
              onClick={() => {
                onSelectTab('home');
                onSearchChange('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === 'home' && !searchQuery
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>

            <button
              id="nav-movies-btn"
              onClick={() => {
                onSelectTab('movies');
                onSearchChange('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === 'movies'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clapperboard className="w-4 h-4" />
              <span>Movies</span>
            </button>

            <button
              id="nav-tv-btn"
              onClick={() => {
                onSelectTab('tv');
                onSearchChange('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === 'tv'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>TV Series</span>
            </button>

            <button
              id="nav-anime-btn"
              onClick={() => {
                onSelectTab('anime');
                onSearchChange('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === 'anime'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Anime</span>
            </button>

            <button
              id="nav-watchlist-btn"
              onClick={() => {
                onSelectTab('watchlist');
                onSearchChange('');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                currentTab === 'watchlist'
                  ? 'text-white bg-white/10 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>My List</span>
              {watchlistCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {watchlistCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Search, Direct TMDB, User Profile/Auth & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Search Box with Live TMDB Dropdown */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="nav-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setShowSuggestions(false);
                  searchInputRef.current?.blur();
                }
              }}
              placeholder="Search movies, TV shows..."
              className="w-36 sm:w-56 md:w-72 pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-neutral-900/90 border border-neutral-700 focus:border-red-500 rounded-full text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all shadow-inner"
            />
            {isSearchingSuggestions ? (
              <Loader2 className="absolute right-2.5 w-3.5 h-3.5 text-red-500 animate-spin" />
            ) : searchQuery ? (
              <button
                id="nav-clear-search-btn"
                onClick={() => {
                  onSearchChange('');
                  setShowSuggestions(false);
                }}
                className="absolute right-2.5 p-0.5 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] text-neutral-400 bg-neutral-800 border border-neutral-700 rounded font-mono">
                /
              </kbd>
            )}

            {/* Floating Live Suggestions Dropdown */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 sm:w-80 mt-2 bg-neutral-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-red-500" />
                    TMDB Live Matches
                  </span>
                  <span className="text-[10px] text-neutral-500">Live API</span>
                </div>

                {isSearchingSuggestions && suggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    Searching TMDB catalog...
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
                    {suggestions.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => {
                          setShowSuggestions(false);
                          if (item.type === 'tv') {
                            navigateTo({ page: 'watch-tv', id: item.id, season: 1, episode: 1 });
                          } else {
                            navigateTo({ page: 'watch-movie', id: item.id });
                          }
                        }}
                        className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-white/10 text-left transition-colors group cursor-pointer"
                      >
                        <img
                          src={item.posterPath}
                          alt={item.title}
                          className="w-8 h-12 rounded object-cover shrink-0 shadow bg-neutral-800"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-neutral-400">
                            <span className="px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold uppercase text-[9px]">
                              {item.type === 'tv' ? 'TV' : 'Movie'}
                            </span>
                            <span>{item.releaseYear}</span>
                            <span className="text-neutral-600">•</span>
                            <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              {item.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-neutral-500 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowSuggestions(false);
                        searchInputRef.current?.blur();
                      }}
                      className="w-full px-3 py-2 text-center text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View all matching results</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-neutral-400">
                    No matching titles found on TMDB.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Direct TMDB ID Modal Button */}
          <button
            id="nav-direct-play-btn"
            onClick={onOpenDirectStream}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-white/10 text-xs font-semibold rounded-full transition-all shrink-0 cursor-pointer"
            title="Stream any movie or TV series using TMDB ID"
          >
            <PlayCircle className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">Direct TMDB</span>
            <span className="sm:hidden">Play</span>
          </button>

          {/* User Account / Sign In */}
          {user ? (
            <button
              onClick={() => onSelectTab('account')}
              className={`flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border transition-all ${
                currentTab === 'account'
                  ? 'bg-red-600/20 border-red-500 text-white'
                  : 'bg-neutral-900 border-white/10 hover:border-white/20 text-neutral-200'
              }`}
              title={`Account: ${user.displayName}`}
            >
              <img
                src={getAvatarUrl(user.avatarSeed)}
                alt={user.displayName}
                className="w-6 h-6 rounded-full border border-red-500/40"
              />
              <span className="text-xs font-bold hidden sm:inline truncate max-w-[100px]">
                {user.displayName}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('account')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold rounded-full shadow-md shadow-red-900/20 transition-all shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-white/10 px-4 pt-2 pb-4 space-y-1 text-sm font-medium animate-in slide-in-from-top duration-200">
          <button
            onClick={() => {
              onSelectTab('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left ${
              currentTab === 'home' ? 'text-white bg-white/10' : 'text-neutral-400'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explore</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('movies');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left ${
              currentTab === 'movies' ? 'text-white bg-white/10' : 'text-neutral-400'
            }`}
          >
            <Clapperboard className="w-4 h-4" />
            <span>Movies</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('tv');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left ${
              currentTab === 'tv' ? 'text-white bg-white/10' : 'text-neutral-400'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>TV Series</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('anime');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left ${
              currentTab === 'anime' ? 'text-white bg-white/10' : 'text-neutral-400'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Anime</span>
          </button>
          <button
            onClick={() => {
              onSelectTab('watchlist');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
              currentTab === 'watchlist' ? 'text-white bg-white/10' : 'text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4" />
              <span>My List</span>
            </div>
            {watchlistCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-bold">
                {watchlistCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              onSelectTab('account');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left ${
              currentTab === 'account' ? 'text-white bg-white/10' : 'text-neutral-400'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{user ? `Account (${user.displayName})` : 'Account & Watch History'}</span>
          </button>
        </div>
      )}
    </header>
  );
};
