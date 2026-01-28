import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Trims the audio file to the first 90 seconds.
 *
 * @param inputPath Path to the source audio file.
 * @returns Path to the trimmed temporary audio file.
 */
export async function trimAudio(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Generate a temporary file path
    const tempDir = os.tmpdir();
    const inputExt = path.extname(inputPath);
    // Use .mp3 as default output format to ensure compatibility,
    // or use input extension if suitable.
    // However, re-encoding to mp3 is safer for API compatibility if the input is obscure.
    // Let's stick to mp3 for the intermediate file.
    const tempFileName = `gemini_audio_trim_${Date.now()}.mp3`;
    const outputPath = path.join(tempDir, tempFileName);

    ffmpeg(inputPath)
      .setStartTime(0)
      .setDuration(90)
      .output(outputPath)
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
}

/**
 * Cleans up the temporary file.
 * @param filePath Path to the file to delete.
 */
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete temporary file ${filePath}:`, err);
  }
}
