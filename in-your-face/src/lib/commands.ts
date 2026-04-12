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
  dismissAlert: (eventId: string) =>
    invoke("dismiss_alert", { eventId }),
  snoozeAlert: (eventId: string, minutes: number) =>
    invoke("snooze_alert", { eventId, minutes }),
  joinMeeting: (eventId: string, url: string) =>
    invoke("join_meeting", { eventId, url }),
};
