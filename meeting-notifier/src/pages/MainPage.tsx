import { invoke } from "@tauri-apps/api/core";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import EventList from "../components/EventList";

interface Props {
  userEmail?: string;
}

function MainPage({ userEmail }: Props) {
  const { events, loading, error, refresh } = useCalendarEvents(true);

  const handleJoin = async (url: string) => {
    await invoke("open_meeting_url", { url });
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          {userEmail && (
            <p className="text-sm text-gray-400">{userEmail}</p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md transition disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      <EventList events={events} onJoin={handleJoin} />
    </div>
  );
}

export default MainPage;
