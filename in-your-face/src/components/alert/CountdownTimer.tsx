import { useCountdown } from "../../hooks/useCountdown";

interface Props {
  targetTimestamp: number;
}

export default function CountdownTimer({ targetTimestamp }: Props) {
  const { formatted, isOverdue } = useCountdown(targetTimestamp);

  return (
    <div className={`text-7xl font-mono font-bold ${isOverdue ? "text-red-400" : "text-white"}`}>
      {isOverdue ? `+${formatted}` : formatted}
    </div>
  );
}
