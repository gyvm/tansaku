import React, { useState } from 'react';
import { Plus, Settings, Trash2 } from 'lucide-react';

interface ButtonsProps {
  darkMode: boolean;
}

export function Buttons({ darkMode }: ButtonsProps) {
  const [toggleStates, setToggleStates] = useState({
    default: false,
    hover: true,
    disabled: false,
  });

  const toggleSwitch = (key: string) => {
    setToggleStates(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <section>
      <div className="mb-8">
        <h2 className={`text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>Buttons</h2>
        <p className={`mt-2 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Interactive button components with various states and styles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primary Button */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Primary Button</h3>
          <div className="space-y-4">
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DEFAULT</p>
              <button className="px-4 py-2 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-lg transition-colors">
                Continue
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>HOVER</p>
              <button className="px-4 py-2 bg-[#0051D5] text-white rounded-lg">
                Continue
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DISABLED</p>
              <button className="px-4 py-2 bg-[#007AFF]/30 text-white/50 rounded-lg cursor-not-allowed" disabled>
                Continue
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>FOCUSED</p>
              <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg ring-4 ring-[#007AFF]/30">
                Continue
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Button */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Secondary Button</h3>
          <div className="space-y-4">
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DEFAULT</p>
              <button className={`px-4 py-2 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' 
                  : 'bg-transparent border-black/20 text-black hover:bg-black/5'
              }`}>
                Cancel
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>HOVER</p>
              <button className={`px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-black/5 border-black/20 text-black'
              }`}>
                Cancel
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DISABLED</p>
              <button className={`px-4 py-2 rounded-lg border cursor-not-allowed ${
                darkMode 
                  ? 'bg-white/5 border-white/10 text-white/30' 
                  : 'bg-transparent border-black/10 text-black/30'
              }`} disabled>
                Cancel
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>FOCUSED</p>
              <button className={`px-4 py-2 rounded-lg border ring-4 ${
                darkMode 
                  ? 'bg-white/5 border-white/20 text-white ring-white/20' 
                  : 'bg-transparent border-black/20 text-black ring-black/10'
              }`}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Destructive Button */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Destructive Button</h3>
          <div className="space-y-4">
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DEFAULT</p>
              <button className="px-4 py-2 bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg transition-colors border border-[#FF3B30]/20">
                Delete
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>HOVER</p>
              <button className="px-4 py-2 bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg border border-[#FF3B30]/20">
                Delete
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DISABLED</p>
              <button className="px-4 py-2 bg-[#FF3B30]/5 text-[#FF3B30]/40 rounded-lg cursor-not-allowed border border-[#FF3B30]/10" disabled>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Icon Button */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Icon Button</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div>
                <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DEFAULT</p>
                <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode 
                    ? 'bg-white/10 hover:bg-white/15 text-white' 
                    : 'bg-black/5 hover:bg-black/10 text-black'
                }`}>
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>HOVER</p>
                <button className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  darkMode 
                    ? 'bg-white/15 text-white' 
                    : 'bg-black/10 text-black'
                }`}>
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <div>
                <p className={`text-xs mb-2 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DISABLED</p>
                <button className={`w-10 h-10 rounded-full flex items-center justify-center cursor-not-allowed ${
                  darkMode 
                    ? 'bg-white/5 text-white/30' 
                    : 'bg-black/5 text-black/30'
                }`} disabled>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'} lg:col-span-2`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Toggle Switch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className={`text-xs mb-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DEFAULT (OFF)</p>
              <button
                onClick={() => toggleSwitch('default')}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  toggleStates.default 
                    ? 'bg-[#34C759]' 
                    : darkMode ? 'bg-white/20' : 'bg-black/20'
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    toggleStates.default ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <div>
              <p className={`text-xs mb-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>HOVER (ON)</p>
              <button
                onClick={() => toggleSwitch('hover')}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  toggleStates.hover 
                    ? 'bg-[#34C759]' 
                    : darkMode ? 'bg-white/20' : 'bg-black/20'
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    toggleStates.hover ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <div>
              <p className={`text-xs mb-4 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DISABLED</p>
              <button
                disabled
                className={`relative w-12 h-7 rounded-full cursor-not-allowed opacity-50 ${
                  toggleStates.disabled 
                    ? 'bg-[#34C759]' 
                    : darkMode ? 'bg-white/20' : 'bg-black/20'
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    toggleStates.disabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
