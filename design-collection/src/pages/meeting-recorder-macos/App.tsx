import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Mic, Pause, Pencil, Settings, Square, Timer, Waves } from 'lucide-react';

const recordings = [
  {
    id: 'rec-240214-1',
    title: 'Weekly Sync - Design',
    time: '2026/02/14 10:04',
    duration: '32:18',
  },
  {
    id: 'rec-240213-2',
    title: 'Client Review - Sprint 08',
    time: '2026/02/13 17:45',
    duration: '41:02',
  },
  {
    id: 'rec-240212-3',
    title: 'All Hands',
    time: '2026/02/12 09:02',
    duration: '58:11',
  },
];

export default function MeetingRecorderMacosApp() {
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(1934);
  const isActive = isRecording && !isPaused;

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRecording]);

  const formatElapsed = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((value) => value.toString().padStart(2, '0'))
      .join(':');
  };

  const statusLabel = isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Stopped';
  return (
    <div className="min-h-screen bg-[#f7f2ef] text-slate-900">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),transparent_60%),radial-gradient(circle_at_bottom,rgba(235,227,220,0.85),transparent_70%)]" />

        <div className="relative w-full max-w-[860px] rounded-[34px] border border-slate-200/80 bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,0.14)]">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.45em] text-slate-400">Recorders</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 [font-family:'SF_Pro_Display']">
                Online Meeting Recorder
              </h1>
            </div>
            <Link
              to="/meeting-recorder-macos/settings"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white bg-white text-slate-500 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:text-slate-700 active:scale-95"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.35em] text-slate-400">Session Title</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 [font-family:'SF_Pro_Display']">
                    Weekly Sync - Engineering
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-700 active:scale-95"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 h-px bg-slate-200" />

              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <span>Internal Microphone</span>
                    </div>
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                        isActive ? 'text-red-500' : 'text-slate-400'
                      }`}
                    >
                      {isActive ? 'Live' : statusLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex h-20 items-end justify-center gap-2 rounded-2xl border border-slate-200 bg-[#fff7f6] px-4">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span
                        key={`wave-mic-${index}`}
                        className={`wave-line w-1 rounded-full bg-gradient-to-t from-rose-400 via-red-300 to-orange-200 ${
                          isActive ? 'wave-active' : 'wave-idle'
                        }`}
                        style={{
                          height: `${isActive ? 14 + (index % 6) * 8 : 8 + (index % 6) * 3}px`,
                          animationDelay: `${index * 0.09}s`,
                          animationPlayState: isActive ? 'running' : 'paused',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Waves className="h-4 w-4" />
                      <span>System Audio</span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {isActive ? 'Monitoring' : 'Idle'}
                    </span>
                  </div>
                  <div className="mt-3 flex h-16 items-end justify-center gap-2 rounded-2xl border border-slate-200 bg-[#f5f6fb] px-4">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <span
                        key={`wave-system-${index}`}
                        className={`wave-line w-1 rounded-full bg-gradient-to-t from-slate-400 via-slate-300 to-slate-200 ${
                          isActive ? 'wave-active' : 'wave-idle'
                        }`}
                        style={{
                          height: `${isActive ? 10 + (index % 6) * 5 : 6 + (index % 6) * 2}px`,
                          animationDelay: `${index * 0.1}s`,
                          animationPlayState: isActive ? 'running' : 'paused',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-center gap-10">
                <button
                  type="button"
                  disabled={!isRecording}
                  onClick={() => setIsPaused((current) => !current)}
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-full border bg-[#f2f2f2] text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition active:scale-95 ${
                    isRecording
                      ? 'border-white hover:-translate-y-0.5'
                      : 'border-slate-100 text-slate-300'
                  }`}
                >
                  <Pause className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecording((current) => !current);
                    setIsPaused(false);
                  }}
                  className={`inline-flex h-24 w-24 items-center justify-center rounded-full border-4 text-white shadow-[0_18px_30px_rgba(239,68,68,0.35)] transition active:scale-95 ${
                    isRecording
                      ? 'border-red-100 bg-red-500 shadow-[0_20px_40px_rgba(239,68,68,0.45)]'
                      : 'border-emerald-100 bg-emerald-500 shadow-[0_20px_40px_rgba(16,185,129,0.45)]'
                  }`}
                >
                  <Square className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  disabled={!isRecording}
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-full border bg-[#f2f2f2] text-slate-600 shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition active:scale-95 ${
                    isRecording
                      ? 'border-white hover:-translate-y-0.5'
                      : 'border-slate-100 text-slate-300'
                  }`}
                >
                  <Flag className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 text-center">
                <span className="text-[32px] font-semibold tracking-[0.3em] text-slate-800">
                  {formatElapsed(elapsedSeconds)}
                </span>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">Recent</p>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">Latest Recordings</h3>
                </div>
                <span className="text-xs text-slate-400">3 files</span>
              </div>
              <div className="mt-4 space-y-3">
                {recordings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.time}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{item.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-slate-500">
                録音フォルダと入力設定は右上の歯車から変更できます。
              </p>
            </section>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wavePulse {
          0%, 100% {
            transform: scaleY(0.55);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1.2);
            opacity: 1;
          }
        }
        .wave-line {
          animation: wavePulse 1.4s ease-in-out infinite;
        }
        .wave-idle {
          opacity: 0.5;
          filter: grayscale(0.2);
        }
        .wave-active {
          filter: drop-shadow(0 6px 10px rgba(248, 113, 113, 0.25));
        }
      `}</style>
    </div>
  );
}
