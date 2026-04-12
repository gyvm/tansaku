import { useCallback, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useTauriEvent } from "../hooks/useTauriEvent";
import { useTheme } from "../hooks/useTheme";
import AccountSection from "../components/settings/AccountSection";
import CalendarPicker from "../components/settings/CalendarPicker";
import AlertTimingSection from "../components/settings/AlertTimingSection";
import ThemeSection from "../components/settings/ThemeSection";
import AutoStartToggle from "../components/settings/AutoStartToggle";

export default function SettingsPage() {
  const { loading, load } = useSettingsStore();
  const { isAuthenticated, checkStatus } = useAuthStore();

  useTheme();

  useEffect(() => {
    load();
    checkStatus();
  }, []);

  const handleAuthChanged = useCallback(
    (payload: { isAuthenticated: boolean }) => {
      useAuthStore.getState().setAuthenticated(payload.isAuthenticated);
    },
    [],
  );

  useTauriEvent("auth-changed", handleAuthChanged);

  if (loading) {
    return (
      <div className="p-8 bg-[var(--bg-primary)] min-h-screen">
        <p className="text-[var(--text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[var(--bg-primary)] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">In Your Face</h1>
        <p className="text-sm text-[var(--text-secondary)]">Meeting Reminder Settings</p>
      </div>

      <AccountSection />
      {isAuthenticated && <CalendarPicker />}
      <AlertTimingSection />
      <ThemeSection />
      <AutoStartToggle />

      <div className="pt-4 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-secondary)]">In Your Face v0.1.0</p>
      </div>
    </div>
  );
}
