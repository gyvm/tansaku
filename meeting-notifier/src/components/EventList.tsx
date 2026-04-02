import { CalendarEvent } from "../types";
import EventCard from "./EventCard";

interface Props {
  events: CalendarEvent[];
  onJoin: (url: string) => void;
}

function EventList({ events, onJoin }: Props) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">🎉</div>
        <p>No upcoming meetings</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onJoin={onJoin} />
      ))}
    </div>
  );
}

export default EventList;
