import React, { useMemo, useState } from 'react';
import {
  Moon,
  Sun,
  Upload,
  FolderPlus,
  LayoutDashboard,
  Play,
  FileText,
  Settings as SettingsIcon,
  Search,
  RefreshCcw,
  Download,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bell,
} from 'lucide-react';

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, children }) => {
  return (
    <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#141821] shadow-sm shadow-black/5 dark:shadow-black/20 p-6 space-y-3">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {description && <p className="text-sm text-black/60 dark:text-white/60">{description}</p>}
      </div>
      {children}
    </div>
  );
};

const colorTokens = [
  { name: 'Primary', value: '#3A6FF7', usage: 'Accents, primary actions' },
  { name: 'Background', value: '#F5F6F7', usage: 'App canvas, panels' },
  { name: 'Surface', value: '#FFFFFF', usage: 'Cards, sheets, popovers' },
  { name: 'Text', value: '#2B2D31', usage: 'Primary text' },
  { name: 'Border', value: '#D6D6D6', usage: 'Dividers, input outlines' },
  { name: 'Success', value: '#2FB171', usage: 'Positive states' },
  { name: 'Warning', value: '#F6B90D', usage: 'Alerts, pending' },
  { name: 'Error', value: '#E05656', usage: 'Critical, destructive' },
];

const buttonVariants = [
  { label: 'Primary', className: 'bg-[#3A6FF7] text-white hover:bg-[#345fe0]' },
  { label: 'Secondary', className: 'border border-black/10 dark:border-white/15 text-[#2B2D31] dark:text-white hover:bg-black/5 dark:hover:bg-white/5' },
  { label: 'Ghost', className: 'text-[#2B2D31] dark:text-white hover:bg-black/5 dark:hover:bg-white/5' },
  { label: 'Destructive', className: 'bg-[#E05656] text-white hover:bg-[#cc4a4a]' },
];

