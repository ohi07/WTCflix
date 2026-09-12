import React from 'react';
import { Film, ShieldAlert, Heart, ExternalLink, Server } from 'lucide-react';
import { navigateTo } from '../utils/router';

interface FooterProps {
  onOpenLegal: (type: 'dmca' | 'privacy' | 'terms') => void;
  onOpenDirectStream: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onOpenDirectStream }) => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-neutral-950 text-neutral-400 text-xs">
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Overview */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-white font-display tracking-wider">
                WTC<span className="text-red-500">FLIX</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              A modern, high-performance movie and TV series streaming interface featuring multi-server playback options (FS Plus BDIX, Stremio, VidSrc, and VidKing), customizable sources, and synchronized watch history tracking.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenDirectStream}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-xs transition-colors"
              >
                <span>Direct TMDB ID Launcher</span>
                <ExternalLink className="w-3 h-3 text-red-400" />
              </button>

              <button
                onClick={() => navigateTo('/account?tab=servers')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-xs transition-colors"
              >
                <Server className="w-3 h-3 text-blue-400" />
                <span>Manage Streaming Servers</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigateTo('/')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  Explore Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/movies')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/tv')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  TV Series
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/watchlist')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  My Watchlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/account')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  Account & Watch Stats
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px]">
              Legal & Disclaimers
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onOpenLegal('dmca')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  DMCA & Copyright Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('terms')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacy')}
                  className="hover:text-red-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} WTCflix. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>High-speed cinema & multi-server streaming</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
