import { AlertCircle } from "lucide-react";

interface PermissionAlertProps {
  show: boolean;
  onOpenSettings: () => void;
}

export function PermissionAlert({ show, onOpenSettings }: PermissionAlertProps) {
  if (!show) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <div>
          <p className="text-xs font-medium text-amber-700">Permissions missing</p>
          <p className="mt-1 text-[10px] leading-relaxed text-amber-600">
            Allow Microphone and Screen Recording access in System Settings.
          </p>
          <button
            onClick={onOpenSettings}
            className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-600"
          >
            Open Settings
          </button>
        </div>
      </div>
    </div>
  );
}
