export interface MicChunk {
  /** 16kHz / 16bit / mono PCM（100ms 分） */
  pcm: Int16Array;
  /** 0〜1 の音量 */
  rms: number;
  /** このチャンクを受け取った時刻（performance.now） */
  at: number;
}

export interface Mic {
  stop(): void;
}

export async function startMic(ctx: AudioContext, onChunk: (chunk: MicChunk) => void): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      // AI の声をマイクが拾って STT が反応するのを防ぐ（ヘッドセット推奨）
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  await ctx.audioWorklet.addModule("/pcm-capture-worklet.js");
  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm-capture");
  node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
    onChunk({ pcm: new Int16Array(e.data.pcm), rms: e.data.rms, at: performance.now() });
  };
  // ワークレットを確実に駆動させるため、無音で destination につなぐ
  const mute = ctx.createGain();
  mute.gain.value = 0;
  source.connect(node).connect(mute).connect(ctx.destination);

  return {
    stop() {
      node.port.onmessage = null;
      source.disconnect();
      node.disconnect();
      mute.disconnect();
      stream.getTracks().forEach((t) => t.stop());
    },
  };
}
