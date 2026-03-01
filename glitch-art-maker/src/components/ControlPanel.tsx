import React from 'react';
import { Settings, Save, RotateCcw, Upload, Grid, Zap, Layers } from 'lucide-react';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { GlitchSettings } from '../effects/types';

interface ControlPanelProps {
  settings: GlitchSettings;
  updateSetting: (key: keyof GlitchSettings, value: any) => void;
  onApplyPreset: (name: string) => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadClick: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  updateSetting,
  onApplyPreset,
  onReset,
  onDownload,
  onUploadClick
}) => {
  // Helper to handle slider change for nested properties
  const handleSliderChange = (key: keyof GlitchSettings, strength: number) => {
    updateSetting(key, { ...settings[key], strength });
  };

  return (
    <aside className="w-80 bg-surface border-r border-surfaceVariant flex flex-col h-full z-20 shadow-2xl">
      <div className="p-4 border-b border-surfaceVariant flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        <h2 className="font-mono text-sm font-bold tracking-wider text-text">CONTROLS</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={onUploadClick} className="border border-surfaceVariant group">
            <Upload className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" /> NEW
          </Button>
           <Button variant="ghost" size="sm" onClick={onReset} className="border border-surfaceVariant text-textMuted hover:text-accent group">
            <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" /> RESET
          </Button>
        </div>

        {/* Effects Group 1: Distortion */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono text-textMuted uppercase border-b border-surfaceVariant pb-1 flex items-center gap-2">
            <Grid className="w-3 h-3 text-secondary" /> Distortion
          </h3>

          <div className="space-y-6 pl-2 border-l-2 border-surfaceVariant/30">
            <Slider
              label="Scanlines"
              value={settings.scanline.strength}
              onChange={(e) => handleSliderChange('scanline', Number(e.target.value))}
            />
             <Slider
              label="RGB Shift"
              value={settings.rgbSplit.strength}
              onChange={(e) => handleSliderChange('rgbSplit', Number(e.target.value))}
            />
             <Slider
              label="Slice Shift"
              value={settings.sliceShift.strength}
              onChange={(e) => handleSliderChange('sliceShift', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Effects Group 2: Noise & texture */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono text-textMuted uppercase border-b border-surfaceVariant pb-1 flex items-center gap-2">
             <Zap className="w-3 h-3 text-primary" /> Texture
          </h3>

          <div className="space-y-6 pl-2 border-l-2 border-surfaceVariant/30">
            <Slider
              label="Digital Noise"
              value={settings.noise.strength}
              onChange={(e) => handleSliderChange('noise', Number(e.target.value))}
            />
             <Slider
              label="Pixel Sort"
              value={settings.pixelSort.strength}
              onChange={(e) => handleSliderChange('pixelSort', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-textMuted uppercase border-b border-surfaceVariant pb-1 flex items-center gap-2">
            <Layers className="w-3 h-3 text-accent" /> Presets
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {['CYBERPUNK MILD', 'BROKEN SIGNAL', 'NEON NIGHTMARE'].map((preset) => (
              <button
                key={preset}
                onClick={() => onApplyPreset(preset)}
                className="text-left px-3 py-2 text-xs font-mono border border-surfaceVariant/50 bg-surfaceVariant/10 hover:bg-primary/10 hover:border-primary/50 text-textMuted hover:text-primary transition-all duration-200"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

      </div>

      <div className="p-4 border-t border-surfaceVariant bg-surfaceVariant/30">
        <Button className="w-full flex items-center justify-center gap-2" onClick={onDownload}>
          <Save className="w-4 h-4" />
          DOWNLOAD PNG
        </Button>
      </div>
    </aside>
  );
};
