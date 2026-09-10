import { useState } from 'react';
import { Mic, Sparkles, Volume2 } from 'lucide-react';
import { AudioInputSection } from './components/AudioInputSection';
import { VoiceControlsSection } from './components/VoiceControlsSection';
import { StampTimeline } from './components/StampTimeline';
import { AmbientSelector } from './components/AmbientSelector';
import { AudioPlayerSection } from './components/AudioPlayerSection';
import type { AudioProcessingSettings, AudioSourceInfo, PlacedStamp } from './types/audio';

export function App() {
  const [audioSource, setAudioSource] = useState<AudioSourceInfo | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [settings, setSettings] = useState<AudioProcessingSettings>({
    pitchSemiTones: 0,
    preset: 'normal',
    enableNoiseReduction: false,
    noiseGateThresholdDb: -45,
    highpassFreqHz: 100,
    ambientSoundId: null,
    ambientVolume: 0.3,
    mainVolume: 1.0,
  });

  const [stamps, setStamps] = useState<PlacedStamp[]>([]);

  const handleAddStamp = (stampId: string, time: number) => {
    const newStamp: PlacedStamp = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stampId,
      time,
      volume: 1.0,
    };
    setStamps((prev) => [...prev, newStamp]);
  };

  const handleRemoveStamp = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateStampTime = (id: string, time: number) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, time } : s))
    );
  };

  const handleUpdateStampVolume = (id: string, volume: number) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, volume } : s))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-16">
      {/* Liquid Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent my-0">
                Voice Stamp Studio
              </h1>
              <p className="text-xs text-slate-400">音声録音・ノイズ除去・効果音スタンプ＆ボイスチェンジャー</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Web Audio API 完全対応</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-8">
        {/* Step 1: Input Audio */}
        <AudioInputSection
          audioSource={audioSource}
          onAudioLoaded={(source) => {
            setAudioSource(source);
            setCurrentTime(0);
          }}
        />

        {/* Step 2: Voice Transformation & Noise Gate Controls */}
        <VoiceControlsSection
          settings={settings}
          onChangeSettings={setSettings}
        />

        {/* Step 3: Stamp Timeline Palette */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">3. 音スタンプの配置タイムライン</h2>
              <p className="text-xs text-slate-400">拍手、風船の割れる音、歓声などのスタンプを自由な時間に配置できます</p>
            </div>
          </div>

          <StampTimeline
            stamps={stamps}
            totalDuration={audioSource ? audioSource.duration : 10}
            currentTime={currentTime}
            onAddStamp={handleAddStamp}
            onRemoveStamp={handleRemoveStamp}
            onUpdateStampTime={handleUpdateStampTime}
            onUpdateStampVolume={handleUpdateStampVolume}
          />
        </div>

        {/* Step 4: Ambient BGM */}
        <AmbientSelector
          settings={settings}
          onChangeSettings={setSettings}
        />

        {/* Step 5: Audio Export & Player */}
        <AudioPlayerSection
          audioSource={audioSource}
          settings={settings}
          stamps={stamps}
          onCurrentTimeChange={setCurrentTime}
        />
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-600">
        <p>Voice Stamp Studio &copy; {new Date().getFullYear()} - Processed entirely client-side with Web Audio API</p>
      </footer>
    </div>
  );
}

export default App;
