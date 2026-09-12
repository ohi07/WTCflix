import React, { useState, useEffect } from 'react';
import {
  User,
  Clock,
  CheckCircle2,
  Bookmark,
  Server,
  Download,
  Upload,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  LogOut,
  UserPlus,
  LogIn,
  Settings,
  Plus,
  History,
  Shield,
  Layers,
} from 'lucide-react';
import { UserProfile, WatchProgress, CustomServerConfig } from '../types';
import { getCurrentUser, logoutUser, getAvatarUrl, updateUserProfile } from '../utils/auth';
import {
  getAllWatchProgress,
  removeWatchProgress,
  clearAllWatchProgress,
  getWatchStats,
  getWatchlistIds,
  exportUserData,
  importUserData,
} from '../utils/storage';
import {
  getAllAvailableServers,
  getSavedCustomServers,
  saveCustomServerConfig,
  deleteCustomServerConfig,
  setDefaultServerPreference,
  getDefaultServerPreference,
} from '../utils/servers';
import { formatSeconds } from '../utils/vidking';
import { navigateTo } from '../utils/router';
import { AuthModal } from './AuthModal';

interface AccountPageProps {
  initialTab?: 'profile' | 'history' | 'servers' | 'settings';
}

export const AccountPage: React.FC<AccountPageProps> = ({ initialTab = 'profile' }) => {
  const [user, setUser] = useState<UserProfile | null>(getCurrentUser());
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'servers'>(
    initialTab === 'history' ? 'history' : initialTab === 'servers' ? 'servers' : 'profile'
  );
  const [historyItems, setHistoryItems] = useState<WatchProgress[]>(getAllWatchProgress());
  const [stats, setStats] = useState(getWatchStats());
  const [watchlistCount, setWatchlistCount] = useState<number>(getWatchlistIds().length);
  const [defaultServer, setDefaultServer] = useState<string>(getDefaultServerPreference());
  const [customServers, setCustomServers] = useState<CustomServerConfig[]>(getSavedCustomServers());

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [importStatus, setImportStatus] = useState<string>('');

  // Add custom server modal states
  const [showAddServerModal, setShowAddServerModal] = useState<boolean>(false);
  const [newServerName, setNewServerName] = useState<string>('');
  const [newServerMovieUrl, setNewServerMovieUrl] = useState<string>('');
  const [newServerTvUrl, setNewServerTvUrl] = useState<string>('');
  const [newServerNotes, setNewServerNotes] = useState<string>('');

  const refreshData = () => {
    setUser(getCurrentUser());
    setHistoryItems(getAllWatchProgress());
    setStats(getWatchStats());
    setWatchlistCount(getWatchlistIds().length);
    setDefaultServer(getDefaultServerPreference());
    setCustomServers(getSavedCustomServers());
  };

  useEffect(() => {
    window.addEventListener('wtcflix_auth_changed', refreshData);
    window.addEventListener('wtcflix_progress_updated', refreshData);
    window.addEventListener('wtcflix_watchlist_updated', refreshData);
    window.addEventListener('wtcflix_servers_updated', refreshData);

    return () => {
      window.removeEventListener('wtcflix_auth_changed', refreshData);
      window.removeEventListener('wtcflix_progress_updated', refreshData);
      window.removeEventListener('wtcflix_watchlist_updated', refreshData);
      window.removeEventListener('wtcflix_servers_updated', refreshData);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    refreshData();
  };

  const handleServerPreferenceChange = (srvId: string) => {
    setDefaultServer(srvId);
    setDefaultServerPreference(srvId);
    if (user) {
      updateUserProfile({ defaultServerId: srvId });
    }
  };

  const handleSaveCustomServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim() || (!newServerMovieUrl.trim() && !newServerTvUrl.trim())) return;

    saveCustomServerConfig({
      id: `srv_${Date.now()}`,
      name: newServerName.trim(),
      movieUrlTemplate: newServerMovieUrl.trim(),
      tvUrlTemplate: newServerTvUrl.trim() || newServerMovieUrl.trim(),
      notes: newServerNotes.trim() || 'Custom media server',
    });

    setNewServerName('');
    setNewServerMovieUrl('');
    setNewServerTvUrl('');
    setNewServerNotes('');
    setShowAddServerModal(false);
    refreshData();
  };

  const handleDeleteCustomServer = (id: string) => {
    deleteCustomServerConfig(id);
    refreshData();
  };

  const handleExportData = () => {
    const json = exportUserData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wtcflix-watch-history-${user?.username || 'guest'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const ok = importUserData(text);
      if (ok) {
        setImportStatus('Watch data imported successfully!');
        refreshData();
        setTimeout(() => setImportStatus(''), 3000);
      } else {
        setImportStatus('Failed to import file. Make sure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const allServers = getAllAvailableServers();

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 pt-24 pb-20">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* User Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-900 border border-white/10 p-6 sm:p-8 mb-8 overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-800 border-2 border-red-500/40 shadow-xl shrink-0">
                {user ? (
                  <img
                    src={getAvatarUrl(user.avatarSeed)}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400">
                    <User className="w-8 h-8 text-neutral-500" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {user ? user.displayName : 'Guest User'}
                  </h1>
                  {user ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase">
                      Registered Member
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-neutral-400 text-[10px] font-medium">
                      Temporary Session
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 mt-1">
                  {user ? (
                    <>
                      <span>@{user.username}</span> &bull; <span>{user.email}</span> &bull; Member since{' '}
                      {new Date(user.createdAt).toLocaleDateString()}
                    </>
                  ) : (
                    'Register an account to sync your watch progress across devices and keep custom servers.'
                  )}
                </p>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-red-400 border border-white/10 text-xs font-semibold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Free Account</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10">
            <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-red-500" />
                Time Watched
              </span>
              <p className="text-base sm:text-lg font-bold text-white mt-1">
                {Math.floor(stats.totalSeconds / 3600)}h {Math.floor((stats.totalSeconds % 3600) / 60)}m
              </p>
            </div>

            <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-blue-500" />
                Titles Started
              </span>
              <p className="text-base sm:text-lg font-bold text-white mt-1">
                {stats.totalWatchedItems}
              </p>
            </div>

            <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Completed
              </span>
              <p className="text-base sm:text-lg font-bold text-white mt-1">
                {stats.completedItems}
              </p>
            </div>

            <div className="bg-neutral-900/60 rounded-xl p-3 border border-white/5">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-purple-500" />
                Watchlist
              </span>
              <p className="text-base sm:text-lg font-bold text-white mt-1">
                {watchlistCount}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 mb-6 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-red-600 text-white shadow'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-red-600 text-white shadow'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Watch History ({historyItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('servers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'servers'
                ? 'bg-red-600 text-white shadow'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Streaming Servers & Sources</span>
          </button>
        </div>

        {/* Tab 1: Profile & Data Portability */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {!user && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-red-950/40 to-neutral-900 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    Create an account to keep your watch data safe
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
                    You are currently watching as a Guest. Register a free username and password to keep your watch history, watchlist, and server configurations safely saved.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer shrink-0"
                >
                  Register in 10 Seconds
                </button>
              </div>
            )}

            {/* Data Export / Import Card */}
            <div className="bg-neutral-950/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-red-500" />
                    Data Backup & Portability
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Export your watch progress and watchlist to JSON or restore a previous backup.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-white transition-colors"
                >
                  <Download className="w-4 h-4 text-red-400" />
                  <span>Export Watch History (.json)</span>
                </button>

                <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>Restore from JSON File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFile}
                    className="hidden"
                  />
                </label>
              </div>

              {importStatus && (
                <div className="p-3 rounded-xl bg-neutral-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  {importStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Full Watch History */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
                Recorded Watch History
              </h3>
              {historyItems.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear your entire watch history?')) {
                      clearAllWatchProgress();
                      refreshData();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              )}
            </div>

            {historyItems.length === 0 ? (
              <div className="py-16 text-center bg-neutral-950/60 rounded-2xl border border-white/5 p-8">
                <History className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h4 className="text-base font-semibold text-white">No watch history yet</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  As you play movies and TV series, your progress and timestamps will automatically be recorded here.
                </p>
                <button
                  onClick={() => navigateTo('/')}
                  className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {historyItems.map((item) => (
                  <div
                    key={item.key}
                    className="group relative bg-neutral-950/80 border border-white/10 hover:border-white/20 rounded-2xl p-3 transition-all flex gap-3 shadow-lg"
                  >
                    <div className="relative w-20 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-neutral-900">
                      <img
                        src={item.posterPath}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1.5 bg-neutral-800">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${Math.min(100, item.progress)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                          {item.mediaType === 'tv'
                            ? `TV &bull; S${item.season} E${item.episode}`
                            : 'Movie'}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                          {item.title}
                        </h4>
                        {item.episodeTitle && (
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {item.episodeTitle}
                          </p>
                        )}
                        <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                          {formatSeconds(item.currentTime)} / {formatSeconds(item.duration)} (
                          {Math.round(item.progress)}%)
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            if (item.mediaType === 'tv') {
                              navigateTo({
                                page: 'watch-tv',
                                id: item.tmdbId,
                                season: item.season || 1,
                                episode: item.episode || 1,
                              });
                            } else {
                              navigateTo({ page: 'watch-movie', id: item.tmdbId });
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition-all"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Resume</span>
                        </button>

                        <button
                          onClick={() => {
                            removeWatchProgress(item.key);
                            refreshData();
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                          title="Remove from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Streaming Servers & Sources */}
        {activeTab === 'servers' && (
          <div className="space-y-6">
            {/* Preferred Server Selection */}
            <div className="bg-neutral-950/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-red-500" />
                    Default Streaming Source
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Choose which server player loads by default when you click Play.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allServers.map((srv) => {
                  const isSelected = defaultServer === srv.id;

                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleServerPreferenceChange(srv.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-red-600/15 border-red-500 shadow-md shadow-red-600/20'
                          : 'bg-neutral-900/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-bold text-white">{srv.name}</span>
                          {srv.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-white/10 text-neutral-300">
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed">
                          {srv.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/5">
                        <input
                          type="radio"
                          name="default_server_radio"
                          checked={isSelected}
                          onChange={() => handleServerPreferenceChange(srv.id)}
                          className="accent-red-600"
                        />
                        <span className="text-xs font-medium text-neutral-300">
                          {isSelected ? 'Active Default' : 'Set as Default'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Servers Management */}
            <div className="bg-neutral-950/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Manual Custom Servers ({customServers.length})
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Integrate your personal streaming servers, proxy gateways, or private IPTV embeds.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddServerModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Server</span>
                </button>
              </div>

              {customServers.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-2">
                  No custom servers configured yet. Click "Add Server" to link your own stream URLs.
                </p>
              ) : (
                <div className="space-y-3">
                  {customServers.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-900 border border-white/5 text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{srv.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-400">
                            Custom
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-neutral-400 truncate">
                          Movie: {srv.movieUrlTemplate}
                        </p>
                        <p className="font-mono text-[11px] text-neutral-400 truncate">
                          TV: {srv.tvUrlTemplate}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteCustomServer(srv.id)}
                        className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                        title="Delete custom server"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authMode}
          onClose={() => {
            setShowAuthModal(false);
            refreshData();
          }}
          onSuccess={() => {
            setShowAuthModal(false);
            refreshData();
          }}
        />
      )}

      {/* Add Custom Server Modal */}
      {showAddServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-2xl p-6 shadow-2xl text-neutral-200">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              Add Custom Streaming Server
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Integrate your own streaming server using dynamic template variables.
            </p>

            <form onSubmit={handleSaveCustomServer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Server Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP BDIX Server"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Movie URL Template
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/embed/movie/{tmdb}"
                  value={newServerMovieUrl}
                  onChange={(e) => setNewServerMovieUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-red-500"
                  required
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Variables: <code>{'{tmdb}'}</code>, <code>{'{title}'}</code>, <code>{'{year}'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  TV Episode URL Template
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/embed/tv/{tmdb}/{season}/{episode}"
                  value={newServerTvUrl}
                  onChange={(e) => setNewServerTvUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Variables: <code>{'{tmdb}'}</code>, <code>{'{season}'}</code>, <code>{'{episode}'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. High-speed local mirror"
                  value={newServerNotes}
                  onChange={(e) => setNewServerNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddServerModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-neutral-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 cursor-pointer"
                >
                  Save Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
