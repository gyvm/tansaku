import React, { useState } from 'react';
import { FileText, Settings, Bell, Palette, Zap, Shield } from 'lucide-react';

interface NavigationProps {
  darkMode: boolean;
}

export function Navigation({ darkMode }: NavigationProps) {
  const [selectedItem, setSelectedItem] = useState('proofreading');

  const menuItems = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'proofreading', label: 'Proofreading', icon: FileText },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const sectionItems = [
    { id: 'advanced', label: 'Advanced', icon: Zap },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  return (
    <section>
      <div className="mb-8">
        <h2 className={`text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>Navigation</h2>
        <p className={`mt-2 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Sidebar navigation elements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sidebar Items - Interactive */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Sidebar Items (Interactive)</h3>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : darkMode
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Items - States */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Sidebar Items (States)</h3>
          <div className="space-y-1">
            <div>
              <p className={`text-xs mb-2 px-3 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DEFAULT</p>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  darkMode
                    ? 'text-white/70 hover:bg-white/10 hover:text-white'
                    : 'text-black/70 hover:bg-black/5 hover:text-black'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>General</span>
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 px-3 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>HOVER</p>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                  darkMode
                    ? 'bg-white/10 text-white'
                    : 'bg-black/5 text-black'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 px-3 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>SELECTED</p>
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#007AFF] text-white shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Proofreading</span>
              </button>
            </div>
            <div>
              <p className={`text-xs mb-2 px-3 ${darkMode ? 'text-white/50' : 'text-black/50'}`}>DISABLED</p>
              <button
                disabled
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-not-allowed ${
                  darkMode
                    ? 'text-white/30'
                    : 'text-black/30'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Appearance</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Section Header */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'} lg:col-span-2`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Sidebar with Section Headers</h3>
          <div className="max-w-xs space-y-1">
            <div className={`px-3 py-2 uppercase tracking-wide ${darkMode ? 'text-white/40' : 'text-black/40'}`}>
              Main
            </div>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedItem === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#007AFF] text-white shadow-sm'
                      : darkMode
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            <div className={`px-3 py-2 mt-4 uppercase tracking-wide ${darkMode ? 'text-white/40' : 'text-black/40'}`}>
              Other
            </div>
            {sectionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    darkMode
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
