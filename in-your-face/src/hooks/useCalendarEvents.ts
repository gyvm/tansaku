import { useEffect } from "react";
import { useEventStore } from "../stores/eventStore";

export function useCalendarEvents() {
  const events = useEventStore((s) => s.events);
  const loading = useEventStore((s) => s.loading);
  const load = useEventStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading };
}
