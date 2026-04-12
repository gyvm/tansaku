import { invoke } from "@tauri-apps/api/core";
import type { CalendarEvent, CalendarInfo, UserSettings } from "../types";

export const commands = {
  getSettings: () => invoke<UserSettings>("get_settings"),
  updateSettings: (settings: UserSettings) =>
    invoke("update_settings", { settings }),
  startOAuthLogin: () => invoke("start_oauth_login"),
  logout: () => invoke("logout"),
  getAuthStatus: () => invoke<boolean>("get_auth_status"),
  getCalendarList: () => invoke<CalendarInfo[]>("get_calendar_list"),
  getEvents: () => invoke<CalendarEvent[]>("get_events"),
  forceSync: () => invoke("force_sync"),
};
