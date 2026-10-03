import { DocumentSearchEngine } from "./doc_search.js";
import { GeminiDialogEngine } from "./gemini_dialog.js";
import { GeminiTTSStreamer } from "./gemini_tts.js";
import { predictResponse } from "./knowledge.js";

export type StreamTier = "prefix" | "payload" | "full";

export interface SpeculativeStreamInfo {
  streamId: number;
  tier: StreamTier;
  triggerText: string;
  predictedResponse: string;
  sourceDoc: string;
  startedAt: number;
  bufferedBytes: number;
  chunksCount: number;
  isCommitted: boolean;
  isAborted: boolean;
}

export type TTSEngineType = "gemini" | "elevenlabs";

export class SpeculativeStream {
  public streamId: number;
  public tier: StreamTier;
  public triggerText: string;
  public predictedResponse: string;
  public sourceDoc: string;
  public startedAt: number;
  public chunks: Buffer[] = [];
  public bufferedBytes = 0;
  public isCommitted = false;
  public isAborted = false;
  public onLiveChunk?: (chunk: Buffer) => void;
  private abortController: AbortController;

  constructor(
    streamId: number,
    tier: StreamTier,
    triggerText: string,
    predictedResponse: string,
    sourceDoc: string,
    ttsEngine: TTSEngineType,
    geminiKey: string,
    elevenLabsKey: string,
    elevenLabsVoiceId: string,
    onChunk: (chunk: Buffer) => void,
    onFinish: () => void,
    onError: (err: Error) => void
  ) {
    this.streamId = streamId;
    this.tier = tier;
    this.triggerText = triggerText;
    this.predictedResponse = predictedResponse;
    this.sourceDoc = sourceDoc;
    this.startedAt = Date.now();
    this.abortController = new AbortController();

    if (ttsEngine === "gemini" && geminiKey) {
      const streamer = new GeminiTTSStreamer({
        apiKey: geminiKey,
        model: "gemini-3.8-flash-lite-tts",
        voiceName: "Kore"
      });
      streamer.streamTTS(
        this.predictedResponse,
        this.abortController.signal,
        (chunk) => {
          this.chunks.push(chunk);
          this.bufferedBytes += chunk.length;
          onChunk(chunk);
          if (this.onLiveChunk) this.onLiveChunk(chunk);
        },
        onFinish,
        onError
      );
    } else {
      this.startElevenLabs(elevenLabsKey, elevenLabsVoiceId, onChunk, onFinish, onError);
    }
  }

  private async startElevenLabs(
    apiKey: string,
    voiceId: string,
    onChunk: (chunk: Buffer) => void,
    onFinish: () => void,
    onError: (err: Error) => void
  ) {
    try {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=pcm_24000`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: this.predictedResponse,
          model_id: "eleven_turbo_v2_5"
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs status ${response.status}: ${errorText}`);
      }

      if (!response.body) return;
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done || this.isAborted) break;
        if (value && value.length > 0) {
          const buf = Buffer.from(value);
          this.chunks.push(buf);
          this.bufferedBytes += buf.length;
          onChunk(buf);
          if (this.onLiveChunk) this.onLiveChunk(buf);
        }
      }
      onFinish();
    } catch (err: any) {
      if (err.name === "AbortError") return;
      onError(err);
    }
  }

  public abort() {
    this.isAborted = true;
    try {
      this.abortController.abort();
    } catch {
      // ignore
    }
  }

  public toInfo(): SpeculativeStreamInfo {
    return {
      streamId: this.streamId,
      tier: this.tier,
      triggerText: this.triggerText,
      predictedResponse: this.predictedResponse,
      sourceDoc: this.sourceDoc,
      startedAt: this.startedAt,
      bufferedBytes: this.bufferedBytes,
      chunksCount: this.chunks.length,
      isCommitted: this.isCommitted,
      isAborted: this.isAborted
    };
  }
}

/**
 * 投機ストリームのセマンティック検証器（Commit Verifier）
 * 単に「バッファがあるか」ではなく、発話全文（Final Text）の意図・トピックと合致しているかを判定
 */
