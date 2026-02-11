import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Mic, Monitor, FolderOpen, AlertCircle } from "lucide-react";
import clsx from "clsx";

type RecordingStatus = "idle" | "preparing" | "recording" | "stopping" | "error";

interface PermissionStatus {
  mic: boolean;
  screen: boolean;
}

interface SystemInfo {
  os: string;
  version: string;
  supported: boolean;
  minimum: string;
}

function App() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [timer, setTimer] = useState(0);
  const [savePath, setSavePath] = useState("~/Movies/AIniMVP/");
  const [includeMic, setIncludeMic] = useState(true);
  const [includeSys, setIncludeSys] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionStatus>({ mic: false, screen: false });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    checkPermissions();
    invoke<SystemInfo>("get_system_info")
      .then((info) => setSystemInfo(info))
      .catch(() => setSystemInfo({ os: "unknown", version: "unknown", supported: true, minimum: "20.0" }));
    invoke("get_default_save_path")
      .then((path) => setSavePath(path as string))
      .catch(() => {}); // Ignore error if command not found
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await invoke<PermissionStatus>("get_permission_status");
      setPermissions(status);
    } catch (e) {
      console.error("Failed to check permissions", e);
      // Fallback for UI dev without backend
      setPermissions({ mic: true, screen: true });
    }
  };

  const startTimer = () => {
    setTimer(0);
    timerRef.current = window.setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleStart = async () => {
    setErrorMessage(null);
    setStatus("preparing");
    try {
      await invoke("start_recording", {
        path: savePath,
        include_mic: includeMic,
        include_sys: includeSys,
      });
      setStatus("recording");
      startTimer();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMessage(String(e));
    }
  };

  const handleStop = async () => {
    setStatus("stopping");
    try {
      await invoke("stop_recording");
      setStatus("idle");
      stopTimer();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setErrorMessage(String(e));
      stopTimer();
    }
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: savePath });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      await invoke("request_permissions");
    } catch (e) {
      console.error(e);
    } finally {
      window.setTimeout(checkPermissions, 500);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isRecordingOrStopping = status === "recording" || status === "preparing" || status === "stopping";
  const systemSupported = systemInfo?.supported ?? true;

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Header / Drag Region */}
      <div data-tauri-drag-region className="h-8 flex items-center justify-center bg-zinc-950/50 border-b border-zinc-800 text-xs text-zinc-500 select-none">
        AIniMVP Recorder
      </div>

      <div className="flex-1 flex flex-col p-6 gap-6">
        {/* Status Display */}
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <div className={clsx("text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-full border transition-colors duration-300", {
            "bg-zinc-800 border-zinc-700 text-zinc-400": status === "idle",
            "bg-blue-900/30 border-blue-500/50 text-blue-400 animate-pulse": status === "preparing",
            "bg-red-900/30 border-red-500/50 text-red-400 animate-pulse": status === "recording",
            "bg-yellow-900/30 border-yellow-500/50 text-yellow-400": status === "stopping",
            "bg-red-950 border-red-800 text-red-500": status === "error",
          })}>
            {status}
          </div>
          <div className="text-5xl font-mono font-light tracking-tight tabular-nums text-zinc-50">
            {formatTime(timer)}
          </div>
          {errorMessage && (
            <div className="text-xs text-red-400 mt-2 max-w-[280px] text-center break-words bg-red-950/50 p-2 rounded border border-red-900/50">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 py-2">
          {isRecordingOrStopping ? (
            <button
              onClick={handleStop}
              disabled={status === "stopping"}
              className={clsx("group relative flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800 border border-zinc-700 shadow-lg transition-all",
                status === "stopping" ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-700 active:bg-zinc-600"
              )}
            >
              <div className="w-8 h-8 rounded-sm bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-90 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!systemSupported || (!permissions.mic && includeMic) || (!permissions.screen && includeSys)}
              className={clsx("group relative flex items-center justify-center w-20 h-20 rounded-full bg-zinc-100 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all",
                (!systemSupported || (!permissions.mic && includeMic) || (!permissions.screen && includeSys)) ? "opacity-30 cursor-not-allowed bg-zinc-500" : "hover:bg-zinc-200 active:bg-zinc-300"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-red-600 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* Settings / Toggles */}
        <div className="flex flex-col gap-0 bg-zinc-800/30 rounded-xl border border-zinc-800/50 overflow-hidden">
          <label className={clsx("flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors", !permissions.mic && "opacity-80")}>
            <div className="flex items-center gap-3">
              <Mic className={clsx("w-4 h-4 transition-colors", includeMic ? "text-zinc-200" : "text-zinc-500")} />
              <div className="flex flex-col">
                <span className={clsx("text-sm transition-colors", includeMic ? "text-zinc-200" : "text-zinc-500")}>Microphone</span>
                {!permissions.mic && <span className="text-[10px] text-red-400">Permission Required</span>}
              </div>
            </div>
            <input
                type="checkbox"
                checked={includeMic}
                onChange={(e) => setIncludeMic(e.target.checked)}
                className="accent-blue-500 w-4 h-4 rounded-sm border-zinc-600 bg-zinc-700"
            />
          </label>
          <div className="h-px bg-zinc-800/50 w-full" />
          <label className={clsx("flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors", !permissions.screen && "opacity-80")}>
            <div className="flex items-center gap-3">
              <Monitor className={clsx("w-4 h-4 transition-colors", includeSys ? "text-zinc-200" : "text-zinc-500")} />
              <div className="flex flex-col">
                <span className={clsx("text-sm transition-colors", includeSys ? "text-zinc-200" : "text-zinc-500")}>System Audio</span>
                 {!permissions.screen && <span className="text-[10px] text-red-400">Permission Required</span>}
              </div>
            </div>
             <input
                 type="checkbox"
                 checked={includeSys}
                 onChange={(e) => setIncludeSys(e.target.checked)}
                 className="accent-blue-500 w-4 h-4 rounded-sm border-zinc-600 bg-zinc-700"
             />
          </label>
        </div>

        {/* Permissions Warning */}
        {!systemSupported && systemInfo && (
          <div className="bg-amber-950/30 border border-amber-900/30 p-3 rounded-lg flex items-start gap-3 mt-[-10px]">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-xs text-amber-200 font-medium">Unsupported macOS Version</p>
              <p className="text-[10px] text-amber-400/80 leading-relaxed">
                This app requires macOS {systemInfo.minimum}+ to support System Audio Recording Only.
                Current: macOS {systemInfo.version}.
              </p>
            </div>
          </div>
        )}
        {systemSupported && ((!permissions.mic && includeMic) || (!permissions.screen && includeSys)) && (
          <div className="bg-amber-950/30 border border-amber-900/30 p-3 rounded-lg flex items-start gap-3 mt-[-10px]">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-xs text-amber-200 font-medium">Permissions Missing</p>
              <p className="text-[10px] text-amber-400/80 leading-relaxed">
                Please allow Microphone and Screen Recording access in System Settings to capture audio.
              </p>
              <button
                onClick={() => invoke("open_permissions_settings")}
                className="text-[10px] text-amber-500 underline self-start hover:text-amber-400 mt-1 cursor-pointer"
              >
                Open System Settings
              </button>
              <button
                onClick={handleRequestPermissions}
                className="text-[10px] text-amber-500 underline self-start hover:text-amber-400 mt-1 cursor-pointer"
              >
                Request Permissions
              </button>
            </div>
          </div>
        )}

        {/* Save Path */}
        <div className="mt-auto">
            <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-semibold pl-1">Save Location</div>
            <div className="flex items-center gap-2 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800 group hover:border-zinc-700 transition-colors">
                <div className="flex-1 truncate text-xs text-zinc-400 font-mono select-all" title={savePath}>
                    {savePath}
                </div>
                <button
                    onClick={handleOpenFolder}
                    className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Open Folder"
                >
                    <FolderOpen className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
