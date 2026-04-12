import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import type { CalendarEvent } from "../types";
import AlertOverlay from "../components/alert/AlertOverlay";
import { commands } from "../lib/commands";

export default function AlertPage() {
  const [event, setEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const unlisten = listen<CalendarEvent>("alert-show", (e) => {
      setEvent(e.payload);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleJoin = useCallback(async () => {
    if (!event?.conferenceUrl) return;
    await commands.joinMeeting(event.id, event.conferenceUrl);
  }, [event]);

  const handleSnooze = useCallback(async () => {
    if (!event) return;
    await commands.snoozeAlert(event.id, 5);
  }, [event]);

  const handleDismiss = useCallback(async () => {
    if (!event) return;
    await commands.dismissAlert(event.id);
  }, [event]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
          if (event?.conferenceUrl) handleJoin();
          break;
        case "Escape":
          handleDismiss();
          break;
        case "s":
        case "S":
          handleSnooze();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [event, handleJoin, handleSnooze, handleDismiss]);

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-white text-xl">Waiting for alert...</p>
      </div>
    );
  }

  return <AlertOverlay event={event} onJoin={handleJoin} onSnooze={handleSnooze} onDismiss={handleDismiss} />;
}
