import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { DEFAULT_SETTINGS, GlitchSettings } from './effects/types';
import { PRESETS } from './effects/presets';
import { useGlitchCanvas } from './hooks/useGlitchCanvas';

function App() {
  const [settings, setSettings] = useState<GlitchSettings>(DEFAULT_SETTINGS);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Custom hook for image processing
  const { processFile, isProcessing, hasImage } = useGlitchCanvas({
    canvasRef,
    settings
  });

  const updateSetting = (key: keyof GlitchSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESETS[presetName];
    if (preset) {
      setSettings(preset);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleDownload = () => {
    if (!hasImage || !canvasRef.current) {
      alert("ダウンロードする画像がありません。画像をアップロードしてください。");
      return;
    }

    // Create download link
    const link = document.createElement('a');
    link.download = `glitch-art-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-text overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <ControlPanel
          settings={settings}
          updateSetting={updateSetting}
          onApplyPreset={applyPreset}
          onReset={handleReset}
          onDownload={handleDownload}
          onUploadClick={triggerUpload}
        />

        <CanvasPreview
          canvasRef={canvasRef}
          hasImage={hasImage}
          onUpload={handleUploadChange}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}

export default App;