export class CommitVerifier {
  public static verify(finalText: string, stream: SpeculativeStream): { isValid: boolean; reason: string } {
    const fLower = finalText.toLowerCase();
    const sourceLower = stream.sourceDoc.toLowerCase();
    const respLower = stream.predictedResponse.toLowerCase();

    // 1. Prefix（相槌・クッション）ストリームの検証
    if (stream.tier === "prefix") {
      // 児童手当の文脈なのに全く別のトピック相槌になっていないか？
      if (/児童手当/.test(fLower) && !/児童手当|子|赤ちゃん/.test(respLower + sourceLower)) {
        return { isValid: false, reason: "Prefix topic mismatch for child allowance" };
      }
      if (/暗証番号/.test(fLower) && !/暗証番号|マイナ|カード/.test(respLower + sourceLower)) {
        return { isValid: false, reason: "Prefix topic mismatch for PIN reset" };
      }
      if (/住民票/.test(fLower) && !/住民票|引越|転入/.test(respLower + sourceLower)) {
        return { isValid: false, reason: "Prefix topic mismatch for resident cert" };
      }
      return { isValid: true, reason: "Valid prefix stream" };
    }

    // 2. Full / Payload ストリームのトピック競合検証
    const coreTopics = [
      { key: "児童手当", regex: /児童手当/ },
      { key: "保育園", regex: /保育園|こども園/ },
      { key: "出生届", regex: /出生届/ },
      { key: "婚姻届", regex: /婚姻|結婚/ },
      { key: "住民票", regex: /住民票/ },
      { key: "暗証番号", regex: /暗証番号/ },
      { key: "国民健康保険", regex: /国保|国民健康保険/ },
      { key: "大型ごみ", regex: /大型ごみ|粗大/ }
    ];

    for (const t of coreTopics) {
      if (t.regex.test(fLower)) {
        const matches = t.regex.test(sourceLower) || t.regex.test(respLower);
        if (!matches) {
          return {
            isValid: false,
            reason: `Topic mismatch: user specified [${t.key}], but stream is about [${stream.sourceDoc}]`
          };
        }
      }
    }

    // 疑問詞アスペクト検証（必要書類を求めているのに、窓口や時期だけしか触れていない等）
    if (/何が必要|持ち物|書類|持参/.test(fLower)) {
      if (!/書類|もの|持参|お持ち|通帳|番号|確認書類|保険証|カード/.test(respLower)) {
        return { isValid: false, reason: "Aspect mismatch: requirements expected" };
      }
    }

    return { isValid: true, reason: "Topic and aspect match" };
  }
}

export class SpeculativeStreamManager {
  private geminiKey: string;
  private elevenLabsKey: string;
  private elevenLabsVoiceId: string;
  private ttsEngine: TTSEngineType;
  private searchEngine: DocumentSearchEngine;
  private dialogEngine: GeminiDialogEngine;

  private streamCounter = 0;
  private activeStreams: Map<number, SpeculativeStream> = new Map();
  private lastTriggerText = "";
  private conversationHistory: string[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;

  public onStreamUpdate?: (streams: SpeculativeStreamInfo[]) => void;
  public onWinnerReady?: (winner: SpeculativeStream, initialChunks: Buffer[], latencyMs: number) => void;
  public onWinnerChunk?: (chunk: Buffer) => void;
  public onWinnerUpdated?: (fullResponse: string, sourceDoc: string) => void;

  constructor(
    geminiKey: string,
    elevenLabsKey: string,
    elevenLabsVoiceId = "EXAVITQu4vr4xnSDxMaL",
    ttsEngine: TTSEngineType = "gemini",
    docsDir = "./docs"
  ) {
    this.geminiKey = geminiKey;
    this.elevenLabsKey = elevenLabsKey;
    this.elevenLabsVoiceId = elevenLabsVoiceId;
    this.ttsEngine = ttsEngine;

    this.searchEngine = new DocumentSearchEngine(docsDir);
    this.dialogEngine = new GeminiDialogEngine(this.geminiKey, this.searchEngine, "gemini-3.5-flash-lite");
  }

  public setTTSEngine(engine: TTSEngineType) {
    this.ttsEngine = engine;
    console.log(`[TTS Engine Switched] -> ${engine}`);
  }

  public resetContext() {
    this.abortAllStreams();
    this.conversationHistory = [];
    this.lastTriggerText = "";
  }

  /**
   * ユーザーの発話テキスト進捗を受信
   */
  public handleUserTranscript(text: string, isFinal: boolean) {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isFinal) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.commitBestStream(trimmed);
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 200ms デバウンスで、発話途中のクッション相槌（Prefix）ストリームを先行投機
    this.debounceTimer = setTimeout(() => {
      this.spawnSpeculativePrefixIfNeeded(trimmed);
    }, 200);
  }

