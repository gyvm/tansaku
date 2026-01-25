import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface InputControlsProps {
  darkMode: boolean;
}

export function InputControls({ darkMode }: InputControlsProps) {
  const [textValue, setTextValue] = useState('');
  const [selectedOption, setSelectedOption] = useState('standard');
  const [checkboxStates, setCheckboxStates] = useState({
    default: false,
    checked: true,
    disabled: false,
  });
  const [sliderValue, setSliderValue] = useState(50);
  const [dropdownValue, setDropdownValue] = useState('japanese');

  return (
    <section>
      <div className="mb-8">
        <h2 className={`text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-black'}`}>Input Controls</h2>
        <p className={`mt-2 ${darkMode ? 'text-white/60' : 'text-black/60'}`}>Form elements and interactive controls</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Text Field */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Text Field</h3>
          <div className="space-y-6">
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Label</label>
              <input
                type="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Enter text..."
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-white/5 border-white/20 text-white placeholder-white/40 focus:bg-white/10 focus:border-[#007AFF]'
                    : 'bg-white border-black/20 text-black placeholder-black/40 focus:bg-white focus:border-[#007AFF]'
                } outline-none`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Focused State</label>
              <input
                type="text"
                value="Focused input"
                className={`w-full px-4 py-2.5 rounded-lg border transition-colors ${
                  darkMode
                    ? 'bg-white/10 border-[#007AFF] text-white'
                    : 'bg-white border-[#007AFF] text-black'
                } outline-none ring-4 ring-[#007AFF]/20`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-white/40' : 'text-black/40'}`}>Disabled</label>
              <input
                type="text"
                value="Disabled input"
                disabled
                className={`w-full px-4 py-2.5 rounded-lg border cursor-not-allowed ${
                  darkMode
                    ? 'bg-white/5 border-white/10 text-white/40'
                    : 'bg-black/5 border-black/10 text-black/40'
                } outline-none`}
              />
            </div>
          </div>
        </div>

        {/* Segmented Picker */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Segmented Picker</h3>
          <div className="space-y-6">
            <div>
              <label className={`block mb-3 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Proofreading Level</label>
              <div className={`inline-flex p-1 rounded-lg ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                {['light', 'standard', 'strict'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(option)}
                    className={`px-6 py-2 rounded-md transition-all capitalize ${
                      selectedOption === option
                        ? darkMode
                          ? 'bg-white/20 text-white shadow-sm'
                          : 'bg-white text-black shadow-sm'
                        : darkMode
                        ? 'text-white/60 hover:text-white/80'
                        : 'text-black/60 hover:text-black/80'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={`block mb-3 ${darkMode ? 'text-white/40' : 'text-black/40'}`}>Disabled State</label>
              <div className={`inline-flex p-1 rounded-lg opacity-50 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                {['light', 'standard', 'strict'].map((option) => (
                  <button
                    key={option}
                    disabled
                    className={`px-6 py-2 rounded-md capitalize cursor-not-allowed ${
                      option === 'standard'
                        ? darkMode
                          ? 'bg-white/20 text-white shadow-sm'
                          : 'bg-white text-black shadow-sm'
                        : darkMode
                        ? 'text-white/60'
                        : 'text-black/60'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dropdown Select */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Dropdown Select</h3>
          <div className="space-y-6">
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-white/80' : 'text-black/80'}`}>Select Language</label>
              <div className="relative">
                <select
                  value={dropdownValue}
                  onChange={(e) => setDropdownValue(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border appearance-none transition-colors ${
                    darkMode
                      ? 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      : 'bg-white border-black/20 text-black hover:bg-black/5'
                  } outline-none cursor-pointer`}
                >
                  <option value="english">English</option>
                  <option value="japanese">Japanese</option>
                  <option value="spanish">Spanish</option>
                  <option value="french">French</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? 'text-white/60' : 'text-black/60'}`} />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${darkMode ? 'text-white/40' : 'text-black/40'}`}>Disabled</label>
              <div className="relative">
                <select
                  disabled
                  className={`w-full px-4 py-2.5 rounded-lg border appearance-none cursor-not-allowed ${
                    darkMode
                      ? 'bg-white/5 border-white/10 text-white/40'
                      : 'bg-black/5 border-black/10 text-black/40'
                  } outline-none`}
                >
                  <option>Japanese</option>
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${darkMode ? 'text-white/30' : 'text-black/30'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Checkbox</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={checkboxStates.default}
                  onChange={() => setCheckboxStates(prev => ({ ...prev, default: !prev.default }))}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all ${
                  checkboxStates.default
                    ? 'bg-[#007AFF] border-[#007AFF]'
                    : darkMode
                    ? 'border-white/30 group-hover:border-white/50'
                    : 'border-black/30 group-hover:border-black/50'
                }`}>
                  {checkboxStates.default && (
                    <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className={`${darkMode ? 'text-white/80' : 'text-black/80'}`}>Enable spell checking</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={checkboxStates.checked}
                  onChange={() => setCheckboxStates(prev => ({ ...prev, checked: !prev.checked }))}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all ${
                  checkboxStates.checked
                    ? 'bg-[#007AFF] border-[#007AFF]'
                    : darkMode
                    ? 'border-white/30 group-hover:border-white/50'
                    : 'border-black/30 group-hover:border-black/50'
                }`}>
                  {checkboxStates.checked && (
                    <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className={`${darkMode ? 'text-white/80' : 'text-black/80'}`}>Check grammar automatically</span>
            </label>

            <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={checkboxStates.disabled}
                  disabled
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 ${
                  checkboxStates.disabled
                    ? 'bg-[#007AFF] border-[#007AFF]'
                    : darkMode
                    ? 'border-white/30'
                    : 'border-black/30'
                }`}>
                  {checkboxStates.disabled && (
                    <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="none">
                      <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className={`${darkMode ? 'text-white/40' : 'text-black/40'}`}>Disabled option</span>
            </label>
          </div>
        </div>

        {/* Slider */}
        <div className={`p-8 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-white'} backdrop-blur-xl border ${darkMode ? 'border-white/10' : 'border-black/10'} lg:col-span-2`}>
          <h3 className={`mb-6 ${darkMode ? 'text-white' : 'text-black'}`}>Slider</h3>
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className={`${darkMode ? 'text-white/80' : 'text-black/80'}`}>Sensitivity</label>
                <span className={`px-3 py-1 rounded-md ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>{sliderValue}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #007AFF 0%, #007AFF ${sliderValue}%, ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} ${sliderValue}%, ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 100%)`
                }}
              />
            </div>
            <div className="opacity-50">
              <div className="flex items-center justify-between mb-3">
                <label className={`${darkMode ? 'text-white/40' : 'text-black/40'}`}>Disabled Slider</label>
                <span className={`px-3 py-1 rounded-md ${darkMode ? 'bg-white/10 text-white/40' : 'bg-black/5 text-black/40'}`}>75%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value="75"
                disabled
                className="w-full h-2 rounded-lg appearance-none cursor-not-allowed slider"
                style={{
                  background: `linear-gradient(to right, ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 0%, ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 75%, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 75%, ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
