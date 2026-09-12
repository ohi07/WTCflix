import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  Tv,
  TrendingUp,
  Flame,
  Award,
  Clock,
  Sparkles,
  Search,
  Bookmark,
  Play,
  RotateCcw,
  SlidersHorizontal,
  ArrowLeft,
  User,
  Loader2,
} from 'lucide-react';
import { MediaItem, WatchProgress, AppRoute } from './types';
import { MEDIA_CATALOG, GENRES_LIST } from './data/mediaData';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MediaRow } from './components/MediaRow';
import { MediaCard } from './components/MediaCard';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { MediaDetailsModal } from './components/MediaDetailsModal';
import { DirectStreamModal } from './components/DirectStreamModal';
import { TrailerModal } from './components/TrailerModal';
import { LegalModal } from './components/LegalModal';
import { Footer } from './components/Footer';
import { WatchPage } from './components/WatchPage';
import { AccountPage } from './components/AccountPage';
import { AnimePage } from './components/AnimePage';
import { AuthModal } from './components/AuthModal';
import { getWatchlistIds, toggleWatchlistId } from './utils/storage';
import { parseCurrentRoute, navigateTo } from './utils/router';
import {
  searchTmdb,
  getTrendingMedia,
  getPopularMedia,
  getTopRatedMedia,
  getAnimeMedia,
  discoverByGenre,
  getMediaDetails,
} from './services/tmdb';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(parseCurrentRoute());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);

  // TMDB Live State
  const [tmdbSearchResults, setTmdbSearchResults] = useState<MediaItem[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState<boolean>(false);
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [totalSearchCount, setTotalSearchCount] = useState<number>(0);

  // Live Homepage Rows State (initialized with fallback data)
  const [homeTrending, setHomeTrending] = useState<MediaItem[]>(() =>
    MEDIA_CATALOG.filter((item) => item.trending)
  );
  const [homePopularMovies, setHomePopularMovies] = useState<MediaItem[]>(() =>
    MEDIA_CATALOG.filter((item) => item.type === 'movie' && item.popular)
  );
  const [homePopularTv, setHomePopularTv] = useState<MediaItem[]>(() =>
    MEDIA_CATALOG.filter((item) => item.type === 'tv' && item.popular)
  );
  const [homeTopRated, setHomeTopRated] = useState<MediaItem[]>(() =>
    MEDIA_CATALOG.filter((item) => item.topRated)
  );
  const [homeAnime, setHomeAnime] = useState<MediaItem[]>(() =>
    MEDIA_CATALOG.filter((item) => item.genres.includes('Anime'))
  );

  // Dynamic Catalog for /movies or /tv tabs
  const [dynamicCatalogItems, setDynamicCatalogItems] = useState<MediaItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // Cache for dynamic full media items
  const [mediaDetailsCache, setMediaDetailsCache] = useState<Record<number, MediaItem>>({});

  // Modals & Details
  const [selectedMediaForDetails, setSelectedMediaForDetails] = useState<MediaItem | null>(null);
  const [isDirectStreamOpen, setIsDirectStreamOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [activeTrailer, setActiveTrailer] = useState<{ key: string; title: string } | null>(null);
  const [legalModalType, setLegalModalType] = useState<'dmca' | 'privacy' | 'terms' | null>(null);

  // Sync route on popstate or custom route change event
  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(parseCurrentRoute());
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('wtcflix_route_changed', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('wtcflix_route_changed', handleRouteChange);
    };
  }, []);

  // Sync Watchlist from storage
  const syncWatchlist = () => {
    setWatchlistIds(getWatchlistIds());
  };

  useEffect(() => {
    syncWatchlist();
    window.addEventListener('wtcflix_watchlist_updated', syncWatchlist);
    return () => window.removeEventListener('wtcflix_watchlist_updated', syncWatchlist);
  }, []);

  const handleToggleWatchlist = (id: number) => {
    toggleWatchlistId(id);
    syncWatchlist();
  };

  // Nav tab selection with dynamic routing
  const handleSelectNavTab = (tab: 'home' | 'movies' | 'tv' | 'anime' | 'watchlist' | 'account') => {
    setSearchQuery('');
    if (tab === 'home') navigateTo('/');
    else if (tab === 'movies') navigateTo('/movies');
    else if (tab === 'tv') navigateTo('/tv');
    else if (tab === 'anime') navigateTo('/anime');
    else if (tab === 'watchlist') navigateTo('/watchlist');
    else if (tab === 'account') navigateTo('/account');
  };

  // Navigate to dedicated dynamic URL watch page
  const handlePlayMedia = (item: MediaItem) => {
    if (item.type === 'tv') {
      navigateTo({ page: 'watch-tv', id: item.id, season: 1, episode: 1 });
    } else {
      navigateTo({ page: 'watch-movie', id: item.id });
    }
  };

  // Resume item from Continue Watching row on dedicated dynamic URL
  const handleResumeProgress = (progress: WatchProgress) => {
    if (progress.mediaType === 'tv') {
      navigateTo({
        page: 'watch-tv',
        id: progress.tmdbId,
        season: progress.season || 1,
        episode: progress.episode || 1,
      });
    } else {
      navigateTo({ page: 'watch-movie', id: progress.tmdbId });
    }
  };

  // Load initial live TMDB content for homepage
  useEffect(() => {
    let isCancelled = false;
    const fetchHomeFeed = async () => {
      try {
        const [trendingRes, popMoviesRes, popTvRes, topRatedRes, animeRes] = await Promise.allSettled([
          getTrendingMedia('all', 'week'),
          getPopularMedia('movie', 1),
          getPopularMedia('tv', 1),
          getTopRatedMedia('movie', 1),
          getAnimeMedia('all', 1),
        ]);

        if (trendingRes.status === 'fulfilled' && trendingRes.value.length > 0 && !isCancelled) {
          setHomeTrending(trendingRes.value);
        }
        if (popMoviesRes.status === 'fulfilled' && popMoviesRes.value.length > 0 && !isCancelled) {
          setHomePopularMovies(popMoviesRes.value);
        }
        if (popTvRes.status === 'fulfilled' && popTvRes.value.length > 0 && !isCancelled) {
          setHomePopularTv(popTvRes.value);
        }
        if (topRatedRes.status === 'fulfilled' && topRatedRes.value.length > 0 && !isCancelled) {
          setHomeTopRated(topRatedRes.value);
        }
        if (animeRes.status === 'fulfilled' && animeRes.value.length > 0 && !isCancelled) {
          setHomeAnime(animeRes.value);
        }
      } catch (err) {
        console.warn('Fallback to bundled catalog for home:', err);
      }
    };

    fetchHomeFeed();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Fetch live TMDB search results when user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTmdbSearchResults([]);
      setTotalSearchCount(0);
      setIsSearchingTmdb(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTmdb(true);
      try {
        const queryType = searchTypeFilter === 'all' ? 'multi' : searchTypeFilter;
        const { items, totalResults } = await searchTmdb(searchQuery, queryType, 1);
        if (items.length > 0) {
          setTmdbSearchResults(items);
          setTotalSearchCount(totalResults);
        } else {
          // Fallback to local catalog if TMDB had 0 matches
          const q = searchQuery.toLowerCase().trim();
          const localMatches = MEDIA_CATALOG.filter(
            (m) =>
              m.title.toLowerCase().includes(q) ||
              m.overview.toLowerCase().includes(q) ||
              m.genres.some((g) => g.toLowerCase().includes(q))
          );
          setTmdbSearchResults(localMatches);
          setTotalSearchCount(localMatches.length);
        }
      } catch (err) {
        console.error('TMDB Search error, fallback to local:', err);
        const q = searchQuery.toLowerCase().trim();
        const localMatches = MEDIA_CATALOG.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.overview.toLowerCase().includes(q) ||
            m.genres.some((g) => g.toLowerCase().includes(q))
        );
        setTmdbSearchResults(localMatches);
        setTotalSearchCount(localMatches.length);
      } finally {
        setIsSearchingTmdb(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTypeFilter]);

  // Fetch dynamic catalog for /movies or /tv tabs
  useEffect(() => {
    if (currentRoute.page !== 'movies' && currentRoute.page !== 'tv') return;

    let isCancelled = false;
    const mediaType = currentRoute.page === 'movies' ? 'movie' : 'tv';
    const activeGenre = currentRoute.genre || selectedGenre;

    const fetchCatalog = async () => {
      setIsLoadingCatalog(true);
      try {
        let results: MediaItem[] = [];
        if (activeGenre && activeGenre !== 'All') {
          results = await discoverByGenre(mediaType, activeGenre, 1);
        } else {
          results = await getPopularMedia(mediaType, 1);
        }
        if (!isCancelled && results.length > 0) {
          setDynamicCatalogItems(results);
        }
      } catch (err) {
        console.error('Dynamic catalog load error:', err);
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    };

    fetchCatalog();
    return () => {
      isCancelled = true;
    };
  }, [currentRoute.page, currentRoute.genre, selectedGenre]);

  // Curated hero billboard items
  const featuredItems = useMemo(() => {
    if (homeTrending.length >= 3) {
      return homeTrending.slice(0, 5);
    }
    return MEDIA_CATALOG.filter((item) => item.featured);
  }, [homeTrending]);

  const recentlyAddedItems = useMemo(
    () => MEDIA_CATALOG.filter((item) => item.recentlyAdded || item.releaseYear >= 2024),
    []
  );

  // Tab View Data (Movies / TV / Watchlist)
  const tabItems = useMemo(() => {
    if (currentRoute.page === 'watchlist') {
      // Find items in cache or catalog matching watchlist IDs
      return [
        ...MEDIA_CATALOG,
        ...homeTrending,
        ...homePopularMovies,
        ...homePopularTv,
        ...Object.values(mediaDetailsCache),
      ]
        .filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx)
        .filter((item) => watchlistIds.includes(item.id));
    }

    if (dynamicCatalogItems.length > 0) {
      return dynamicCatalogItems;
    }

    let list: MediaItem[] = [];
    if (currentRoute.page === 'movies') {
      list = homePopularMovies.length > 0 ? homePopularMovies : MEDIA_CATALOG.filter((item) => item.type === 'movie');
    } else if (currentRoute.page === 'tv') {
      list = homePopularTv.length > 0 ? homePopularTv : MEDIA_CATALOG.filter((item) => item.type === 'tv');
    }

    const genreFilter =
      currentRoute.page === 'movies' || currentRoute.page === 'tv'
        ? currentRoute.genre || selectedGenre
        : selectedGenre;

    if (genreFilter && genreFilter !== 'All') {
      list = list.filter((item) => item.genres.includes(genreFilter));
    }
    return list;
  }, [currentRoute, selectedGenre, watchlistIds, dynamicCatalogItems, homePopularMovies, homePopularTv, homeTrending, mediaDetailsCache]);

  // Check if current route is a dedicated Movie or TV watch page
  const isWatchPage = currentRoute.page === 'watch-movie' || currentRoute.page === 'watch-tv';
  const watchRoute = isWatchPage ? (currentRoute as { page: 'watch-movie' | 'watch-tv'; id: number; serverId?: string }) : null;
  const isTvType = currentRoute.page === 'watch-tv';

  // Fetch full details from TMDB if not already in cache
  useEffect(() => {
    if (!watchRoute) return;
    const id = watchRoute.id;

    if (mediaDetailsCache[id] && mediaDetailsCache[id].overview) {
      return;
    }

    let isCancelled = false;
    getMediaDetails(id, isTvType ? 'tv' : 'movie')
      .then((details) => {
        if (!isCancelled && details) {
          setMediaDetailsCache((prev) => ({ ...prev, [id]: details }));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch details for media:', id, err);
      });

    return () => {
      isCancelled = true;
    };
  }, [watchRoute?.id, isTvType, mediaDetailsCache]);

  let currentWatchMedia: MediaItem | null = null;
  if (isWatchPage && watchRoute) {
    if (mediaDetailsCache[watchRoute.id]) {
      currentWatchMedia = mediaDetailsCache[watchRoute.id];
    } else {
      const foundInCatalog = MEDIA_CATALOG.find((m) => m.id === watchRoute.id);
      const foundInSearch = tmdbSearchResults.find((m) => m.id === watchRoute.id);
      const foundInHome = [...homeTrending, ...homePopularMovies, ...homePopularTv].find((m) => m.id === watchRoute.id);

      currentWatchMedia = foundInCatalog || foundInSearch || foundInHome || {
        id: watchRoute.id,
        type: isTvType ? 'tv' : 'movie',
        title: isTvType ? `TMDB TV Series #${watchRoute.id}` : `TMDB Movie #${watchRoute.id}`,
        overview: `Streaming TMDB ID ${watchRoute.id} across multi-source servers.`,
        backdropPath: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1280&q=80',
        posterPath: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=500&q=80',
        releaseYear: new Date().getFullYear(),
        genres: ['Streaming'],
        rating: 8.0,
        cast: [],
      };
    }
  }

  // Active Navbar tab indicator
  const activeNavTab =
    currentRoute.page === 'watch-movie' || currentRoute.page === 'watch-tv' || currentRoute.page === 'direct'
      ? 'home'
      : currentRoute.page;

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={activeNavTab as any}
        onSelectTab={handleSelectNavTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenDirectStream={() => setIsDirectStreamOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        watchlistCount={watchlistIds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Search Results Mode */}
        {searchQuery ? (
          <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display uppercase tracking-wide">
                  Search Results for <span className="text-red-500">"{searchQuery}"</span>
                </h1>
                <p className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                  <span>
                    Found {totalSearchCount} {totalSearchCount === 1 ? 'title' : 'titles'} in TMDB database
                  </span>
                  {isSearchingTmdb && (
                    <span className="flex items-center gap-1 text-red-400 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching live API...
                    </span>
                  )}
                </p>
              </div>

              {/* Filter Tabs & Clear */}
              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 bg-neutral-900 border border-white/10 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setSearchTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      searchTypeFilter === 'all'
                        ? 'bg-red-600 text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSearchTypeFilter('movie')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      searchTypeFilter === 'movie'
                        ? 'bg-red-600 text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Movies
                  </button>
                  <button
                    onClick={() => setSearchTypeFilter('tv')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      searchTypeFilter === 'tv'
                        ? 'bg-red-600 text-white shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    TV Shows
                  </button>
                </div>

                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-300 transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            </div>

            {/* Skeleton while searching */}
            {isSearchingTmdb && tmdbSearchResults.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="w-full aspect-[2/3] bg-neutral-900 rounded-xl border border-white/5" />
                    <div className="h-3 bg-neutral-900 rounded w-3/4" />
                    <div className="h-2.5 bg-neutral-900/60 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : tmdbSearchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {tmdbSearchResults.map((item) => (
                  <MediaCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onSelect={(it) => setSelectedMediaForDetails(it)}
                    onPlay={handlePlayMedia}
                    isWatchlist={watchlistIds.includes(item.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center text-neutral-400">
                <Search className="w-12 h-12 text-neutral-600 mb-3" />
                <h3 className="text-lg font-semibold text-white">No titles matched your search</h3>
                <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
                  Try searching by title name, or open the Direct Stream Launcher to pick any title or paste a TMDB ID.
                </p>
                <button
                  onClick={() => setIsDirectStreamOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  Direct Stream Launcher
                </button>
              </div>
            )}
          </div>
        ) : isWatchPage && currentWatchMedia ? (
          /* Dedicated Movie or TV Series Page */
          <WatchPage
            media={currentWatchMedia}
            initialSeason={currentRoute.page === 'watch-tv' ? currentRoute.season : 1}
            initialEpisode={currentRoute.page === 'watch-tv' ? currentRoute.episode : 1}
            initialServerId={'serverId' in currentRoute ? currentRoute.serverId : undefined}
            allMedia={MEDIA_CATALOG}
          />
        ) : currentRoute.page === 'account' ? (
          /* Dedicated User Account & Watch History Page */
          <AccountPage initialTab={currentRoute.tab} />
        ) : currentRoute.page === 'anime' ? (
          /* Dedicated Anime Sanctuary Hub */
          <AnimePage
            onSelect={(it) => setSelectedMediaForDetails(it)}
            onPlay={handlePlayMedia}
            watchlistIds={watchlistIds}
            onToggleWatchlist={handleToggleWatchlist}
            initialGenre={currentRoute.genre}
          />
        ) : currentRoute.page === 'movies' || currentRoute.page === 'tv' || currentRoute.page === 'watchlist' ? (
          /* Dedicated Catalog Page: Movies, TV Series, or My List */
          <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {currentRoute.page === 'movies' && <Film className="w-6 h-6 text-red-500" />}
                  {currentRoute.page === 'tv' && <Tv className="w-6 h-6 text-red-500" />}
                  {currentRoute.page === 'watchlist' && <Bookmark className="w-6 h-6 text-red-500" />}
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-wide">
                    {currentRoute.page === 'movies' && 'Movies Catalog'}
                    {currentRoute.page === 'tv' && 'TV Series Catalog'}
                    {currentRoute.page === 'watchlist' && 'My Watchlist'}
                  </h1>
                </div>
                <p className="text-xs text-neutral-400">
                  {currentRoute.page === 'movies' && 'Stream top blockbuster films with instant player embeds and multiple sources'}
                  {currentRoute.page === 'tv' && 'Binge full TV series seasons with automatic episode switching and progress sync'}
                  {currentRoute.page === 'watchlist' && 'Your saved movies and television shows for quick access'}
                </p>
              </div>

              {/* Genre Filter Bar (for Movies & TV tabs) */}
              {currentRoute.page !== 'watchlist' && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <SlidersHorizontal className="w-4 h-4 text-neutral-500 shrink-0 mr-1" />
                  {GENRES_LIST.map((genre) => {
                    const activeG = currentRoute.genre || selectedGenre;
                    const isSelected = activeG === genre;

                    return (
                      <button
                        key={genre}
                        onClick={() => {
                          setSelectedGenre(genre);
                          navigateTo(
                            currentRoute.page === 'movies'
                              ? { page: 'movies', genre }
                              : { page: 'tv', genre }
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-white/5'
                        }`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Grid */}
            {tabItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {tabItems.map((item) => (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onSelect={(it) => setSelectedMediaForDetails(it)}
                    onPlay={handlePlayMedia}
                    isWatchlist={watchlistIds.includes(item.id)}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center text-neutral-400">
                <Bookmark className="w-12 h-12 text-neutral-600 mb-3" />
                <h3 className="text-lg font-semibold text-white">
                  {currentRoute.page === 'watchlist' ? 'Your watchlist is empty' : 'No titles found'}
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
                  {currentRoute.page === 'watchlist'
                    ? 'Explore movies and TV shows and click the bookmark icon to add them to your personal list.'
                    : 'Try selecting another genre or search for titles.'}
                </p>
                <button
                  onClick={() => navigateTo('/')}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  Browse Home Catalog
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Home Screen */
          <div>
            {/* Cinematic Hero Billboard */}
            <HeroBanner
              items={featuredItems}
              onPlay={handlePlayMedia}
              onMoreInfo={(it) => setSelectedMediaForDetails(it)}
              onOpenTrailer={(key, title) => setActiveTrailer({ key, title })}
              watchlistIds={watchlistIds}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* Continue Watching Row (partitioned per active account) */}
            <ContinueWatchingRow onResume={handleResumeProgress} />

            {/* Quick Genre Filter Bar */}
            <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider shrink-0 mr-1">
                  Browse by Genre:
                </span>
                {GENRES_LIST.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      if (genre === 'All') return;
                      setSelectedGenre(genre);
                      navigateTo({ page: 'movies', genre });
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-neutral-900/80 hover:bg-red-600/20 hover:border-red-500/40 border border-white/5 text-xs text-neutral-300 hover:text-red-400 font-medium whitespace-nowrap transition-all"
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Row */}
            <div id="trending">
              <MediaRow
                title="Trending Now"
                icon={<Flame className="w-5 h-5" />}
                items={homeTrending}
                onSelect={(it) => setSelectedMediaForDetails(it)}
                onPlay={handlePlayMedia}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Popular Movies */}
            <div id="popular-movies">
              <MediaRow
                title="Popular Movies"
                icon={<Film className="w-5 h-5" />}
                items={homePopularMovies}
                onSelect={(it) => setSelectedMediaForDetails(it)}
                onPlay={handlePlayMedia}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Popular TV Shows */}
            <div id="popular-tv">
              <MediaRow
                title="Popular TV Shows"
                icon={<Tv className="w-5 h-5" />}
                items={homePopularTv}
                onSelect={(it) => setSelectedMediaForDetails(it)}
                onPlay={handlePlayMedia}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Trending Anime & Japanese Animation */}
            <div id="trending-anime">
              <MediaRow
                title="Trending Anime & Japanese Animation"
                icon={<Sparkles className="w-5 h-5 text-amber-400" />}
                items={homeAnime}
                onSelect={(it) => setSelectedMediaForDetails(it)}
                onPlay={handlePlayMedia}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Top Rated / Critically Acclaimed */}
            <div id="top-rated">
              <MediaRow
                title="Critically Acclaimed"
                icon={<Award className="w-5 h-5" />}
                items={homeTopRated}
                onSelect={(it) => setSelectedMediaForDetails(it)}
                onPlay={handlePlayMedia}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Recently Added */}
            <div id="recently-added">
              <MediaRow
                title="Recently Added & New Releases"
                icon={<Clock className="w-5 h-5" />}
                items={recentlyAddedItems}
                onSelect={(it) => setSelectedMediaForDetails(it)}
                onPlay={handlePlayMedia}
                watchlistIds={watchlistIds}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          </div>
        )}
      </main>

      {/* Media Details Modal (for quick info overlay) */}
      {selectedMediaForDetails && (
        <MediaDetailsModal
          media={selectedMediaForDetails}
          allMedia={MEDIA_CATALOG}
          isOpen={!!selectedMediaForDetails}
          onClose={() => setSelectedMediaForDetails(null)}
          onSelectRelated={(related) => setSelectedMediaForDetails(related)}
          onOpenTrailer={(key, title) => setActiveTrailer({ key, title })}
          isWatchlist={watchlistIds.includes(selectedMediaForDetails.id)}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Direct TMDB Stream Modal */}
      <DirectStreamModal
        isOpen={isDirectStreamOpen}
        onClose={() => setIsDirectStreamOpen(false)}
      />

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="register"
      />

      {/* Trailer Modal */}
      <TrailerModal
        youtubeKey={activeTrailer ? activeTrailer.key : null}
        title={activeTrailer ? activeTrailer.title : ''}
        onClose={() => setActiveTrailer(null)}
      />

      {/* Legal & DMCA Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Footer */}
      <Footer
        onOpenLegal={(type) => setLegalModalType(type)}
        onOpenDirectStream={() => setIsDirectStreamOpen(true)}
      />
    </div>
  );
}
