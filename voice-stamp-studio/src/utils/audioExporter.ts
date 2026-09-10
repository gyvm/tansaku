import type { AudioProcessingSettings, PlacedStamp } from '../types/audio';
import { applyNoiseReductionToBuffer } from './noiseFilter';
import { applyVoicePresetEffects, semitonesToRate } from './voiceTransformer';
import { generateStampBuffer, generateAmbientBuffer } from './soundSynthesis';

/**
 * Renders the entire composition (Main voice + Pitch/Preset + Stamps + Ambient BGM) into an AudioBuffer
 */
export async function renderComposition(
  rawSourceBuffer: AudioBuffer,
  settings: AudioProcessingSettings,
  stamps: PlacedStamp[]
): Promise<AudioBuffer> {
  const sampleRate = rawSourceBuffer.sampleRate;

  // 1. Noise Filter step on main source
  let voiceBuffer = rawSourceBuffer;
  if (settings.enableNoiseReduction) {
    voiceBuffer = await applyNoiseReductionToBuffer(rawSourceBuffer, {
      highpassFreq: settings.highpassFreqHz,
      gateThresholdDb: settings.noiseGateThresholdDb,
    });
  }

  // 2. Calculate total pitch rate using temporary BaseAudioContext-less check
  const tempCtx = new OfflineAudioContext(1, 1, sampleRate);
  const presetResultForRate = applyVoicePresetEffects(tempCtx, settings.preset);
  const totalPitchRate = semitonesToRate(settings.pitchSemiTones) * presetResultForRate.playbackRateMultiplier;
  const effectiveVoiceDuration = voiceBuffer.duration / totalPitchRate;

  // Calculate total duration including any placed stamps
  let maxStampEndTime = 0;
  stamps.forEach((s) => {
    maxStampEndTime = Math.max(maxStampEndTime, s.time + 2.5); // stamps default max 2.5s
  });

  const totalDuration = Math.max(effectiveVoiceDuration, maxStampEndTime, 1.0);
  const totalFrames = Math.ceil(totalDuration * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate);

  // 3. Connect Main Voice Branch
  const voiceSource = offlineCtx.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  voiceSource.playbackRate.value = totalPitchRate;

  const presetFx = applyVoicePresetEffects(offlineCtx, settings.preset);
  const voiceGain = offlineCtx.createGain();
  voiceGain.gain.value = settings.mainVolume;

  voiceSource.connect(presetFx.inputNode);
  presetFx.outputNode.connect(voiceGain);
  voiceGain.connect(offlineCtx.destination);

  voiceSource.start(0);

  // 4. Connect Ambient BGM Branch if active
  if (settings.ambientSoundId && settings.ambientVolume > 0) {
    const ambientBuffer = await generateAmbientBuffer(settings.ambientSoundId, totalDuration, sampleRate);
    const ambientSource = offlineCtx.createBufferSource();
    ambientSource.buffer = ambientBuffer;

    const ambientGain = offlineCtx.createGain();
    ambientGain.gain.value = settings.ambientVolume;

    ambientSource.connect(ambientGain);
    ambientGain.connect(offlineCtx.destination);
    ambientSource.start(0);
  }

  // 5. Connect Placed Sound Stamps
  for (const stamp of stamps) {
    const stampBuffer = await generateStampBuffer(stamp.stampId, sampleRate);
    const stampSource = offlineCtx.createBufferSource();
    stampSource.buffer = stampBuffer;

    const stampGain = offlineCtx.createGain();
    stampGain.gain.value = stamp.volume;

    stampSource.connect(stampGain);
    stampGain.connect(offlineCtx.destination);

    stampSource.start(stamp.time);
  }

  // Render composite audio
  return await offlineCtx.startRendering();
}

/**
 * Encodes AudioBuffer into WAV format Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const dataLength = result.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, dataLength, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
