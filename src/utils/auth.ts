import { UserProfile, CustomServerConfig } from '../types';
export type { UserProfile, CustomServerConfig };

const ACCOUNTS_STORAGE_KEY = 'wtcflix_accounts';
const ACTIVE_USER_ID_KEY = 'wtcflix_active_user_id';

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: UserProfile;
}

interface StoredAccount extends UserProfile {
  passwordHash: string; // Basic hash for local demo authentication
}

/**
 * Generates a simple reproducible hash for local password check
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

/**
 * Avatar seeds for cool avatar SVGs/initials
 */
export const AVATAR_SEEDS = [
  'Crimson',
  'Shadow',
  'Neon',
  'Cyber',
  'Viper',
  'Atlas',
  'Echo',
  'Nova',
];

export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

/**
 * Loads all registered accounts
 */
export function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Returns the currently active logged in user, or null if guest
 */
export function getCurrentUser(): UserProfile | null {
  try {
    const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (!activeId) return null;
    const accounts = getStoredAccounts();
    const found = accounts.find((a) => a.id === activeId);
    if (!found) return null;
    // Return profile without passwordHash
    const { passwordHash: _, ...profile } = found;
    return profile;
  } catch {
    return null;
  }
}

/**
 * Registers a new user account
 */
export function registerUser(params: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  avatarSeed?: string;
}): AuthResponse {
  const username = params.username.trim().toLowerCase();
  const email = params.email.trim().toLowerCase();
  const password = params.password.trim();

  if (!username || username.length < 3) {
    return { success: false, message: 'Username must be at least 3 characters.' };
  }
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please enter a valid email address.' };
  }
  if (!password || password.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters.' };
  }

  const accounts = getStoredAccounts();

  // Check if username or email already exists
  if (accounts.some((a) => a.username.toLowerCase() === username)) {
    return { success: false, message: 'Username is already taken. Please choose another.' };
  }
  if (accounts.some((a) => a.email.toLowerCase() === email)) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const avatarSeed = params.avatarSeed || AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];

  const newAccount: StoredAccount = {
    id: newId,
    username,
    email,
    displayName: params.displayName?.trim() || params.username.trim(),
    avatarSeed,
    createdAt: Date.now(),
    defaultServerId: 'vidking',
    customServers: [],
    passwordHash: simpleHash(password),
  };

  accounts.push(newAccount);
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  localStorage.setItem(ACTIVE_USER_ID_KEY, newId);

  // Dispatch auth event
  window.dispatchEvent(new Event('wtcflix_auth_changed'));

  const { passwordHash: _, ...profile } = newAccount;
  return { success: true, user: profile, message: 'Account created successfully!' };
}

/**
 * Logs in with username/email and password
 */
export function loginUser(usernameOrEmail: string, password: string): AuthResponse {
  const query = usernameOrEmail.trim().toLowerCase();
  const accounts = getStoredAccounts();

  const found = accounts.find(
    (a) => a.username.toLowerCase() === query || a.email.toLowerCase() === query
  );

  if (!found) {
    return { success: false, message: 'Account not found. Please register or check details.' };
  }

  if (found.passwordHash !== simpleHash(password)) {
    return { success: false, message: 'Incorrect password. Please try again.' };
  }

  localStorage.setItem(ACTIVE_USER_ID_KEY, found.id);
  window.dispatchEvent(new Event('wtcflix_auth_changed'));

  const { passwordHash: _, ...profile } = found;
  return { success: true, user: profile, message: `Welcome back, ${profile.displayName}!` };
}

/**
 * Logs out the active user and switches to Guest mode
 */
export function logoutUser(): void {
  localStorage.removeItem(ACTIVE_USER_ID_KEY);
  window.dispatchEvent(new Event('wtcflix_auth_changed'));
}

/**
 * Updates profile details (displayName, avatarSeed, defaultServerId)
 */
export function updateUserProfile(updates: Partial<UserProfile>): boolean {
  try {
    const activeId = localStorage.getItem(ACTIVE_USER_ID_KEY);
    if (!activeId) return false;

    const accounts = getStoredAccounts();
    const index = accounts.findIndex((a) => a.id === activeId);
    if (index === -1) return false;

    accounts[index] = {
      ...accounts[index],
      ...updates,
      id: activeId, // prevent id overwrite
    };

    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new Event('wtcflix_auth_changed'));
    return true;
  } catch {
    return false;
  }
}
