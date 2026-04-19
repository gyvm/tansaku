import { useSettingsStore } from "../../stores/settingsStore";

const themes = ["Light", "Dark", "System"] as const;

export default function ThemeSection() {
  const { settings, update } = useSettingsStore();
  if (!settings) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Theme</h2>
      <div className="flex gap-3">
        {themes.map((theme) => (
          <button
            key={theme}
            onClick={() => update({ ...settings, theme })}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              settings.theme === theme
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)] hover:border-blue-400"
            }`}
          >
            {theme}
          </button>
        ))}
      </div>
    </section>
  );
}
