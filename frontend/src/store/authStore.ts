import { create } from 'zustand';

interface User {
  id: string;
  walletAddress: string;
  email?: string;
  username?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  _hydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // Start with null on both server and client — hydrate() fills it in after mount
  user: null,
  token: null,
  isLoading: false,
  _hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const rawUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    let user: User | null = null;
    if (rawUser) {
      try { user = JSON.parse(rawUser); } catch { localStorage.removeItem('user'); }
    }
    set({ user, token, _hydrated: true });
  },

  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user, token, _hydrated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));
