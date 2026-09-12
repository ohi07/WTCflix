import React, { useState } from 'react';
import { Server, ExternalLink, Plus, Trash2, Check, AlertCircle, Sparkles, Tv, ShieldCheck, HelpCircle } from 'lucide-react';
import { StreamingServer, CustomServerConfig } from '../types';
import {
  getAllAvailableServers,
  getSavedCustomServers,
  saveCustomServerConfig,
  deleteCustomServerConfig,
  setDefaultServerPreference,
  getDefaultServerPreference,
} from '../utils/servers';

interface ServerSelectorProps {
  currentServerId: string;
  onSelectServer: (serverId: string) => void;
  mediaTitle: string;
  isTv?: boolean;
}

export const ServerSelector: React.FC<ServerSelectorProps> = ({
  currentServerId,
  onSelectServer,
  mediaTitle,
  isTv = false,
}) => {
  const [showAddCustom, setShowAddCustom] = useState<boolean>(false);
  const [showSandboxHelp, setShowSandboxHelp] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customMovieUrl, setCustomMovieUrl] = useState<string>('');
  const [customTvUrl, setCustomTvUrl] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const servers = getAllAvailableServers();
  const defaultPreference = getDefaultServerPreference();

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      setErrorMsg('Please enter a server name.');
      return;
    }
    if (!customMovieUrl.trim() && !customTvUrl.trim()) {
      setErrorMsg('Please provide at least a Movie URL or TV URL template.');
      return;
    }

    const newConfig: CustomServerConfig = {
      id: `srv_${Date.now()}`,
      name: customName.trim(),
      movieUrlTemplate: customMovieUrl.trim(),
      tvUrlTemplate: customTvUrl.trim() || customMovieUrl.trim(),
      notes: customNotes.trim() || 'Custom user stream server endpoint.',
    };

    saveCustomServerConfig(newConfig);
    onSelectServer(`custom_${newConfig.id}`);
    setShowAddCustom(false);
    setCustomName('');
    setCustomMovieUrl('');
    setCustomTvUrl('');
    setCustomNotes('');
    setErrorMsg('');
  };

  return (
    <div className="bg-neutral-950/80 border-b border-white/5 px-4 py-3 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
            Stream Source:
          </span>
          <span className="text-neutral-400 text-[11px] hidden md:inline">
            (Switch server if experiencing buffering or sandbox block)
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowSandboxHelp(!showSandboxHelp)}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors"
            title="Troubleshoot sandbox or playback errors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sandbox Help</span>
          </button>

          <button
            onClick={() => setShowAddCustom(true)}
            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-600/10 border border-red-500/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Custom Server</span>
          </button>
        </div>
      </div>

      {/* Server Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 pb-1">
        {servers.map((srv) => {
          const isActive = currentServerId === srv.id;
          const isDefault = defaultPreference === srv.id;

          return (
            <button
              key={srv.id}
              onClick={() => onSelectServer(srv.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                  : 'bg-neutral-900/90 text-neutral-300 border-white/10 hover:border-white/25 hover:bg-neutral-800'
              }`}
            >
              <span>{srv.name}</span>
              {srv.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    isActive ? 'bg-black/40 text-white' : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {srv.badge}
                </span>
              )}
              {isDefault && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Default Server" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sandbox Troubleshooting Box */}
      {showSandboxHelp && (
        <div className="mt-2.5 p-3 rounded-xl bg-neutral-900 border border-amber-500/30 text-neutral-300 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>Sandbox & Playback Troubleshooting</span>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            If your browser displays a "Blocked by client" or "Sandbox restriction" error:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-neutral-400 pl-1">
            <li>
              <strong>Switch Streaming Server:</strong> Try switching to <strong>FS Plus (BDIX)</strong> or <strong>VidSrc Mirror</strong> above.
            </li>
            <li>
              <strong>Use Stremio:</strong> Click the <strong>Stremio</strong> tab to open the movie in Stremio Desktop, Mobile, or Stremio Web with high-speed addons.
            </li>
            <li>
              <strong>Open in New Window:</strong> Click the top-right <ExternalLink className="w-3 h-3 inline text-red-400" /> icon to open the player in an isolated clean tab where iframe sandboxes cannot interfere.
            </li>
          </ul>
        </div>
      )}

      {/* Add Custom Server Modal */}
      {showAddCustom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-2xl p-6 shadow-2xl text-neutral-200">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              Add Custom Streaming Server
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Integrate your own streaming server, IPTV/HLS gateway, or embed provider using template variables.
            </p>

            <form onSubmit={handleSaveCustom} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Server Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Home Media Server or VIP Mirror"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
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
                  placeholder="e.g. https://my-server.com/embed/movie/{tmdb}"
                  value={customMovieUrl}
                  onChange={(e) => setCustomMovieUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-red-500"
                  required
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Supported variables: <code>{'{tmdb}'}</code>, <code>{'{title}'}</code>, <code>{'{year}'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  TV Episode URL Template
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://my-server.com/embed/tv/{tmdb}/{season}/{episode}"
                  value={customTvUrl}
                  onChange={(e) => setCustomTvUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-neutral-500 mt-1">
                  Supported variables: <code>{'{tmdb}'}</code>, <code>{'{season}'}</code>, <code>{'{episode}'}</code>, <code>{'{title}'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Notes / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fast local network proxy"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              {errorMsg && (
                <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900/50">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustom(false)}
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
