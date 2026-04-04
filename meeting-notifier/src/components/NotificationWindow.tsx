import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CalendarEvent } from "../types";

function NotificationWindow() {
  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  useEffect(() => {
    invoke<CalendarEvent>("get_notification_event")
      .then(setEvent)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!event) return;
    const update = () => {
      const mins = Math.max(
        0,
        Math.round((new Date(event.startTime).getTime() - Date.now()) / 60000),
      );
      setRemainingMinutes(mins);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [event]);

  const handleJoin = async () => {
    if (event?.meetingUrl) {
      await invoke("open_meeting_url", { url: event.meetingUrl });
    }
    await getCurrentWindow().close();
  };

  const handleDismiss = async () => {
    await getCurrentWindow().close();
  };

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen bg-black/90 text-white">
        Loading...
      </div>
    );
  }

  const startTime = new Date(event.startTime).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="text-center max-w-lg w-full">
        <div className="text-6xl mb-6">🔔</div>

        <p className="text-blue-300 text-lg mb-2">Meeting starting soon</p>

        <h1 className="text-4xl font-bold mb-4 leading-tight">{event.title}</h1>

        <div className="text-gray-300 text-xl mb-2">{startTime}</div>

        <div className="text-5xl font-bold text-yellow-400 mb-8">
          {remainingMinutes === 0 ? "NOW" : `${remainingMinutes} min`}
        </div>

        <div className="flex gap-4 justify-center">
          {event.meetingUrl && (
            <button
              onClick={handleJoin}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-2xl transition transform hover:scale-105"
            >
              Join Meeting
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-500 text-white text-xl font-bold rounded-2xl transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationWindow;
