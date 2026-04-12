import { useEffect, useState } from "react";
import { commands } from "../../lib/commands";
import { useSettingsStore } from "../../stores/settingsStore";
import type { CalendarInfo } from "../../types";

export default function CalendarPicker() {
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const { settings, update } = useSettingsStore();

  useEffect(() => {
    commands.getCalendarList().then(setCalendars).catch(console.error);
  }, []);

  const toggleCalendar = (id: string, checked: boolean) => {
    if (!settings) return;
    const selected = checked
      ? [...settings.selectedCalendars, id]
      : settings.selectedCalendars.filter((c) => c !== id);
    update({ ...settings, selectedCalendars: selected });
  };

  if (calendars.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Calendars</h2>
      {calendars.map((cal) => (
        <label key={cal.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings?.selectedCalendars.includes(cal.id) ?? false}
            onChange={(e) => toggleCalendar(cal.id, e.target.checked)}
          />
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: cal.color }}
          />
          <span>{cal.name}</span>
        </label>
      ))}
    </section>
  );
}
