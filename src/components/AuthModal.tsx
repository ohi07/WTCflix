import React, { useState } from 'react';
import { X, User, Lock, Mail, UserPlus, LogIn, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerUser, loginUser, AVATAR_SEEDS, getAvatarUrl } from '../utils/auth';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_SEEDS[0]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'register') {
      const res = registerUser({
        username,
        email,
        password,
        displayName: displayName || username,
        avatarSeed: selectedAvatar,
      });

      if (res.success && res.user) {
        setSuccessMsg('Account registered successfully! Tracking your watch history.');
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user!);
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } else {
      const res = loginUser(username || email, password);
      if (res.success && res.user) {
        setSuccessMsg(`Welcome back, ${res.user.displayName}!`);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user!);
          onClose();
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Login failed. Please check credentials.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-neutral-950 border border-white/15 rounded-2xl p-6 shadow-2xl text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              {mode === 'register' ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === 'register' ? 'Create WTCflix Account' : 'Sign In to WTCflix'}
              </h2>
              <p className="text-xs text-neutral-400">
                {mode === 'register'
                  ? 'Keep track of your watch history, watchlist, and server settings'
                  : 'Resume your synchronized watch history and custom servers'}
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-900 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register' ? 'bg-red-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login' ? 'bg-red-600 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Choose Profile Avatar
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_SEEDS.slice(0, 4).map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatar(seed)}
                    className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                      selectedAvatar === seed
                        ? 'border-red-500 bg-red-600/10 ring-2 ring-red-500/50'
                        : 'border-white/10 hover:border-white/20 bg-neutral-900'
                    }`}
                  >
                    <img
                      src={getAvatarUrl(seed)}
                      alt={seed}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1">{seed}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                id="auth-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. cinema_fan99"
                required
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Display Name (Optional)
                </label>
                <input
                  id="auth-displayname-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    id="auth-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-900/50">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/50">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              {mode === 'register' ? 'Register & Start Tracking' : 'Sign In to Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
