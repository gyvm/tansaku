/**
 * Noise Reduction & Audio Filtering Utilities using Web Audio API nodes
 */

export interface NoiseFilterOptions {
  highpassFreq: number; // Low-cut frequency (e.g., 100Hz)
  gateThresholdDb: number; // Noise gate threshold (e.g., -50dB)
}

/**
 * Applies offline noise reduction (Low-cut / Highpass Filter & Noise Gate) to an AudioBuffer
 */
export async function applyNoiseReductionToBuffer(
  sourceBuffer: AudioBuffer,
  options: NoiseFilterOptions = { highpassFreq: 100, gateThresholdDb: -50 }
): Promise<AudioBuffer> {
  const sampleRate = sourceBuffer.sampleRate;
  const length = sourceBuffer.length;
  const numberOfChannels = sourceBuffer.numberOfChannels;

  const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate);

  // 1. Create Audio Buffer Source
  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;

  // 2. Highpass Filter (Remove low-frequency hums, HVAC noise)
  const highpassNode = offlineCtx.createBiquadFilter();
  highpassNode.type = 'highpass';
  highpassNode.frequency.value = options.highpassFreq;

  // 3. Notch Filter for 50Hz/60Hz AC hum
  const notchNode50 = offlineCtx.createBiquadFilter();
  notchNode50.type = 'notch';
  notchNode50.frequency.value = 50;
  notchNode50.Q.value = 10;

  const notchNode60 = offlineCtx.createBiquadFilter();
  notchNode60.type = 'notch';
  notchNode60.frequency.value = 60;
  notchNode60.Q.value = 10;

  // Connect Nodes
  sourceNode.connect(highpassNode);
  highpassNode.connect(notchNode50);
  notchNode50.connect(notchNode60);
  notchNode60.connect(offlineCtx.destination);

  sourceNode.start(0);

  // Render processed buffer
  const filteredBuffer = await offlineCtx.startRendering();

  // 4. Apply Noise Gate mathematically on PCM channel data to mute quiet background static
  const thresholdLinear = Math.pow(10, options.gateThresholdDb / 20);
  const releaseSamples = Math.floor(sampleRate * 0.05); // 50ms smooth fade

  const finalBuffer = new AudioBuffer({ length, numberOfChannels, sampleRate });

  for (let ch = 0; ch < numberOfChannels; ch++) {
    const inputData = filteredBuffer.getChannelData(ch);
    const outputData = finalBuffer.getChannelData(ch);

    let fadeGain = 1.0;

    for (let i = 0; i < length; i++) {
      const sample = inputData[i];
      const absSample = Math.abs(sample);

      if (absSample < thresholdLinear) {
        // Below threshold: smooth attenuation
        fadeGain = Math.max(0, fadeGain - 1 / releaseSamples);
      } else {
        // Above threshold: restore full volume
        fadeGain = Math.min(1.0, fadeGain + 1 / releaseSamples);
      }

      outputData[i] = sample * fadeGain;
    }
  }

  return finalBuffer;
}
