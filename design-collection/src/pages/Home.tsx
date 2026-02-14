import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Settings, Zap, BookOpen, Palette, Cloud, FileAudio, LayoutDashboard, Mic } from 'lucide-react';

interface ProjectCard {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  status: 'completed' | 'in-progress' | 'planned';
}

const projects: ProjectCard[] = [
  {
    id: 'component-library',
    name: 'macOS Component Library',
    description: 'A comprehensive component library design for macOS applications with Figma integration.',
    path: '/component-library',
    icon: <Palette className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    status: 'completed',
  },
  {
    id: 'settings-window',
    name: 'macOS Settings Window',
    description: 'Native macOS settings window design with Japanese language support.',
    path: '/settings-window',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    status: 'completed',
  },
  {
    id: 'auralog',
    name: 'Auralog Design System',
    description: 'Calm, minimal workspace design for AI-powered meeting minutes application.',
    path: '/auralog',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-indigo-500 to-indigo-600',
    status: 'completed',
  },
  {
    id: 'typozero',
    name: 'TypoZero',
    description: 'Sleek macOS-style application design with native window chrome.',
    path: '/typozero',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-slate-500 to-slate-600',
    status: 'completed',
  },
  {
    id: 'appbooks',
    name: 'macOS Apple Books Style',
    description: 'Design system inspired by Apple Books, optimized for reading and content discovery.',
    path: '/appbooks',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'from-amber-500 to-amber-600',
    status: 'completed',
  },
  {
    id: 'soft-glass',
    name: 'Soft Glass',
    description: 'A hybrid design system combining Claymorphism softness with Glassmorphism transparency.',
    path: '/soft-glass',
    icon: <Cloud className="w-6 h-6" />,
    color: 'from-pink-400 to-purple-500',
    status: 'completed',
  },
  {
    id: 'retro-glass-ui',
    name: 'Retro Glass UI',
    description: 'A nostalgic collection of Lo-Fi Paper & Glass components.',
    path: '/retro-glass-ui',
    icon: <Layout className="w-6 h-6" />,
    color: 'from-slate-500 to-stone-600',
    status: 'completed',
  },
  {
    id: 'voice-notes-step',
    name: 'Voice Notes (Step UI)',
    description: 'Step-by-step wizard interface for meeting minutes generation with Japanese Teal theme.',
    path: '/voice-notes-step',
    icon: <FileAudio className="w-6 h-6" />,
    color: 'from-teal-500 to-emerald-600',
    status: 'completed',
  },
  {
    id: 'voice-notes-dash',
    name: 'Voice Notes (Dash UI)',
    description: 'Single-view dashboard interface for meeting minutes generation.',
    path: '/voice-notes-dash',
    icon: <LayoutDashboard className="w-6 h-6" />,
    color: 'from-teal-600 to-cyan-700',
    status: 'completed',
  },
  {
    id: 'meeting-recorder-macos',
    name: 'Meeting Recorder (macOS)',
    description: 'Online MTG recording UI with dual-channel wave and storage panel.',
    path: '/meeting-recorder-macos',
    icon: <Mic className="w-6 h-6" />,
    color: 'from-rose-500 to-orange-500',
    status: 'completed',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                DT
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Design Tansaku</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Design System Showcase</p>
              </div>
            </div>
            <a
              href="https://github.com/sst/opencode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              GitHub
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              Explore Design Systems
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              A collection of design systems and UI prototypes showcasing different design philosophies.
              Select a project below to view its design system in detail.
            </p>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={project.path}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative p-6 space-y-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center text-white shadow-lg`}>
                  {project.icon}
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {project.name}
                    </h3>
                    <span className="ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200">
                      {project.status === 'completed' ? 'Live' : 'Soon'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 pt-2 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  View Design System
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>Design Tansaku © 2024 - Design Systems Exploration</p>
        </div>
      </footer>
    </div>
  );
}
