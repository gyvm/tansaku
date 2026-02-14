import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { Mic, Monitor } from "lucide-react";
import { HeaderSection } from "../sections/HeaderSection";
import { AudioGroup } from "../sections/AudioGroup";
import { TransportControls } from "../sections/TransportControls";
import { TimerDisplay } from "../sections/TimerDisplay";
import { ErrorBanner } from "../sections/ErrorBanner";
import { PermissionAlert } from "../sections/PermissionAlert";
import { StorageSection } from "../sections/StorageSection";

type RecordingStatus = "idle" | "preparing" | "recording" | "stopping" | "error";

interface PermissionStatus {
  mic: boolean;
  screen: boolean;
}

export default function Recorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [timer, setTimer] = useState(0);
  const [savePath, setSavePath] = useState("~/Movies/AIniMVP/");
  const [includeMic] = useState(true);
  const [includeSys] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionStatus>({ mic: false, screen: false });

  const timerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkPermissions();
    invoke("get_default_save_path")
      .then((path) => setSavePath(path as string))
      .catch(() => {}); // Ignore error if command not found
  }, []);

  useEffect(() => {
    const resizeWindow = async () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const width = Math.ceil(container.scrollWidth);
        const height = Math.ceil(container.scrollHeight);
        
        try {
          const window = getCurrentWindow();
          await window.setSize(new LogicalSize(width, height));
        } catch (e) {
          console.error("Failed to resize window", e);
        }
      }
    };

    // Initial resize
    const timer = setTimeout(resizeWindow, 100);

    return () => clearTimeout(timer);
  }, [errorMessage, permissions, status]);

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
        includeMic,
        includeSys,
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

  const isActive = status === "recording";

  const micWaveHeights = [14, 28, 50, 32, 22, 54, 46, 20, 36, 18, 30, 56, 22, 18, 38, 16];
  const sysWaveHeights = [10, 16, 22, 14, 12, 20, 18, 12, 16, 10, 20, 14, 12, 10, 16, 12];
  const micWaveOpacity = [0.35, 0.45, 0.95, 0.55, 0.4, 0.9, 0.8, 0.35, 0.6, 0.35, 0.5, 0.95, 0.45, 0.35, 0.55, 0.3];
  const sysWaveOpacity = [0.25, 0.35, 0.5, 0.35, 0.3, 0.45, 0.4, 0.3, 0.35, 0.25, 0.45, 0.35, 0.3, 0.25, 0.35, 0.3];

  return (
    <main className="bg-white text-slate-900">
      <div ref={containerRef} className="w-full bg-white px-[clamp(12px,2.5vw,28px)] py-[clamp(12px,2.5vh,24px)] flex flex-col gap-[clamp(12px,2.2vh,24px)]">
        <HeaderSection title="Weekly Sync - Engineering" />

        <div className="h-px bg-slate-200" />

        <div className="space-y-[clamp(20px,4vh,32px)]">
          <AudioGroup
            icon={Mic}
            label="Internal Microphone"
            statusLabel={isActive ? "Live" : "Idle"}
            isActive={isActive}
            waveHeights={micWaveHeights}
            waveOpacity={micWaveOpacity}
            waveColor="rgba(239, 68, 68, $OPACITY)"
          />

          <AudioGroup
            icon={Monitor}
            label="System Audio"
            statusLabel="Monitoring"
            isActive={isActive}
            waveHeights={sysWaveHeights}
            waveOpacity={sysWaveOpacity}
            waveColor="rgba(148, 163, 184, $OPACITY)"
          />
        </div>

        <TransportControls
          status={status}
          onStart={handleStart}
          onStop={handleStop}
          canStart={!((!permissions.mic && includeMic) || (!permissions.screen && includeSys))}
        />

        <TimerDisplay seconds={timer} />

        <ErrorBanner message={errorMessage} />

        <PermissionAlert
          show={(!permissions.mic && includeMic) || (!permissions.screen && includeSys)}
          onOpenSettings={() => invoke("open_permissions_settings")}
        />

        <StorageSection path={savePath} onOpenFolder={handleOpenFolder} />
      </div>
    </main>
  );
}
