import { create } from "zustand";
import type { UserSettings } from "../types";
import { commands } from "../lib/commands";

interface SettingsStore {
  settings: UserSettings | null;
  loading: boolean;
  load: () => Promise<void>;
  update: (settings: UserSettings) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: true,
  load: async () => {
    const settings = await commands.getSettings();
    set({ settings, loading: false });
  },
  update: async (settings) => {
    await commands.updateSettings(settings);
    set({ settings });
  },
}));
