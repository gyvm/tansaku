import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';

interface InformationDisplayProps {
  darkMode: boolean;
}

export function InformationDisplay({ darkMode }: InformationDisplayProps) {
  return (
    <section>
      <div className="mb-8">
        <h2 className={`text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>Information Display</h2>
        <p className={`mt-2 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Cards, headers, and informational components</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Info Note Card */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Info Note Card</h3>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
              <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <p className={`${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>
                  This feature helps identify common writing mistakes and suggests improvements to enhance clarity.
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'}`}>
              <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h4 className={`mb-1 ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>Pro Tip</h4>
                <p className={`${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                  Enable real-time checking for instant feedback as you type.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Note Card */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Warning Note Card</h3>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-100'}`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <p className={`${darkMode ? 'text-yellow-200' : 'text-yellow-900'}`}>
                  Changes to this setting will only apply to new documents.
                </p>
              </div>
            </div>
            <div className={`p-4 rounded-lg flex gap-3 ${darkMode ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-100'}`}>
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`mb-1 ${darkMode ? 'text-yellow-100' : 'text-yellow-900'}`}>Important</h4>
                <p className={`${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  Strict mode may flag stylistic choices as errors. Review suggestions carefully.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Section Header</h3>
          <div className="space-y-6">
            <div>
              <h4 className={`${darkMode ? 'text-white' : 'text-black'}`}>Appearance</h4>
              <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                Customize the visual style and theme preferences
              </p>
            </div>
            <div>
              <h4 className={`${darkMode ? 'text-white' : 'text-black'}`}>Proofreading Engine</h4>
              <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                Configure how TypoZero analyzes and checks your writing
              </p>
            </div>
            <div>
              <h4 className={`${darkMode ? 'text-white' : 'text-black'}`}>Notifications</h4>
              <p className={`mt-1 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>
                Control when and how you receive alerts and suggestions
              </p>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Divider Line</h3>
          <div className="space-y-6">
            <div>
              <p className={`mb-3 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Content above</p>
              <div className={`h-px ${darkMode ? 'bg-white/10' : 'bg-black/10'}`} />
              <p className={`mt-3 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Content below</p>
            </div>
            <div>
              <p className={`mb-4 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Section A</p>
              <div className={`h-px ${darkMode ? 'bg-white/20' : 'bg-black/20'}`} />
              <p className={`mt-4 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Section B</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
