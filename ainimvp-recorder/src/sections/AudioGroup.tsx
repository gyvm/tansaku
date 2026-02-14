import { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface AudioGroupProps {
  icon: LucideIcon;
  label: string;
  statusLabel: string;
  isActive: boolean;
  waveHeights: number[];
  waveOpacity: number[];
  waveColor: string;
}

export function AudioGroup({
  icon: Icon,
  label,
  statusLabel,
  isActive,
  waveHeights,
  waveOpacity,
  waveColor,
}: AudioGroupProps) {
  return (
    <section className="space-y-[clamp(14px,2.8vh,28px)]">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </div>
        <span className={clsx("text-xs font-semibold uppercase tracking-[0.2em]", isActive ? "text-red-500" : "text-slate-300")}>
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center justify-center gap-3">
        {waveHeights.map((height, index) => (
          <span
            key={`wave-${index}`}
            className={clsx("wave-bar", isActive && "wave-active")}
            style={{
              height: `${height}px`,
              backgroundColor: `${waveColor.replace("$OPACITY", String(isActive ? waveOpacity[index] : 0.25))}`,
              animationDelay: `${index * 0.08}s`,
            }}
          />
        ))}
      </div>
    </section>
  );
}
