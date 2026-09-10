import React from 'react';
import { Sliders, Sparkles, Bot, ShieldAlert, Zap, Radio, Ghost, User } from 'lucide-react';
import type { AudioProcessingSettings, VoicePreset } from '../types/audio';

interface VoiceControlsSectionProps {
  settings: AudioProcessingSettings;
  onChangeSettings: (settings: AudioProcessingSettings) => void;
}

export const VoiceControlsSection: React.FC<VoiceControlsSectionProps> = ({
  settings,
  onChangeSettings,
}) => {
  const presets: { id: VoicePreset; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'normal', label: '標準声', icon: <User className="w-4 h-4" />, desc: 'そのままの自然な声' },
    { id: 'robot', label: 'ロボット', icon: <Bot className="w-4 h-4" />, desc: '金属質のリングモジュレーション' },
    { id: 'criminal', label: '犯人・匿名', icon: <ShieldAlert className="w-4 h-4" />, desc: '重低音ピッチ＋歪みで匿名化' },
    { id: 'helium', label: 'ヘリウム', icon: <Zap className="w-4 h-4" />, desc: '高音ピッチ＋明るいトーン' },
    { id: 'radio', label: 'トランシーバー', icon: <Radio className="w-4 h-4" />, desc: '無線・レトロラジオ風フィルタ' },
    { id: 'monster', label: 'モンスター', icon: <Ghost className="w-4 h-4" />, desc: '超重低音＋洞窟リバーブ' },
  ];

  const handlePitchChange = (semitones: number) => {
    onChangeSettings({
      ...settings,
      pitchSemiTones: semitones,
    });
  };

  const handlePresetSelect = (preset: VoicePreset) => {
    onChangeSettings({
      ...settings,
      preset,
    });
  };

  const toggleNoiseReduction = () => {
    onChangeSettings({
      ...settings,
      enableNoiseReduction: !settings.enableNoiseReduction,
    });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">2. 音声加工（雑音除去・ピッチ・ボイスプリセット）</h2>
          <p className="text-xs text-slate-400">背景雑音のカットや、声の高さ・キャラ変換を自由に設定できます</p>
        </div>
      </div>

      {/* Noise Reduction Toggle Box */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${settings.enableNoiseReduction ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">雑音除去・クリアフィルター (Noise Filter)</div>
            <div className="text-xs text-slate-400">低周波ノイズ（エアコン音等）をカットし、無音部分の背景スモール雑音を低減</div>
          </div>
        </div>

        <button
          onClick={toggleNoiseReduction}
          className={`px-4 py-2 rounded-full font-medium text-xs transition-all cursor-pointer flex items-center gap-2 ${
            settings.enableNoiseReduction
              ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
          }`}
        >
          {settings.enableNoiseReduction ? 'ON (有効)' : 'OFF (無効)'}
        </button>
      </div>

      {/* Pitch Slider Box */}
      <div className="mb-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-200">ピッチ調整 (声の高さ)</span>
          <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 font-semibold">
            {settings.pitchSemiTones > 0 ? `+${settings.pitchSemiTones}` : settings.pitchSemiTones} 半音
          </span>
        </div>
        <input
          type="range"
          min="-12"
          max="12"
          step="1"
          value={settings.pitchSemiTones}
          onChange={(e) => handlePitchChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
          <span>-12 (1オクターブ下)</span>
          <span>0 (変更なし)</span>
          <span>+12 (1オクターブ上)</span>
        </div>
      </div>

      {/* Voice Presets Grid */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-3">キャラクターボイス変換プリセット</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {presets.map((p) => {
            const isSelected = settings.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/30 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {p.icon}
                  <span>{p.label}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
