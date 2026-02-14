import { Pause, Flag, Square } from "lucide-react";
import clsx from "clsx";

type RecordingStatus = "idle" | "preparing" | "recording" | "stopping" | "error";

interface TransportControlsProps {
  status: RecordingStatus;
  onStart: () => void;
  onStop: () => void;
  canStart: boolean;
}

export function TransportControls({ status, onStart, onStop, canStart }: TransportControlsProps) {
  const isRecordingOrStopping = status === "recording" || status === "preparing" || status === "stopping";

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-[clamp(20px,6vw,40px)]">
        {/* Pause button - 未実装のため無効化 */}
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300 shadow-inner cursor-not-allowed opacity-50"
        >
          <Pause className="h-5 w-5" />
        </button>
        
        {/* Record/Stop button */}
        {isRecordingOrStopping ? (
          <button
            onClick={onStop}
            disabled={status === "stopping"}
            className={clsx(
              "inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_12px_24px_rgba(239,68,68,0.4)] transition",
              status === "stopping" ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5",
            )}
          >
            <Square className="h-7 w-7" />
          </button>
        ) : (
          <button
            onClick={onStart}
            disabled={!canStart}
            className={clsx(
              "inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_12px_24px_rgba(239,68,68,0.4)] transition",
              !canStart
                ? "opacity-40 cursor-not-allowed"
                : "hover:-translate-y-0.5",
            )}
          >
            <Square className="h-7 w-7" />
          </button>
        )}
        
        {/* Flag button - 未実装のため無効化 */}
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300 shadow-inner cursor-not-allowed opacity-50"
        >
          <Flag className="h-5 w-5" />
        </button>
      </div>
      
      {/* Status text - preparing/stopping時に表示 */}
      {(status === "preparing" || status === "stopping") && (
        <p className="text-xs text-slate-400 min-h-[16px]">
          {status === "preparing" && "準備中..."}
          {status === "stopping" && "保存中..."}
        </p>
      )}
    </div>
  );
}
