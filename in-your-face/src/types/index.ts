export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: number;
  endTime: number;
  calendarId: string;
  calendarName: string;
  location?: string;
  conferenceUrl?: string;
  conferenceType?: ConferenceType;
  organizer?: string;
  isAllDay: boolean;
}

export type ConferenceType =
  | "Zoom"
  | "GoogleMeet"
  | "Teams"
  | "Webex"
  | "GoToMeeting"
  | "Other";

export interface UserSettings {
  alertMinutesBefore: number[];
  selectedCalendars: string[];
  theme: "Dark" | "Light" | "System";
  autoStart: boolean;
  snoozeMinutes: number;
  pollIntervalSeconds: number;
}

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  primary: boolean;
}
