// ストリーミング処理の小道具。

/**
 * AsyncIterable を即座に読み始め、結果をバッファしておく。
 * TTS を「前のチャンクの再生中に次のチャンクを先行生成する」ために使う。
 */
export function prefetch<T>(source: AsyncIterable<T>): AsyncIterable<T> {
  const buffer: T[] = [];
  let finished = false;
  let failure: unknown = null;
  let wake: (() => void) | null = null;

  const notify = () => {
    const w = wake;
    wake = null;
    w?.();
  };

  void (async () => {
    try {
      for await (const item of source) {
        buffer.push(item);
        notify();
      }
    } catch (e) {
      failure = e;
    } finally {
      finished = true;
      notify();
    }
  })();

  return {
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (buffer.length > 0) {
          yield buffer.shift() as T;
          continue;
        }
        if (failure) throw failure;
        if (finished) return;
        await new Promise<void>((resolve) => (wake = resolve));
      }
    },
  };
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
