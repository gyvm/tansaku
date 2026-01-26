import React, { useState } from 'react';
import { Moon, Sun, Settings, Search, ChevronRight, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#0c0f14]' : 'bg-[#f5f5f7]'} ${darkMode ? 'text-white' : 'text-black'} transition-colors duration-300`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${darkMode ? 'bg-[#0c0f14]/80 border-white/10' : 'bg-[#f5f5f7]/80 border-black/10'}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✏️</div>
            <div>
              <h1 className="text-lg font-semibold">TypoZero</h1>
              <p className={`text-xs ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Settings</p>
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
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Settings Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Preferences</h2>
          <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-black/60'} mt-1`}>Customize TypoZero to match your workflow</p>
        </div>

        {/* Tabs */}
        <div className={`mb-8 border-b ${darkMode ? 'border-white/10' : 'border-black/10'} flex overflow-x-auto gap-8`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                activeTab === tab.id
                  ? `border-blue-500 ${darkMode ? 'text-white' : 'text-black'}`
                  : `border-transparent ${darkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className={`rounded-lg border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} divide-y ${darkMode ? 'divide-white/10' : 'divide-black/5'}`}>
                  {[
                    { label: 'Language', value: 'English', description: 'Interface language' },
                    { label: 'Auto-save', value: 'Enabled', description: 'Save changes automatically' },
                    { label: 'Default project', value: 'Last opened', description: 'Start with this project' },
                    { label: 'Check for updates', value: 'Automatically', description: 'Keep TypoZero updated' },
                  ].map((item, idx) => (
                    <div key={idx} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-black/60'}`}>{item.description}</p>
                      </div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Startup Behavior</h3>
                <div className={`rounded-lg border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} p-4 space-y-3`}>
                  {['Open last document', 'Open new document', 'Show start screen'].map((option, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="startup" className="w-4 h-4" defaultChecked={idx === 0} />
                      <span className="font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Appearance</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-3">Theme</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { name: 'Light', icon: '☀️', active: !darkMode },
                        { name: 'Dark', icon: '🌙', active: darkMode },
                        { name: 'Auto', icon: '⚡', active: false },
                      ].map((theme) => (
                        <button
                          key={theme.name}
                          className={`p-4 rounded-lg border-2 transition text-center ${
                            theme.active
                              ? `border-blue-500 ${darkMode ? 'bg-[#1a1f29]' : 'bg-blue-50'}`
                              : `border-transparent ${darkMode ? 'bg-[#1a1f29]' : 'bg-white'} ${darkMode ? 'hover:border-white/20' : 'hover:border-black/10'}`
                          }`}
                        >
                          <div className="text-3xl mb-2">{theme.icon}</div>
                          <p className="font-medium text-sm">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-3">Font Size</p>
                    <div className={`rounded-lg border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} p-4`}>
                      <input type="range" min="12" max="18" defaultValue="14" className="w-full" />
                      <div className="flex justify-between text-xs opacity-60 mt-2">
                        <span>Small</span>
                        <span>Large</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Advanced Settings</h3>
                <div className={`rounded-lg border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} divide-y ${darkMode ? 'divide-white/10' : 'divide-black/5'}`}>
                  {[
                    { label: 'Enable spell check', value: true },
                    { label: 'Auto-correct common typos', value: true },
                    { label: 'Smart quotes and dashes', value: false },
                    { label: 'Send anonymous telemetry', value: false },
                  ].map((item, idx) => (
                    <div key={idx} className="px-6 py-4 flex items-center justify-between">
                      <p className="font-medium">{item.label}</p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.value} className="sr-only peer" />
                        <div className={`w-11 h-6 rounded-full peer transition ${item.value ? 'bg-blue-500' : (darkMode ? 'bg-white/10' : 'bg-black/10')}`} />
                        <span className={`absolute left-1 top-0.5 w-5 h-5 rounded-full transition ${item.value ? 'translate-x-5 bg-white' : (darkMode ? 'bg-white/60' : 'bg-black/60')}`} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Backup & Storage</h3>
                <div className={`rounded-lg border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} p-6 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Backup location</p>
                      <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-black/60'}`}>~/Library/Application Support/TypoZero</p>
                    </div>
                    <button className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} text-sm font-medium transition`}>
                      Change
                    </button>
                  </div>
                  <div className={`pt-4 border-t ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                    <button className={`px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition`}>
                      Back up now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          {activeTab === 'shortcuts' && (
            <div className="md:col-span-3 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
                <div className={`rounded-lg border ${darkMode ? 'border-white/10' : 'border-black/5'} overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${darkMode ? 'bg-[#1a1f29]' : 'bg-[#f9f9fb]'}`}>
                      <tr className={`border-b ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
                        <th className="px-6 py-3 text-left font-semibold">Action</th>
                        <th className="px-6 py-3 text-left font-semibold">Shortcut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { action: 'New document', shortcut: '⌘N' },
                        { action: 'Open document', shortcut: '⌘O' },
                        { action: 'Save', shortcut: '⌘S' },
                        { action: 'Undo', shortcut: '⌘Z' },
                        { action: 'Redo', shortcut: '⌘⇧Z' },
                        { action: 'Find', shortcut: '⌘F' },
                        { action: 'Replace', shortcut: '⌘⌥F' },
                      ].map((item, idx) => (
                        <tr key={idx} className={`border-b ${darkMode ? 'border-white/10' : 'border-black/5'} hover:${darkMode ? 'bg-white/5' : 'bg-black/5'} transition`}>
                          <td className="px-6 py-3">{item.action}</td>
                          <td className={`px-6 py-3 font-mono text-sm ${darkMode ? 'text-white/70' : 'text-black/70'}`}>{item.shortcut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {activeTab === 'about' && (
            <div className="md:col-span-3 space-y-6">
              <div className={`rounded-lg border ${darkMode ? 'border-white/10 bg-[#1a1f29]' : 'border-black/5 bg-white'} p-8 text-center`}>
                <div className="text-5xl mb-4">✏️</div>
                <h3 className="text-2xl font-bold mb-2">TypoZero</h3>
                <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-black/60'} mb-4`}>Minimal typing companion</p>
                <p className={`text-sm font-mono ${darkMode ? 'text-white/50' : 'text-black/50'}`}>Version 1.0.0 (Build 42)</p>
                <div className="flex gap-3 justify-center mt-6">
                  <a href="#" className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>Privacy</a>
                  <span className={darkMode ? 'text-white/20' : 'text-black/20'}>•</span>
                  <a href="#" className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>License</a>
                  <span className={darkMode ? 'text-white/20' : 'text-black/20'}>•</span>
                  <a href="#" className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>Website</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
