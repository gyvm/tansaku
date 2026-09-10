export interface SoundStampDef {
  id: string;
  name: string;
  emoji: string;
  icon?: string;
  category: 'effect' | 'reaction' | 'instrument' | 'funny';
  color: string;
}

export interface PlacedStamp {
  id: string;
  stampId: string;
  time: number; // in seconds
  volume: number; // 0.0 to 2.0
}

export interface AmbientSoundDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'nature' | 'urban' | 'weather';
}

export type VoicePreset = 'normal' | 'robot' | 'criminal' | 'helium' | 'radio' | 'monster';

export interface AudioProcessingSettings {
  pitchSemiTones: number; // -12 to +12
  preset: VoicePreset;
  enableNoiseReduction: boolean;
  noiseGateThresholdDb: number; // -80 to -10 dB
  highpassFreqHz: number; // e.g., 80 to 200 Hz
  ambientSoundId: string | null;
  ambientVolume: number; // 0.0 to 1.0
  mainVolume: number; // 0.0 to 2.0
}

export interface AudioSourceInfo {
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  name: string;
}
