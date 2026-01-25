import React, { useState } from 'react';
import { Moon, Sun, BookOpen, Bookmark, Settings, Search, ChevronRight } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const books = [
    { id: 1, title: 'The Design of Everyday Things', author: 'Don Norman', cover: '📕', progress: 65 },
    { id: 2, title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', cover: '📗', progress: 42 },
    { id: 3, title: 'Atomic Habits', author: 'James Clear', cover: '📘', progress: 88 },
    { id: 4, title: 'The Lean Product Playbook', author: 'Dan Olsen', cover: '📙', progress: 23 },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0c0f14]' : 'bg-[#f5f5f7]'} ${darkMode ? 'text-white' : 'text-black'} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${darkMode ? 'bg-[#0c0f14]/80 border-white/10' : 'bg-[#f5f5f7]/80 border-black/10'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📚</div>
            <div>
              <h1 className="text-lg font-semibold">ReadOS</h1>
              <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Apple Books inspired reader</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-black/10 bg-black/5 hover:bg-black/10'} transition`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <section className={`rounded-2xl ${darkMode ? 'bg-gradient-to-br from-[#1a1f29] to-[#0f141f]' : 'bg-gradient-to-br from-white to-[#f9f9fb]'} border ${darkMode ? 'border-white/10' : 'border-black/5'} p-8 md:p-12`}>
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">macOS Reading Experience</h2>
            <p className={`text-lg ${darkMode ? 'text-white/70' : 'text-black/70'} max-w-2xl`}>
              A minimal, elegant design system for a reading platform inspired by Apple Books.
              Beautiful typography, smooth interactions, and thoughtful information hierarchy.
            </p>
            <div className="flex gap-3 pt-4">
              <button className="px-6 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition">
                Start Reading
              </button>
              <button className={`px-6 py-2 rounded-lg border ${darkMode ? 'border-white/20 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'} transition`}>
                View Library
              </button>
            </div>
          </div>
        </section>

        {/* Featured Books */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Your Library</h3>
            <button className={`flex items-center gap-1 text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>
              See all <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <div
                key={book.id}
                className={`group rounded-xl overflow-hidden border ${darkMode ? 'border-white/10 bg-[#1a1f29] hover:border-white/20' : 'border-black/5 bg-white hover:border-black/10'} transition cursor-pointer`}
              >
                {/* Book Cover */}
                <div className={`aspect-[3/4] flex items-center justify-center text-6xl ${darkMode ? 'bg-[#0f141f]' : 'bg-[#f5f5f7]'} group-hover:scale-105 transition duration-300`}>
                  {book.cover}
                </div>

                {/* Book Info */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm line-clamp-2">{book.title}</h4>
                    <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-black/60'}`}>{book.author}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-black/50'}`}>{book.progress}% read</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}>
                      <Bookmark className="w-3 h-3 mx-auto" />
                    </button>
                    <button className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition bg-blue-500 text-white hover:bg-blue-600`}>
                      Read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reading Controls */}
        <section className={`rounded-2xl border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} p-8`}>
          <h3 className="text-2xl font-bold mb-6">Reading Experience</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Typography Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Typography</h4>
              <div className={`rounded-lg p-4 ${darkMode ? 'bg-[#0f141f]' : 'bg-[#f9f9fb]'} space-y-3`}>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Display</p>
                  <p className="text-3xl font-bold">Aa</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Heading</p>
                  <p className="text-xl font-semibold">Aa</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Body</p>
                  <p className="text-base">The quick brown fox jumps over the lazy dog.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-60 mb-1">Caption</p>
                  <p className="text-sm opacity-70">Chapter 3 • Page 142</p>
                </div>
              </div>
            </div>

            {/* Theme Options */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Reading Themes</h4>
              <div className="space-y-2">
                {[
                  { name: 'Light', bg: 'bg-white', text: 'text-black', accent: 'border-black/20' },
                  { name: 'Sepia', bg: 'bg-amber-50', text: 'text-amber-950', accent: 'border-amber-200' },
                  { name: 'Dark', bg: 'bg-[#1a1f29]', text: 'text-white', accent: 'border-white/20' },
                ].map((theme) => (
                  <button
                    key={theme.name}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition ${darkMode ? 'hover:border-white/30' : 'hover:border-black/20'} ${theme.accent}`}
                  >
                    <div className={`w-8 h-8 rounded ${theme.bg} border ${theme.accent}`} />
                    <span className="text-sm font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className={`rounded-2xl border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6" />
            <h3 className="text-2xl font-bold">Preferences</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'Font Size', value: '16px', icon: 'A' },
              { label: 'Line Spacing', value: '1.6', icon: '↕' },
              { label: 'Sync Progress', value: 'Enabled', icon: '☁' },
              { label: 'Dictionary Language', value: 'English', icon: '🔤' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${darkMode ? 'border-white/10' : 'border-black/5'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className={`text-xs ${darkMode ? 'text-white/50' : 'text-black/50'}`}>{item.value}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`} />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t ${darkMode ? 'border-white/10 bg-[#0c0f14]/50' : 'border-black/5 bg-[#f5f5f7]/50'} mt-20 py-8`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm opacity-60">
          <p>ReadOS © 2025</p>
          <div className="flex gap-6">
            <a href="#" className="hover:opacity-100 transition">Privacy</a>
            <a href="#" className="hover:opacity-100 transition">Terms</a>
            <a href="#" className="hover:opacity-100 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
