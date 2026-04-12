import { useCallback, useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useTauriEvent } from "../hooks/useTauriEvent";
import AccountSection from "../components/settings/AccountSection";
import CalendarPicker from "../components/settings/CalendarPicker";

export default function SettingsPage() {
  const { settings, loading, load } = useSettingsStore();
  const { isAuthenticated, checkStatus } = useAuthStore();

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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">In Your Face</h1>
      <div className="text-sm text-gray-500">Settings</div>

      <AccountSection />

      {isAuthenticated && <CalendarPicker />}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Alert Timing</h2>
        <p className="text-gray-600">
          Alert {settings?.alertMinutesBefore.join(", ")} minutes before
        </p>
      </section>
    </div>
  );
}
