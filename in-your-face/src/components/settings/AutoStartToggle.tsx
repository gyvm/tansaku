import { useState, useEffect } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useSettingsStore } from "../../stores/settingsStore";

export default function AutoStartToggle() {
  const { settings, update } = useSettingsStore();
  const [autoStart, setAutoStart] = useState(false);

  useEffect(() => {
    isEnabled().then(setAutoStart);
  }, []);

  const toggle = async () => {
    if (autoStart) {
      await disable();
    } else {
      await enable();
    }
    const enabled = await isEnabled();
    setAutoStart(enabled);
    if (settings) {
      update({ ...settings, autoStart: enabled });
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Startup</h2>
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={toggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            autoStart ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
              autoStart ? "translate-x-6" : ""
            }`}
          />
        </div>
        <span className="text-[var(--text-primary)]">Start on login</span>
      </label>
    </section>
  );
}
