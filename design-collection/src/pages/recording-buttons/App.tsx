import ModernButtons from './components/ModernButtons';
import MinimalButtons from './components/MinimalButtons';
import PlayfulButtons from './components/PlayfulButtons';
import SkeuomorphicButtons from './components/SkeuomorphicButtons';
import NeonButtons from './components/NeonButtons';

export default function RecordingButtonsApp() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <section className="space-y-4">
          <p className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            Recording Controls
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Button Design Gallery
          </h1>
          <p className="max-w-3xl text-slate-600 dark:text-slate-300">
            Different visual directions for recording UI: minimal utility, tactile skeuomorphism, playful motion,
            modern glass, and neon cyberpunk.
          </p>
        </section>

        <MinimalButtons />
        <SkeuomorphicButtons />
        <PlayfulButtons />
        <ModernButtons />
        <NeonButtons />
      </main>
    </div>
  );
}
