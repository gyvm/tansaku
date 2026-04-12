import { useState, useEffect } from "react";

export function useCountdown(targetTimestamp: number) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = targetTimestamp - now;
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);

  const minutes = Math.floor(absDiff / 60);
  const seconds = absDiff % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { minutes, seconds, formatted, isOverdue, totalSeconds: diff };
}
