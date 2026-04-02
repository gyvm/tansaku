export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  calendarId: string;
}

export interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
}

export type NotificationStyle = "fullscreen" | "window";

export interface AppSettings {
  notifyMinutesBefore: number;
  notificationStyle: NotificationStyle;
  soundEnabled: boolean;
  autostartEnabled: boolean;
  monitoredCalendarIds: string[];
  pollingIntervalSeconds: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  userEmail?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifyMinutesBefore: 5,
  notificationStyle: "window",
  soundEnabled: true,
  autostartEnabled: false,
  monitoredCalendarIds: [],
  pollingIntervalSeconds: 300,
};
