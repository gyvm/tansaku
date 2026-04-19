import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import type { CalendarEvent } from "../types";
import { commands } from "../lib/commands";

interface EventStore {
  events: CalendarEvent[];
  loading: boolean;
  load: () => Promise<void>;
}

export const useEventStore = create<EventStore>((set) => {
  listen<CalendarEvent[]>("events-changed", (event) => {
    set({ events: event.payload, loading: false });
  });

  return {
    events: [],
    loading: true,
    load: async () => {
      try {
        const events = await commands.getEvents();
        set({ events, loading: false });
      } catch {
        set({ loading: false });
      }
    },
  };
});
