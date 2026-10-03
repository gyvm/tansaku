/**
 * Gemini TTS (Text-to-Speech) ストリーミングクライアント
 * models/gemini-3.8-flash-lite-tts を使用して、低遅延に PCM 24kHz 音声をストリーミング生成します。
 */

export interface GeminiTTSOptions {
  apiKey: string;
  model?: string;
  voiceName?: string;
}

export class GeminiTTSStreamer {
  private apiKey: string;
  private model: string;
  private voiceName: string;

  constructor(options: GeminiTTSOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model || "gemini-3.8-flash-lite-tts";
    this.voiceName = options.voiceName || "Kore";
  }

  /**
   * テキストを音声合成し、PCM チャンクが届くたびに onChunk を呼ぶ
   */
  public async streamTTS(
    text: string,
    abortSignal: AbortSignal,
    onChunk: (chunk: Buffer) => void,
    onFinish: () => void,
    onError: (err: Error) => void
  ) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse`;
      const body = {
        contents: [
          {
            parts: [{ text }]
          }
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.voiceName
              }
            }
          }
        }
      };

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "x-goog-api-key": this.apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: abortSignal
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Gemini TTS API status ${resp.status}: ${errText}`);
      }

      if (!resp.body) {
        throw new Error("No response body received from Gemini TTS");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let bufferStr = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        bufferStr += decoder.decode(value, { stream: true });
        const lines = bufferStr.split("\n");
        bufferStr = lines.pop() || ""; // 末尾の不完全行を保持

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6);
          try {
            const chunkObj = JSON.parse(jsonStr);
            if (chunkObj.error) {
              throw new Error(chunkObj.error.message || "Gemini TTS error");
            }

            for (const cand of chunkObj.candidates || []) {
              for (const part of cand.content?.parts || []) {
                if (part.inlineData?.data) {
                  const pcmBytes = Buffer.from(part.inlineData.data, "base64");
                  if (pcmBytes.length > 0) {
                    onChunk(pcmBytes);
                  }
                }
              }
            }
          } catch (e: any) {
            // パースエラーはスキップ
          }
        }
      }

      onFinish();
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      onError(err);
    }
  }
}