  /**
   * 発話途中：結論を決め打ちせず、共感・相槌（Tier-1 Prefix）のみを投機ストリーミング
   */
  private async spawnSpeculativePrefixIfNeeded(currentText: string) {
    if (Math.abs(currentText.length - this.lastTriggerText.length) < 2 && this.lastTriggerText !== "") {
      return;
    }
    this.lastTriggerText = currentText;

    // クッション相槌セリフの高速取得（辞書または軽量プロンプト）
    const prefixResult = await this.dialogEngine.generatePrefixScript(currentText, this.conversationHistory);
    const speechScript = prefixResult.speech;
    const sourceDoc = prefixResult.sourceDocs.join(", ") || "市役所受付";

    // 既に同じセリフで生成中のアクティブストリームがあれば重複起動しない
    for (const existing of this.activeStreams.values()) {
      if (!existing.isAborted && existing.predictedResponse === speechScript) {
        return;
      }
    }

    const streamId = ++this.streamCounter;
    const stream = new SpeculativeStream(
      streamId,
      "prefix",
      currentText,
      speechScript,
      sourceDoc,
      this.ttsEngine,
      this.geminiKey,
      this.elevenLabsKey,
      this.elevenLabsVoiceId,
      () => this.notifyStreamsUpdate(),
      () => this.notifyStreamsUpdate(),
      (err) => console.error(`[Prefix Stream #${streamId}] Error:`, err.message)
    );

    this.activeStreams.set(streamId, stream);

    // 最大同時ストリーム数は3本。古い未コミットはアボート
    if (this.activeStreams.size > 3) {
      const oldestId = Math.min(...Array.from(this.activeStreams.keys()));
      const oldest = this.activeStreams.get(oldestId);
      if (oldest && !oldest.isCommitted) {
        oldest.abort();
        this.activeStreams.delete(oldestId);
      }
    }

    this.notifyStreamsUpdate();
  }

