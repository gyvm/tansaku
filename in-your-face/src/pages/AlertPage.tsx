import { useState, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { CalendarEvent } from "../types";
import AlertOverlay from "../components/alert/AlertOverlay";
import { commands } from "../lib/commands";

export default function AlertPage() {
  const [event, setEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    commands.getAlertEvent().then((ev) => {
      if (ev) setEvent(ev);
    });
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
          if (event) {
            handleDismiss();
          } else {
            getCurrentWindow().close();
          }
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
        <p className="text-gray-500 text-sm absolute bottom-8">Press Escape to close</p>
      </div>
    );
  }

  return <AlertOverlay event={event} onJoin={handleJoin} onSnooze={handleSnooze} onDismiss={handleDismiss} />;
}
