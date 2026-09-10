import type { VoicePreset } from '../types/audio';

/**
 * Utility functions for Pitch Shifting and Voice Transformer Effects
 */

export interface VoiceEffectNodes {
  inputNode: AudioNode;
  outputNode: AudioNode;
}

/**
 * Calculates playbackRate based on semitone shift (-12 to +12)
 */
export function semitonesToRate(semitones: number): number {
  return Math.pow(2, semitones / 12);
}

/**
 * Builds Web Audio API node chain according to voice preset
 */
export function applyVoicePresetEffects(
  ctx: BaseAudioContext,
  preset: VoicePreset
): { inputNode: AudioNode; outputNode: AudioNode; playbackRateMultiplier: number } {
  let playbackRateMultiplier = 1.0;

  switch (preset) {
    case 'robot': {
      // Ring Modulator + Slight Delay Effect
      playbackRateMultiplier = 1.0;
      const input = ctx.createGain();
      const output = ctx.createGain();

      // Ring Modulator Carrier Oscillator
      const carrier = ctx.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.value = 50; // 50Hz carrier for metallic robot tone
      carrier.start();

      const carrierGain = ctx.createGain();
      carrierGain.gain.value = 0.5;

      carrier.connect(carrierGain.gain);
      input.connect(carrierGain);

      // Add a slight delay for robotic chorus
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.015; // 15ms

      carrierGain.connect(output);
      carrierGain.connect(delay);
      delay.connect(output);

      return { inputNode: input, outputNode: output, playbackRateMultiplier };
    }

    case 'criminal': {
      // Pitch down, distortion / lowpass filter, dark ambiance
      playbackRateMultiplier = 0.75; // Lower pitch
      const input = ctx.createGain();
      const output = ctx.createGain();

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1200; // Cut high bright frequencies

      // Waveshaper distortion
      const waveshaper = ctx.createWaveShaper();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      waveshaper.curve = createDistortionCurve(15) as any;

      input.connect(lowpass);
      lowpass.connect(waveshaper);
      waveshaper.connect(output);

      return { inputNode: input, outputNode: output, playbackRateMultiplier };
    }

    case 'helium': {
      // High pitch shift + Highpass brightness
      playbackRateMultiplier = 1.45; // High pitch
      const input = ctx.createGain();
      const output = ctx.createGain();

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 350;

      const peaking = ctx.createBiquadFilter();
      peaking.type = 'peaking';
      peaking.frequency.value = 3000;
      peaking.gain.value = 6;

      input.connect(highpass);
      highpass.connect(peaking);
      peaking.connect(output);

      return { inputNode: input, outputNode: output, playbackRateMultiplier };
    }

    case 'radio': {
      // Walkie-talkie / Bandpass filter + distortion
      playbackRateMultiplier = 1.0;
      const input = ctx.createGain();
      const output = ctx.createGain();

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1800; // Telephonic band
      bandpass.Q.value = 1.5;

      const waveshaper = ctx.createWaveShaper();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      waveshaper.curve = createDistortionCurve(25) as any;

      input.connect(bandpass);
      bandpass.connect(waveshaper);
      waveshaper.connect(output);

      return { inputNode: input, outputNode: output, playbackRateMultiplier };
    }

    case 'monster': {
      // Ultra low pitch + Reverb delay
      playbackRateMultiplier = 0.65; // Very deep
      const input = ctx.createGain();
      const output = ctx.createGain();

      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 250;
      lowShelf.gain.value = 8; // Boost bass

      const delay = ctx.createDelay();
      delay.delayTime.value = 0.08; // 80ms monster echo

      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;

      input.connect(lowShelf);
      lowShelf.connect(output);

      lowShelf.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(output);

      return { inputNode: input, outputNode: output, playbackRateMultiplier };
    }

    case 'normal':
    default: {
      const node = ctx.createGain();
      return { inputNode: node, outputNode: node, playbackRateMultiplier: 1.0 };
    }
  }
}

/**
 * Helper to generate distortion curves for WaveShaper
 */
function createDistortionCurve(amount: number): Float32Array {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