  /**
   * 発話終了時：
   * 1. 蓄積済みの合致するクッション相槌（Prefix）があれば即座に 0ms で再生開始！
   * 2. 並行して Final Text に基づく核心回答（Payload）を非同期生成し、PCMストリームにシームレス直結！
   */
  private async commitBestStream(finalText: string) {
    const startSelectTime = Date.now();

    // 1. CommitVerifier で合格した最新の Prefix ストリームを選定
    let prefixWinner: SpeculativeStream | null = null;
    for (const stream of Array.from(this.activeStreams.values()).reverse()) {
      if (!stream.isAborted && stream.bufferedBytes > 0) {
        const check = CommitVerifier.verify(finalText, stream);
        if (check.isValid) {
          prefixWinner = stream;
          break;
        } else {
          console.log(`[Stream #${stream.streamId} Rejected] ${check.reason}`);
          stream.abort();
        }
      }
    }

    if (prefixWinner) {
      // ==== 2段階ストリーミング・モード（Tier-1 Prefix -> Tier-2 Payload）====
      prefixWinner.isCommitted = true;
      const initialChunks = [...prefixWinner.chunks];
      const latencyMs = Date.now() - startSelectTime;

      // 他の古いストリームを即座に破棄
      for (const [id, stream] of this.activeStreams.entries()) {
        if (id !== prefixWinner.streamId) {
          stream.abort();
          this.activeStreams.delete(id);
        }
      }

      // クライアントへ即座にクッション相槌をフラッシュ再生（レイテンシ 0ms !）
      if (this.onWinnerReady) {
        this.onWinnerReady(prefixWinner, initialChunks, latencyMs);
      }

      prefixWinner.onLiveChunk = (chunk) => {
        if (this.onWinnerChunk) this.onWinnerChunk(chunk);
      };

      this.notifyStreamsUpdate();

      // 裏で並行して Final Text から核心回答（Payload）を非同期生成
      const prefixText = prefixWinner.predictedResponse;
      (async () => {
        try {
          const payloadResult = await this.dialogEngine.generatePayloadScript(finalText, this.conversationHistory);
          const fullResponse = `${prefixText} ${payloadResult.speech}`;
          const sourceDoc = payloadResult.sourceDocs.join(", ") || prefixWinner!.sourceDoc;

          this.conversationHistory.push(`市民: ${finalText}`, `AI: ${fullResponse}`);

          // Payload 音声ストリームを開始し、到着したチャンクをそのまま連続送信（Audio Stitching）
          const payloadStreamId = ++this.streamCounter;
          const payloadStream = new SpeculativeStream(
            payloadStreamId,
            "payload",
            finalText,
            payloadResult.speech,
            sourceDoc,
            this.ttsEngine,
            this.geminiKey,
            this.elevenLabsKey,
            this.elevenLabsVoiceId,
            () => {},
            () => {},
            (err) => console.error(`[Payload Stream #${payloadStreamId}] Error:`, err.message)
          );

          payloadStream.isCommitted = true;
          this.activeStreams.set(payloadStreamId, payloadStream);

          // 後続のチャンクをそのまま WebSocket 送出（ブラウザの WebAudio がシームレスに結合して再生）
          payloadStream.onLiveChunk = (chunk) => {
            if (this.onWinnerChunk) this.onWinnerChunk(chunk);
          };

          if (this.onWinnerUpdated) {
            this.onWinnerUpdated(fullResponse, sourceDoc);
          }

          this.notifyStreamsUpdate();
        } catch (err: any) {
          console.error("[Payload Chaining Error]", err);
        }
      })();

      return;
    }

    // ==== フォールバック：合致するPrefixがない場合は直結生成 ====
    console.log(`[Direct Fallback] Generating immediate full answer for: "${finalText}"`);
    const generated = await this.dialogEngine.generateSpeechScript(finalText, this.conversationHistory);
    const streamId = ++this.streamCounter;
    const fallbackStream = new SpeculativeStream(
      streamId,
      "full",
      finalText,
      generated.speech,
      generated.sourceDocs.join(", ") || "市役所窓口",
      this.ttsEngine,
      this.geminiKey,
      this.elevenLabsKey,
      this.elevenLabsVoiceId,
      (chunk) => {
        if (this.onWinnerChunk) this.onWinnerChunk(chunk);
      },
      () => {},
      (err) => console.error("Fallback error:", err)
    );

    fallbackStream.isCommitted = true;
    this.activeStreams.set(streamId, fallbackStream);
    this.conversationHistory.push(`市民: ${finalText}`, `AI: ${generated.speech}`);

    if (this.onWinnerReady) {
      this.onWinnerReady(fallbackStream, [], Date.now() - startSelectTime);
    }
    this.notifyStreamsUpdate();
  }

  public abortAllStreams() {
    for (const stream of this.activeStreams.values()) {
      stream.abort();
    }
    this.activeStreams.clear();
    this.notifyStreamsUpdate();
  }

  private notifyStreamsUpdate() {
    if (this.onStreamUpdate) {
      const list = Array.from(this.activeStreams.values()).map((s) => s.toInfo());
      this.onStreamUpdate(list);
    }
  }
}
