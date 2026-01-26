import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <p className="text-6xl font-bold text-slate-900 dark:text-white">404</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Page not found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The design system you're looking for doesn't exist yet.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
