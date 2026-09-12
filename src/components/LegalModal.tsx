import React, { useEffect } from 'react';
import { X, ShieldAlert, FileText, Mail, Info } from 'lucide-react';

interface LegalModalProps {
  type: 'dmca' | 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (type) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [type, onClose]);

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-neutral-950 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-neutral-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white">
              {type === 'dmca' && 'DMCA Copyright Notice & Disclaimer'}
              {type === 'privacy' && 'Privacy Policy'}
              {type === 'terms' && 'Terms of Service'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          {type === 'dmca' && (
            <>
              <div className="p-4 rounded-xl bg-neutral-900 border border-white/5 space-y-2">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-red-400" />
                  Embedded Player Architecture Notice
                </h4>
                <p className="text-xs text-neutral-400">
                  WTCflix does not host, store, archive, upload, or redistribute any media or video files on its servers. All video playback is delivered via third-party iframe embed links provided by external services (specifically <strong>VidKing</strong>, www.vidking.net).
                </p>
              </div>

              <h4 className="text-base font-bold text-white mt-4">1. DMCA Compliance</h4>
              <p>
                WTCflix respects the intellectual property rights of others and adheres strictly to the Digital Millennium Copyright Act (DMCA). Because all video streams originate from external embed providers, please direct copyright takedown inquiries directly to the content host or upstream provider.
              </p>

              <h4 className="text-base font-bold text-white mt-4">2. Takedown Inquiries</h4>
              <p>
                If you believe your copyrighted material is inappropriately linked or indexed on WTCflix, please contact our designated copyright agent with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-400 pl-2">
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>The specific URL or TMDB identifier on WTCflix.</li>
                <li>Your contact information (name, address, telephone number, email).</li>
                <li>A statement made under penalty of perjury that the information provided is accurate.</li>
              </ul>

              <div className="pt-3 flex items-center gap-2 text-xs text-neutral-400">
                <Mail className="w-4 h-4 text-red-400" />
                <span>Contact: legal@wtcflix.example.com</span>
              </div>
            </>
          )}

          {type === 'privacy' && (
            <>
              <p>
                At WTCflix, user privacy is paramount. This application does not require personal identification or user registration to explore movies or TV shows.
              </p>
              <h4 className="text-base font-bold text-white">Local Playback Storage</h4>
              <p>
                Watch progress, playback timestamps, and your personal Watchlist are stored purely on your local browser using standard HTML5 <code>localStorage</code>. No personal telemetry or watch history is uploaded or shared with external parties.
              </p>
              <h4 className="text-base font-bold text-white">Third-Party Embeds</h4>
              <p>
                The VidKing player iframe runs within its own sandboxed context. Please consult VidKing’s privacy guidelines regarding their cookie or network policies.
              </p>
            </>
          )}

          {type === 'terms' && (
            <>
              <p>
                By accessing WTCflix, you agree to these Terms of Service. WTCflix is provided solely for personal entertainment, discovery, and testing purposes.
              </p>
              <h4 className="text-base font-bold text-white">Content Disclaimer</h4>
              <p>
                Movie and television metadata, posters, and summaries are retrieved from TMDB (The Movie Database). WTCflix does not endorse or guarantee the continuous availability of third-party embed streams.
              </p>
              <h4 className="text-base font-bold text-white">Prohibited Uses</h4>
              <p>
                You agree not to attempt to scrape, intercept, tamper with, or redistribute streams or interfere with the normal operation of WTCflix or its player partners.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
