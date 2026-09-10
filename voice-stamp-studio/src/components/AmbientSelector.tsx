import React from 'react';
import { Cloud, Volume2, Ban } from 'lucide-react';
import { AMBIENT_SOUNDS } from '../utils/soundSynthesis';
import type { AudioProcessingSettings } from '../types/audio';

interface AmbientSelectorProps {
  settings: AudioProcessingSettings;
  onChangeSettings: (settings: AudioProcessingSettings) => void;
}

export const AmbientSelector: React.FC<AmbientSelectorProps> = ({ settings, onChangeSettings }) => {
  const handleSelectAmbient = (id: string | null) => {
    onChangeSettings({
      ...settings,
      ambientSoundId: id,
    });
  };

  const handleVolumeChange = (volume: number) => {
    onChangeSettings({
      ...settings,
      ambientVolume: volume,
    });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">4. 背景環境音 (Ambient BGM) 設定</h2>
          <p className="text-xs text-slate-400">カフェ、波の音、雨の音などの環境音を声の背景に合成します</p>
        </div>
      </div>

      {/* Grid of Ambient Sound Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {/* None / Disable option */}
        <button
          onClick={() => handleSelectAmbient(null)}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            settings.ambientSoundId === null
              ? 'bg-slate-800 border-sky-500 text-sky-300 shadow-md'
              : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-400'
          }`}
        >
          <Ban className="w-5 h-5 opacity-70" />
          <span className="text-xs font-semibold">なし (OFF)</span>
        </button>

        {AMBIENT_SOUNDS.map((sound) => {
          const isSelected = settings.ambientSoundId === sound.id;
          return (
            <button
              key={sound.id}
              onClick={() => handleSelectAmbient(sound.id)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? 'bg-sky-500/15 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10'
                  : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-xl">{sound.icon}</span>
              <span className="text-xs font-semibold">{sound.name}</span>
            </button>
          );
        })}
      </div>

      {/* Ambient Volume Control */}
      {settings.ambientSoundId && (
        <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Volume2 className="w-4 h-4 text-sky-400" />
            <span className="font-medium">背景音の音量調整</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.ambientVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-32 md:w-48 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-xs font-mono text-sky-400 font-semibold w-10 text-right">
              {Math.round(settings.ambientVolume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
