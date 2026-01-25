import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface ContainersProps {
  darkMode: boolean;
}

export function Containers({ darkMode }: ContainersProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <section>
      <div className="mb-8">
        <h2 className={`text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>Containers</h2>
        <p className={`mt-2 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Card layouts and modal dialogs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Group Card */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Settings Group Card</h3>
          
          {/* Example Settings Card */}
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/10'} backdrop-blur-xl shadow-sm`}>
            <div className="mb-4">
              <h4 className={`${darkMode ? 'text-white' : 'text-black'}`}>Auto-Save</h4>
              <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                Automatically save your work as you type
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className={`${darkMode ? 'text-white/70' : 'text-black/70'}`}>Enable auto-save</span>
              <button className="relative w-12 h-7 bg-[#34C759] rounded-full">
                <span className="absolute top-0.5 right-0.5 w-6 h-6 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Group Card - Dark Example */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Settings Group Card (Variant)</h3>
          
          {/* Example Settings Card */}
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/10'} backdrop-blur-xl shadow-sm`}>
            <div className="mb-4">
              <h4 className={`${darkMode ? 'text-white' : 'text-black'}`}>Language Detection</h4>
              <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                Automatically detect the language of your text
              </p>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="w-5 h-5 rounded border-2 bg-[#007AFF] border-[#007AFF]">
                    <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span className={`${darkMode ? 'text-white/70' : 'text-black/70'}`}>Enable automatic detection</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className={`w-5 h-5 rounded border-2 ${darkMode ? 'border-white/30' : 'border-black/30'}`} />
                </div>
                <span className={`${darkMode ? 'text-white/70' : 'text-black/70'}`}>Show confidence level</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Dialog Trigger */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'} lg:col-span-2`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Modal Dialog</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-lg transition-colors"
          >
            Open Modal Example
          </button>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className={`relative w-full max-w-md rounded-xl shadow-2xl ${
              darkMode ? 'bg-[#1c1c1e] border border-white/10' : 'bg-white border border-black/10'
            } backdrop-blur-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <h3 className={`text-xl ${darkMode ? 'text-white' : 'text-black'}`}>Reset All Settings</h3>
                <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                  This action cannot be undone
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-white/10 text-white/60' : 'hover:bg-black/5 text-black/60'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-6">
              <div className={`p-4 rounded-lg flex gap-3 mb-6 ${
                darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-100'
              }`}>
                <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <p className={`${darkMode ? 'text-yellow-200' : 'text-yellow-900'}`}>
                  All custom dictionaries, rules, and preferences will be reset to their default values.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      : 'bg-transparent border-black/20 text-black hover:bg-black/5'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg transition-colors border border-[#FF3B30]/20"
                >
                  Reset Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
