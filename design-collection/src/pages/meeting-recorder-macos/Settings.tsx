import { Link } from 'react-router-dom';
import { ArrowLeft, FolderOpen, Mic, Waves } from 'lucide-react';

const inputs = [
  {
    label: 'Self Mic',
    device: 'MacBook Pro Microphone',
  },
  {
    label: 'Remote Audio',
    device: 'Meeting Output (Loopback)',
  },
];

export default function MeetingRecorderMacosSettings() {
  return (
    <div className="min-h-screen bg-[#f4f3f2] text-slate-900">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,219,204,0.65),transparent_45%),radial-gradient(circle_at_top_right,rgba(198,224,255,0.6),transparent_50%),radial-gradient(circle_at_bottom,rgba(227,221,255,0.5),transparent_55%)]" />

        <div className="relative w-full max-w-[860px] rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">Settings</p>
              <h1 className="mt-2 text-xl font-semibold text-slate-900 [font-family:'SF_Pro_Display']">
                Recorder Preferences
              </h1>
            </div>
            <Link
              to="/meeting-recorder-macos"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Storage</p>
                  <h2 className="mt-2 text-base font-semibold text-slate-900">Recording Folder</h2>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                /Users/yosuke/Recordings/Meeting
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700"
              >
                <FolderOpen className="h-4 w-4" />
                Change folder
              </button>
            </section>

            <section className="rounded-[26px] border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Mic className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Input</p>
                  <h2 className="mt-2 text-base font-semibold text-slate-900">Audio Sources</h2>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {inputs.map((input) => (
                  <div
                    key={input.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{input.label}</p>
                      <p className="text-sm font-medium text-slate-900">{input.device}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Active
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700"
              >
                <Waves className="h-4 w-4" />
                Input monitoring
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
