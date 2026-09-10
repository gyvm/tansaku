import React, { useRef, useState } from 'react';
import { Mic, Square, Upload, Music2 } from 'lucide-react';
import { AudioLoader, VoiceRecorder } from '../utils/audioLoader';
import type { AudioSourceInfo } from '../types/audio';

interface AudioInputSectionProps {
  audioSource: AudioSourceInfo | null;
  onAudioLoaded: (source: AudioSourceInfo) => void;
}

export const AudioInputSection: React.FC<AudioInputSectionProps> = ({ audioSource, onAudioLoaded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (recorderRef.current) {
        try {
          await recorderRef.current.stopRecording();
        } catch {
          // ignore previous recorder stop error
        }
        recorderRef.current = null;
      }

      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.startRecording();
      setIsRecording(true);
      setRecordTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording failed:', err);
      alert('マイクアクセスが拒否されたか、録音に失敗しました。');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const buffer = await recorderRef.current.stopRecording();
      setIsRecording(false);
      recorderRef.current = null;
      onAudioLoaded({
        buffer,
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        name: `マイク録音 (${new Date().toLocaleTimeString()})`
      });
    } catch (err) {
      console.error('Stop recording failed:', err);
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await AudioLoader.loadFromFile(file);
      onAudioLoaded({
        buffer,
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        numberOfChannels: buffer.numberOfChannels,
        name: file.name
      });
    } catch (err) {
      console.error('File load failed:', err);
      alert('音声ファイルの読み込みに失敗しました。対応フォーマット: WAV, MP3, M4A, OGG');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">1. 音声入力（録音 / ファイル選択）</h2>
          <p className="text-xs text-slate-400">ご自身の声を直接録音するか、手元の音声ファイルをアップロードします</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Record Button Box */}
        <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-5 flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group">
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-red-400 font-mono text-xl animate-pulse">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span>REC {formatTime(recordTime)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                録音停止
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold shadow-lg shadow-red-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Mic className="w-5 h-5" />
                マイクで声を録音
              </button>
              <span className="text-xs text-slate-500">ワンクリックで録音開始</span>
            </div>
          )}
        </div>

        {/* Upload File Box */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/20 hover:bg-slate-900/40 rounded-xl p-5 flex flex-col items-center justify-center min-h-[140px] cursor-pointer transition-all group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
          <div className="p-3 rounded-full bg-slate-800 text-slate-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-200">音声ファイルをドロップ / 選択</p>
          <p className="text-xs text-slate-500 mt-1">MP3, WAV, M4A, OGG 対応</p>
        </div>
      </div>

      {/* Loaded Audio Status Info */}
      {audioSource && (
        <div className="mt-4 p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Music2 className="w-4 h-4" />
            <span className="font-medium truncate max-w-[240px] md:max-w-[400px]">{audioSource.name}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>長さ: {audioSource.duration.toFixed(1)}秒</span>
            <span>サンプリング: {(audioSource.sampleRate / 1000).toFixed(1)}kHz</span>
          </div>
        </div>
      )}
    </div>
  );
};
