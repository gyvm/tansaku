import type { CalendarEvent, ConferenceType } from "../../types";

interface Props {
  event: CalendarEvent;
}

const platformLabel: Record<ConferenceType, string> = {
  Zoom: "Zoom Meeting",
  GoogleMeet: "Google Meet",
  Teams: "Microsoft Teams",
  Webex: "Webex Meeting",
  GoToMeeting: "GoTo Meeting",
  Other: "Video Meeting",
};

export default function EventCard({ event }: Props) {
  const startDate = new Date(event.startTime * 1000);
  const timeStr = startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 space-y-4">
      <h1 className="text-4xl font-bold text-white">{event.summary}</h1>
      <p className="text-2xl text-gray-300">{timeStr}</p>
      {event.organizer && (
        <p className="text-lg text-gray-400">Organized by {event.organizer}</p>
      )}
      {event.conferenceType && (
        <p className="text-lg text-blue-300">
          {platformLabel[event.conferenceType]}
        </p>
      )}
    </div>
  );
}
