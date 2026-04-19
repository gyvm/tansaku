import { create } from "zustand";
import { commands } from "../lib/commands";

interface AuthStore {
  isAuthenticated: boolean;
  loading: boolean;
  checkStatus: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  loading: true,
  checkStatus: async () => {
    try {
      const status = await commands.getAuthStatus();
      set({ isAuthenticated: status, loading: false });
    } catch {
      set({ isAuthenticated: false, loading: false });
    }
  },
  login: async () => {
    await commands.startOAuthLogin();
  },
  logout: async () => {
    await commands.logout();
    set({ isAuthenticated: false });
  },
  setAuthenticated: (value) => set({ isAuthenticated: value, loading: false }),
}));
