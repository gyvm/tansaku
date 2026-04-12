import type { CalendarEvent } from "../../types";
import EventCard from "./EventCard";
import CountdownTimer from "./CountdownTimer";
import JoinButton from "./JoinButton";
import SnoozeButton from "./SnoozeButton";

interface Props {
  event: CalendarEvent;
  onJoin: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

export default function AlertOverlay({ event, onJoin, onSnooze, onDismiss }: Props) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-black flex items-center justify-center animate-fade-in">
      <div className="max-w-2xl w-full mx-8 text-center space-y-8">
        <CountdownTimer targetTimestamp={event.startTime} />

        <EventCard event={event} />

        <div className="flex gap-4 justify-center">
          {event.conferenceUrl && (
            <JoinButton onClick={onJoin} conferenceType={event.conferenceType} />
          )}
          <SnoozeButton onClick={onSnooze} />
          <button
            onClick={onDismiss}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white text-xl rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>

        <div className="text-gray-500 text-sm space-x-6">
          {event.conferenceUrl && <span>Enter: Join</span>}
          <span>S: Snooze</span>
          <span>Esc: Dismiss</span>
        </div>
      </div>
    </div>
  );
}
