import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "../hooks/useSettings";
import { CalendarInfo, NotificationStyle } from "../types";

function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);

  useEffect(() => {
    invoke<CalendarInfo[]>("get_calendar_list")
      .then(setCalendars)
      .catch(console.error);
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-500">Loading settings...</div>;
  }

  const update = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) => {
    updateSettings({ ...settings, [key]: value });
  };

  const toggleCalendar = (id: string) => {
    const ids = settings.monitoredCalendarIds.includes(id)
      ? settings.monitoredCalendarIds.filter((c) => c !== id)
      : [...settings.monitoredCalendarIds, id];
    update("monitoredCalendarIds", ids);
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Settings</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notify before (minutes)
        </label>
        <input
          type="number"
          min={1}
          max={60}
          value={settings.notifyMinutesBefore}
          onChange={(e) => update("notifyMinutesBefore", Number(e.target.value))}
          className="w-24 px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notification style
        </label>
        <select
          value={settings.notificationStyle}
          onChange={(e) =>
            update("notificationStyle", e.target.value as NotificationStyle)
          }
          className="px-3 py-2 border rounded-lg"
        >
          <option value="window">Floating window</option>
          <option value="fullscreen">Fullscreen</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="sound"
          checked={settings.soundEnabled}
          onChange={(e) => update("soundEnabled", e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="sound" className="text-sm text-gray-700">
          Notification sound
        </label>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autostart"
          checked={settings.autostartEnabled}
          onChange={(e) => update("autostartEnabled", e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="autostart" className="text-sm text-gray-700">
          Launch at startup
        </label>
      </div>

      {calendars.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monitored calendars
          </label>
          <div className="space-y-2">
            {calendars.map((cal) => (
              <div key={cal.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.monitoredCalendarIds.includes(cal.id)}
                  onChange={() => toggleCalendar(cal.id)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  {cal.summary}
                  {cal.primary && (
                    <span className="ml-1 text-xs text-gray-400">(primary)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
