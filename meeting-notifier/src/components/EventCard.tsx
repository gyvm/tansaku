import { CalendarEvent } from "../types";

interface Props {
  event: CalendarEvent;
  onJoin?: (url: string) => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesUntil(isoString: string): number {
  return Math.round((new Date(isoString).getTime() - Date.now()) / 60000);
}

function EventCard({ event, onJoin }: Props) {
  const mins = minutesUntil(event.startTime);
  const isImminent = mins >= 0 && mins <= 10;
  const isPast = mins < 0;

  return (
    <div
      className={`p-4 rounded-xl border transition ${
        isImminent
          ? "border-red-300 bg-red-50"
          : isPast
            ? "border-gray-200 bg-gray-50 opacity-60"
            : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{event.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </p>
          {!isPast && (
            <p
              className={`text-sm mt-1 ${isImminent ? "text-red-600 font-semibold" : "text-gray-400"}`}
            >
              {mins === 0 ? "Now" : mins > 0 ? `in ${mins} min` : ""}
            </p>
          )}
        </div>
        {event.meetingUrl && (
          <button
            onClick={() => onJoin?.(event.meetingUrl!)}
            className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );
}

export default EventCard;
