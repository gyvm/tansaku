import { useSettingsStore } from "../../stores/settingsStore";

const options = [1, 2, 5, 10, 15];

export default function AlertTimingSection() {
  const { settings, update } = useSettingsStore();
  if (!settings) return null;

  const toggle = (minutes: number) => {
    const current = settings.alertMinutesBefore;
    const next = current.includes(minutes)
      ? current.filter((m) => m !== minutes)
      : [...current, minutes].sort((a, b) => a - b);

    if (next.length === 0) return;
    update({ ...settings, alertMinutesBefore: next });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        Alert before meeting
      </h2>
      <div className="flex gap-2 flex-wrap">
        {options.map((min) => (
          <button
            key={min}
            onClick={() => toggle(min)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              settings.alertMinutesBefore.includes(min)
                ? "bg-blue-600 text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {min} min
          </button>
        ))}
      </div>
    </section>
  );
}
