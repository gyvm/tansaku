import type { SoundStampDef, AmbientSoundDef } from '../types/audio';

export const SOUND_STAMPS: SoundStampDef[] = [
  { id: 'applause', name: '拍手', emoji: '👏', category: 'reaction', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'balloon', name: '風船割り', emoji: '🎈', category: 'effect', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'chime', name: 'ピンポン', emoji: '🔔', category: 'effect', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { id: 'taiko', name: 'ドン！(太鼓)', emoji: '🥁', category: 'instrument', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'laugh', name: '笑い声', emoji: '😆', category: 'reaction', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'cheer', name: '歓声', emoji: '🎉', category: 'reaction', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'question', name: 'ピコーン', emoji: '💡', category: 'funny', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'fanfare', name: 'ファンファーレ', emoji: '🎺', category: 'instrument', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
];

export const AMBIENT_SOUNDS: AmbientSoundDef[] = [
  { id: 'cafe', name: 'カフェの雑踏', icon: '☕', description: 'カップの触れ合う音と静かな談笑', category: 'urban' },
  { id: 'waves', name: '波の音', icon: '🌊', description: '寄せては返す静かな波のサウンド', category: 'nature' },
  { id: 'rain', name: 'しとしと雨', icon: '🌧️', description: '窓を叩く落ち着く雨の音', category: 'weather' },
  { id: 'forest', name: '森の小鳥', icon: '🌲', description: '木漏れ日と小鳥のさえずり', category: 'nature' },
  { id: 'city', name: '街角の空気感', icon: '🏙️', description: '賑やかな都市のバックグラウンド', category: 'urban' },
];

/**
 * Synthesize Sound Stamp AudioBuffer using Web Audio API procedural synthesis
 */
export async function generateStampBuffer(stampId: string, sampleRate = 44100): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(2, sampleRate * 2.5, sampleRate);

  switch (stampId) {
    case 'applause': {
      // Multiple noise bursts with randomized panning and filters
      const duration = 2.0;
      const buffer = offlineCtx.createBuffer(2, sampleRate * duration, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          const t = i / sampleRate;
          const envelope = Math.exp(-t * 1.8);
          // Random claps
          const clap = (Math.random() * 2 - 1) * (Math.random() > 0.92 ? 1 : 0.15);
          data[i] = clap * envelope * 0.8;
        }
      }
      return buffer;
    }

    case 'balloon': {
      // Sharp pop with fast pitch drop
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, 0);
      osc.frequency.exponentialRampToValueAtTime(40, 0.08);

      gain.gain.setValueAtTime(1.0, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 0.2);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);

      osc.start(0);
      osc.stop(0.25);
      return await offlineCtx.startRendering();
    }

    case 'chime': {
      // Dual-tone Ding-Dong chime
      const duration = 1.5;
      const bufferCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const playTone = (freq: number, startTime: number) => {
        const osc = bufferCtx.createOscillator();
        const gain = bufferCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.8, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(bufferCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.2);
      };

      playTone(1046.5, 0); // C6
      playTone(783.99, 0.25); // G5

      return await bufferCtx.startRendering();
    }

    case 'taiko': {
      // Deep punchy bass drum
      const duration = 1.2;
      const bufferCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const osc = bufferCtx.createOscillator();
      const gain = bufferCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, 0);
      osc.frequency.exponentialRampToValueAtTime(40, 0.2);

      gain.gain.setValueAtTime(1.2, 0);
      gain.gain.exponentialRampToValueAtTime(0.001, 1.0);

      osc.connect(gain);
      gain.connect(bufferCtx.destination);

      osc.start(0);
      osc.stop(1.0);

      return await bufferCtx.startRendering();
    }

    case 'question': {
      // Rapid ascending arpeggio
      const duration = 0.6;
      const bufferCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const osc = bufferCtx.createOscillator();
        const gain = bufferCtx.createGain();
        const startTime = idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startTime);
        gain.gain.setValueAtTime(0.6, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        osc.connect(gain);
        gain.connect(bufferCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });

      return await bufferCtx.startRendering();
    }

    case 'fanfare': {
      // Brass fanfare chord
      const duration = 1.8;
      const bufferCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const chord = [523.25, 659.25, 783.99, 1046.5]; // C major
      chord.forEach((f) => {
        const osc = bufferCtx.createOscillator();
        const gain = bufferCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, 0);

        const filter = bufferCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, 0);

        gain.gain.setValueAtTime(0.3, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(bufferCtx.destination);

        osc.start(0);
        osc.stop(1.5);
      });

      return await bufferCtx.startRendering();
    }

    case 'laugh':
    case 'cheer':
    default: {
      // Synthetic cheerful crowd / laugh
      const duration = 2.0;
      const bufferCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const freqs = [300, 420, 550, 680];
      freqs.forEach((f, idx) => {
        const osc = bufferCtx.createOscillator();
        const gain = bufferCtx.createGain();
        osc.type = 'sine';
        const start = idx * 0.15;
        osc.frequency.setValueAtTime(f, start);
        osc.frequency.linearRampToValueAtTime(f + 100, start + 0.2);
        osc.frequency.linearRampToValueAtTime(f, start + 0.4);

        gain.gain.setValueAtTime(0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

        osc.connect(gain);
        gain.connect(bufferCtx.destination);

        osc.start(start);
        osc.stop(start + 1.2);
      });

      return await bufferCtx.startRendering();
    }
  }
}

/**
 * Generates ambient sound texture buffer
 */
export async function generateAmbientBuffer(ambientId: string, durationSeconds = 10, sampleRate = 44100): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);
  const length = sampleRate * durationSeconds;
  const buffer = offlineCtx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      if (ambientId === 'rain') {
        // Soft white noise filtered
        data[i] = (Math.random() * 2 - 1) * 0.15;
      } else if (ambientId === 'waves') {
        // Sine-modulated noise
        const mod = Math.sin(t * 0.4) * 0.5 + 0.5;
        data[i] = (Math.random() * 2 - 1) * 0.2 * mod;
      } else if (ambientId === 'cafe') {
        // Cafe chatter/hum
        const hum = Math.sin(t * 120 * Math.PI) * 0.05;
        const clink = Math.random() > 0.998 ? (Math.random() * 2 - 1) * 0.4 : 0;
        data[i] = (Math.random() * 2 - 1) * 0.08 + hum + clink;
      } else if (ambientId === 'forest') {
        // Bird chirps + wind
        const wind = (Math.random() * 2 - 1) * 0.05;
        const chirp = Math.sin(t * 3000 * Math.PI) * (Math.sin(t * 8) > 0.8 ? 0.1 : 0);
        data[i] = wind + chirp;
      } else {
        // City ambiance
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
    }
  }

  return buffer;
}
