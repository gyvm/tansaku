import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

import MinimalButtons from './components/MinimalButtons';
import SkeuomorphicButtons from './components/SkeuomorphicButtons';
import NeonButtons from './components/NeonButtons';
import PlayfulButtons from './components/PlayfulButtons';
import ModernButtons from './components/ModernButtons';

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: React.ElementType }) => (
  <div className="flex items-center gap-2 mb-6">
    <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
      <Icon className="w-5 h-5" />
    </div>
    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
  </div>
);

export default function RecordingButtonsApp() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-black font-sans selection:bg-indigo-500/30">
      {/* Navigation & Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Recording Buttons Collection</h1>
              <p className="text-xs text-slate-500 dark:text-slate-500">25+ Interactive Recording Button Concepts</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="hidden md:inline">Built with React + Framer Motion + Tailwind</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">

          {/* Light Mode Column */}
          <div className="space-y-8">
            <SectionHeader title="Light Mode Preview" icon={Sun} />

            <div className="space-y-12">
              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-slate-800">Minimal</h3>
                  <p className="text-sm text-slate-500">Clean, functional, and distraction-free.</p>
                </div>
                <MinimalButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-slate-800">Skeuomorphic</h3>
                  <p className="text-sm text-slate-500">Tactile, realistic textures and shadows.</p>
                </div>
                <SkeuomorphicButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-slate-800">Playful</h3>
                  <p className="text-sm text-slate-500">Fun animations and organic shapes.</p>
                </div>
                <PlayfulButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-slate-800">Modern Glass</h3>
                  <p className="text-sm text-slate-500">Trendy glassmorphism and soft UI.</p>
                </div>
                <ModernButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-slate-800">Neon (Dark Styled)</h3>
                  <p className="text-sm text-slate-500">Even in light mode, these retain their dark aesthetic.</p>
                </div>
                <NeonButtons />
              </section>
            </div>
          </div>

          {/* Dark Mode Column */}
          <div className="dark space-y-8 bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-2xl">
            <SectionHeader title="Dark Mode Preview" icon={Moon} />

            <div className="space-y-12">
              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-white">Minimal</h3>
                  <p className="text-sm text-slate-400">Clean, functional, and distraction-free.</p>
                </div>
                <MinimalButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-white">Skeuomorphic</h3>
                  <p className="text-sm text-slate-400">Tactile, realistic textures and shadows.</p>
                </div>
                <SkeuomorphicButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-white">Playful</h3>
                  <p className="text-sm text-slate-400">Fun animations and organic shapes.</p>
                </div>
                <PlayfulButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-white">Modern Glass</h3>
                  <p className="text-sm text-slate-400">Trendy glassmorphism and soft UI.</p>
                </div>
                <ModernButtons />
              </section>

              <section>
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-semibold text-white">Neon / Cyberpunk</h3>
                  <p className="text-sm text-slate-400">Glowing effects that pop in the dark.</p>
                </div>
                <NeonButtons />
              </section>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