const navigationItems = [
  { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { icon: <FileText className="w-4 h-4" />, label: 'Projects' },
  { icon: <Upload className="w-4 h-4" />, label: 'Imports' },
  { icon: <SettingsIcon className="w-4 h-4" />, label: 'Settings' },
];

function ColorSwatch({ name, value, usage }: { name: string; value: string; usage: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-black/5 dark:border-white/10 p-3 bg-white dark:bg-[#1a1f29]">
      <div className="w-12 h-12 rounded-md shadow-inner" style={{ background: value }} />
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-black/60 dark:text-white/60">{value}</p>
        <p className="text-xs text-black/50 dark:text-white/50">{usage}</p>
      </div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="px-3 py-1 rounded-full text-xs bg-black/5 dark:bg-white/10 text-black/70 dark:text-white/70">{label}</span>;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  const palette = useMemo(
    () => ({
      canvas: darkMode ? 'bg-[#0c0f14]' : 'bg-[#F5F6F7]',
      text: darkMode ? 'text-white' : 'text-[#2B2D31]',
      muted: darkMode ? 'text-white/70' : 'text-black/65',
      card: darkMode ? 'bg-[#101622]' : 'bg-white',
    }),
    [darkMode]
  );

  return (
    <div className={`${palette.canvas} ${palette.text} min-h-screen transition-colors duration-300`}> 
      <header className={`sticky top-0 z-30 backdrop-blur-xl border-b border-black/5 dark:border-white/10 ${darkMode ? 'bg-[#0c0f14]/85' : 'bg-[#f5f6f7]/85'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#3A6FF7] to-[#274fb8] flex items-center justify-center text-white font-semibold shadow-sm">
              AL
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Auralog Design System</p>
              <p className={`text-sm ${palette.muted}`}>Calm, minimal workspace for AI meeting minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Pill label="Desktop • Windows + macOS" />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-black/5 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="text-sm font-medium">{darkMode ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className={`${palette.card} rounded-xl border border-black/5 dark:border-white/10 p-8 shadow-sm shadow-black/5 dark:shadow-black/30`}> 
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <div className="space-y-4 lg:w-7/12">
              <p className="text-sm uppercase tracking-[0.15em] text-[#3A6FF7]">Minimal Professional</p>
              <h1 className="text-3xl font-semibold tracking-tight">Turning raw audio into structured, reliable knowledge.</h1>
              <p className={`text-lg ${palette.muted}`}>
                Auralog is a calm, intelligent desktop app that ingests recordings and returns precise minutes, summaries, and action items. The design system below keeps the product neutral, efficient, and trustworthy.
              </p>
              <div className="flex flex-wrap gap-3">
                <Pill label="Rounded radius 6–8px" />
                <Pill label="Subtle depth + soft borders" />
                <Pill label="Inter / SF Pro / Segoe UI" />
              </div>
            </div>
            <div className="lg:w-5/12">
              <div className="rounded-lg border border-black/5 dark:border-white/10 bg-gradient-to-br from-white via-[#f5f6f7] to-[#e6e7e9] dark:from-[#0e141d] dark:via-[#0f1725] dark:to-[#0c101a] p-5 shadow-inner shadow-black/10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <Mic className="w-5 h-5 text-[#3A6FF7]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Import audio</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Lossless transcription and diarization</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <Sparkles className="w-5 h-5 text-[#3A6FF7]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Structured minutes</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Decisions, risks, and owners auto-extracted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-white/5 border border-black/5 dark:border-white/10">
                    <CheckCircle2 className="w-5 h-5 text-[#2FB171]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Share-ready</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Markdown, DOCX, and PDF exports</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <SectionCard title="Typography" description="Balanced hierarchy that mirrors drafting tools like Notion or Linear.">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-black/60 dark:text-white/60">
                <span>Inter / SF Pro / Segoe UI</span>
                <span>Tracking -1%</span>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-semibold tracking-tight">Title • 32px / 40</p>
                <p className="text-2xl font-semibold tracking-tight">H1 • 28px / 34</p>
                <p className="text-xl font-semibold tracking-tight">H2 • 24px / 30</p>
                <p className="text-lg font-semibold tracking-tight">H3 • 20px / 28</p>
                <p className="text-base font-medium">Body • 16px / 24</p>
                <p className="text-sm text-black/70 dark:text-white/70">Caption • 14px / 20</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-black/70 dark:text-white/70">
                <div className="p-3 rounded-md bg-black/5 dark:bg-white/5">Line height 1.4–1.6 for transcripts</div>
                <div className="p-3 rounded-md bg-black/5 dark:bg-white/5">Headings use 600–700 weight</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Color tokens" description="Neutral grays with a single blue accent. Light + dark friendly.">
            <div className="grid grid-cols-2 gap-3">
              {colorTokens.map((token) => (
                <ColorSwatch key={token.name} {...token} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Spacing & radius" description="Consistent rhythm keeps the interface calm.">
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-black/70 dark:text-white/70">
              <div className="space-y-2">
                <p className="font-semibold text-black/90 dark:text-white">Spacing scale</p>
                <div className="flex flex-wrap gap-2">
                  {[8, 12, 16, 20, 24, 32].map((size) => (
                    <div key={size} className="px-3 py-2 rounded-md bg-black/5 dark:bg-white/5">
                      {size}px
                    </div>
                  ))}
                </div>
                <p className="text-xs">Grid: 12-column, 72px max gutter. Panels 16–24px padding.</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-black/90 dark:text-white">Corners & shadows</p>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-lg bg-white dark:bg-[#1a1f29] border border-black/5 dark:border-white/10 shadow-sm" />
                  <div className="text-xs space-y-1">
                    <p>Radius 6–8px on inputs, 10px on modals.</p>
                    <p>Shadows: 0 8px 24px #0000000a.</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Responsive & motion" description="Optimized for narrow and wide desktop layouts.">
            <div className="grid gap-3 text-sm text-black/70 dark:text-white/70">
              <div className="flex gap-3 items-start">
                <div className="w-12 h-10 rounded-md bg-[#3A6FF7]/10 border border-[#3A6FF7]/20" />
                <div>
                  <p className="font-semibold text-black/90 dark:text-white">Adaptive panels</p>
                  <p>Sidebar collapses at 1080px; workspace stacks transcript and AI notes at 960px with anchored toolbar.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-12 h-10 rounded-md bg-black/5 dark:bg-white/10" />
                <div>
                  <p className="font-semibold text-black/90 dark:text-white">Motion guidance</p>
                  <p>Use 150–220ms fades/slide for modals and toasts. Progress indicator pulses subtly; hover states increase contrast by 6–8% only.</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-[#3A6FF7]">Component library</p>
              <h2 className="text-2xl font-semibold tracking-tight">Reusable primitives for Auralog</h2>
            </div>
            <Pill label="Light + Dark examples" />
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <SectionCard title="Buttons" description="Flat surfaces with subtle hover. Icon alignment is 14–16px.">
              <div className="flex flex-wrap gap-3">
                {buttonVariants.map((variant) => (
                  <button
                    key={variant.label}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${variant.className}`}
                  >
                    {variant.label}
                  </button>
                ))}
                <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 flex items-center gap-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                  <Upload className="w-4 h-4" />
                  Icon + Label
                </button>
                <button className="p-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5">
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Inputs" description="Soft borders and minimal focus ring (#3A6FF7 at 30% opacity).">
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Text field</label>
                  <input
                    className="rounded-md border border-[#D6D6D6] bg-white/80 dark:bg-[#0f141f] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#3A6FF7]/30"
                    placeholder="Search meetings, speakers, topics"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-md border border-dashed border-[#3A6FF7]/40 bg-[#3A6FF7]/5 dark:bg-[#3A6FF7]/10 p-3 text-sm">
                    Drag & drop upload zone
                  </div>
                  <div className="rounded-md border border-[#D6D6D6] dark:border-white/15 px-3 py-2 flex items-center justify-between text-sm">
                    <span>Language</span>
                    <span className="text-[#3A6FF7] font-medium">English (auto)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm mb-1 font-medium">Audio slider</p>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 relative overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-[#3A6FF7] w-1/2" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-[#3A6FF7] w-4 h-4 rounded" defaultChecked />
                    Speaker diarization
                  </label>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cards" description="Information-dense yet calm. 14–16px type with 12–16px padding.">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-black/5 dark:border-white/10 p-3 bg-white dark:bg-[#1a1f29] space-y-2">
                  <p className="text-sm font-semibold">Recording</p>
                  <p className="text-xs text-black/60 dark:text-white/60">Team sync — 42:10</p>
                  <div className="text-xs text-[#3A6FF7]">Ready for AI pass</div>
                </div>
                <div className="rounded-lg border border-black/5 dark:border-white/10 p-3 bg-white dark:bg-[#1a1f29] space-y-2">
                  <p className="text-sm font-semibold">AI processing</p>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#3A6FF7] w-2/3" />
                  </div>
                  <p className="text-xs text-black/60 dark:text-white/60">68% — diarization + summary</p>
                </div>
                <div className="rounded-lg border border-black/5 dark:border-white/10 p-3 bg-white dark:bg-[#1a1f29] space-y-2">
                  <p className="text-sm font-semibold">Analytics</p>
                  <p className="text-2xl font-semibold">12</p>
                  <p className="text-xs text-black/60 dark:text-white/60">hours reviewed this week</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Navigation" description="Sidebar with 16px padding and top bar utilities.">
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-3 space-y-2">
                  <p className="text-xs uppercase tracking-[0.15em] text-black/50 dark:text-white/50">Sidebar</p>
                  <div className="space-y-1">
                    {navigationItems.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-3 space-y-2">
                  <p className="text-xs uppercase tracking-[0.15em] text-black/50 dark:text-white/50">Top bar</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-black/5 dark:border-white/10 flex-1">
                      <Search className="w-4 h-4 text-black/60 dark:text-white/60" />
                      <input className="bg-transparent flex-1 text-sm outline-none" placeholder="Search transcripts" />
                    </div>
                    <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5">
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60">Breadcrumbs and tabs sit to the left; contextual actions to the right.</div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="System components" description="Modal, toast, and progress patterns keep interruptions polite.">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-3 space-y-2">
                  <p className="font-semibold">Modal</p>
                  <p className="text-xs text-black/60 dark:text-white/60">8px radius, 24px padding, blurred backdrop at 12%.</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 rounded-md bg-[#3A6FF7] text-white text-xs">Import</button>
                    <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 text-xs">Cancel</button>
                  </div>
                </div>
                <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-3 space-y-2">
                  <p className="font-semibold">Toast</p>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-[#2FB171]" />
                    AI summary ready for review
                  </div>
                  <div className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
                    <AlertCircle className="w-4 h-4 text-[#F6B90D]" />
                    Network retry in 8s
                  </div>
                </div>
                <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-3 space-y-2">
                  <p className="font-semibold">Progress</p>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#3A6FF7] w-3/4" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-black/60 dark:text-white/60">
                    <span>Diarization</span>
                    <span>75%</span>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-[#3A6FF7]">Screen designs</p>
              <h2 className="text-2xl font-semibold tracking-tight">Key flows for Auralog</h2>
            </div>
            <Pill label="Focus first, decoration minimal" />
          </div>

          <div className="grid xl:grid-cols-2 gap-5">
            <SectionCard title="1. Onboarding / Welcome" description="Calm hero with two clear CTAs and optional illustration.">
              <div className="rounded-lg border border-black/5 dark:border-white/10 bg-gradient-to-r from-white via-[#f5f6f7] to-[#e6e7e9] dark:from-[#0e141f] dark:via-[#101622] dark:to-[#0c111a] p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-xl font-semibold">Convert speech into structured knowledge.</h3>
                    <p className="text-sm text-black/60 dark:text-white/60">Drop in recordings, pick a sample project, or start fresh. Subdued illustration sits to the right.</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-md bg-[#3A6FF7] text-white text-sm">Import audio</button>
                    <button className="px-4 py-2 rounded-md border border-black/10 dark:border-white/15 text-sm">View sample</button>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="2. Dashboard" description="Past imports in a grid; quick filters and actions up top.">
              <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 flex items-center gap-2">
                      <Upload className="w-4 h-4" /> New import
                    </button>
                    <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 flex items-center gap-2">
                      <FolderPlus className="w-4 h-4" /> Create folder
                    </button>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/60">Sort by date • duration • title</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {[1, 2, 3, 4].map((id) => (
                    <div key={id} className="rounded-md border border-black/5 dark:border-white/10 p-3 bg-black/5 dark:bg-white/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Project {id}</span>
                        <span className="text-xs text-[#3A6FF7]">Transcript ready</span>
                      </div>
                      <p className="text-xs text-black/60 dark:text-white/60">42m • 2 speakers • Updated today</p>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="3. Recording import" description="Drag-and-drop zone with settings before AI runs.">
              <div className="rounded-lg border border-dashed border-[#3A6FF7]/40 bg-[#3A6FF7]/5 dark:bg-[#3A6FF7]/10 p-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#3A6FF7]" />
                  <span>Drop audio here or browse</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-md border border-black/5 dark:border-white/10 bg-white dark:bg-[#0f141f] p-3 space-y-1">
                    <p className="font-medium">Language</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Auto-detect (override per file)</p>
                  </div>
                  <div className="rounded-md border border-black/5 dark:border-white/10 bg-white dark:bg-[#0f141f] p-3 space-y-1">
                    <p className="font-medium">AI detail level</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Concise summary • Detailed minutes</p>
                  </div>
                </div>
                <div className="rounded-md border border-black/5 dark:border-white/10 bg-white dark:bg-[#0f141f] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>team_sync.wav</span>
                    <span className="text-xs text-black/60 dark:text-white/60">Uploading...</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#3A6FF7] w-1/2" />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="4. Transcript + Notes" description="Two-pane workspace with synced audio footer.">
              <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-4 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-black/5 dark:border-white/10 flex-1">
                    <Search className="w-4 h-4 text-black/60 dark:text-white/60" />
                    <input className="flex-1 bg-transparent outline-none" placeholder="Search transcript" />
                  </div>
                  <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </button>
                  <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Regenerate
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="rounded-md border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-black/60 dark:text-white/60">
                      <span>Speaker A • 00:12</span>
                      <span>Editable transcript</span>
                    </div>
                    <p className="text-sm">"Let's finalize the rollout timeline and assign owners for support."</p>
                    <p className="text-sm">"AI notes will highlight risks and decisions inline."</p>
                  </div>
                  <div className="rounded-md border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 space-y-2">
                    <p className="font-medium">AI summary</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-black/80 dark:text-white/80">
                      <li>Decisions: Launch window locked for Q3, marketing owns announcement.</li>
                      <li>Actions: Set up weekly QA checkpoints, confirm vendor SLA.</li>
                      <li>Risks: Budget drift; require finance sign-off.</li>
                    </ul>
                  </div>
                </div>
                <div className="rounded-md border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 p-3 flex items-center gap-3">
                  <Play className="w-5 h-5" />
                  <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#3A6FF7] w-1/3" />
                  </div>
                  <span className="text-xs text-black/60 dark:text-white/60">10:24 / 42:10</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="5. Settings" description="Clear preferences grouped by task.">
              <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1f29] p-4 space-y-3 text-sm">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-md border border-black/5 dark:border-white/10 p-3 space-y-1">
                    <p className="font-medium">Output format</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Markdown, DOCX, PDF</p>
                  </div>
                  <div className="rounded-md border border-black/5 dark:border-white/10 p-3 space-y-1">
                    <p className="font-medium">AI parameters</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Temperature, summarization style</p>
                  </div>
                  <div className="rounded-md border border-black/5 dark:border-white/10 p-3 space-y-1">
                    <p className="font-medium">Storage</p>
                    <p className="text-xs text-black/60 dark:text-white/60">Delete old projects</p>
                  </div>
                </div>
                <div className="rounded-md border border-black/5 dark:border-white/10 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">Account</p>
                    <p className="text-xs text-black/60 dark:text-white/60">API key • Plan • Device slots</p>
                  </div>
                  <button className="px-3 py-2 rounded-md border border-black/10 dark:border-white/15 text-xs">Manage</button>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>
      </main>
    </div>
  );
}
