import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";

export const DEFAULT_MODEL = "gemini-1.5-flash";

export interface GeminiResult {
  text: string;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProcessor {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private modelName: string;

  constructor(apiKey: string, modelName: string = DEFAULT_MODEL) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
    this.modelName = modelName;
  }

  /**
   * Uploads the audio file, waits for it to be processed, generates content, and cleans up.
   * @param audioPath Path to the local audio file.
   * @returns The generated text and usage metadata.
   */
  async processAudio(audioPath: string): Promise<GeminiResult> {
    // 1. Upload file
    const uploadResult = await this.fileManager.uploadFile(audioPath, {
      mimeType: "audio/mp3",
      displayName: "Audio for summary",
    });

    try {
      let file = await this.fileManager.getFile(uploadResult.file.name);

      // 2. Wait for processing to complete
      while (file.state === FileState.PROCESSING) {
        // Sleep for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        file = await this.fileManager.getFile(uploadResult.file.name);
      }

      if (file.state === FileState.FAILED) {
        throw new Error("Audio file processing failed on Gemini server.");
      }

      // 3. Generate content
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri,
          },
        },
        { text: "この音声ファイルの要約と、その音声の続きの予想を行ってください。" },
      ]);

      const response = await result.response;

      return {
        text: response.text(),
        usageMetadata: response.usageMetadata,
      };

    } finally {
      // 4. Cleanup: Delete the file from Gemini storage
      try {
        await this.fileManager.deleteFile(uploadResult.file.name);
      } catch (cleanupError) {
        console.error("Failed to delete file from Gemini:", cleanupError);
      }
    }
  }
}
