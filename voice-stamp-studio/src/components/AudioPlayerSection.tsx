import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, RefreshCw, Volume2 } from 'lucide-react';
import { renderComposition, audioBufferToWav } from '../utils/audioExporter';
import type { AudioProcessingSettings, AudioSourceInfo, PlacedStamp } from '../types/audio';

interface AudioPlayerSectionProps {
  audioSource: AudioSourceInfo | null;
  settings: AudioProcessingSettings;
  stamps: PlacedStamp[];
  onCurrentTimeChange: (time: number) => void;
}

export const AudioPlayerSection: React.FC<AudioPlayerSectionProps> = ({
  audioSource,
  settings,
  stamps,
  onCurrentTimeChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderedWavUrl, setRenderedWavUrl] = useState<string | null>(null);
  const [renderedDuration, setRenderedDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Invalidate rendered WAV URL whenever inputs (audio source, voice settings, stamps) change
  useEffect(() => {
    setRenderedWavUrl((prevUrl) => {
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return null;
    });
    setRenderedDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
  }, [audioSource, settings, stamps]);

  // Clean up Object URL on unmount
  useEffect(() => {
    return () => {
      if (renderedWavUrl) {
        URL.revokeObjectURL(renderedWavUrl);
      }
    };
  }, [renderedWavUrl]);

  const handleGenerateAndPlay = async () => {
    if (!audioSource) {
      alert('最初に声を録音するか、ファイルをアップロードしてください。');
      return;
    }

    setIsProcessing(true);
    try {
      const renderedBuffer = await renderComposition(audioSource.buffer, settings, stamps);
      const wavBlob = audioBufferToWav(renderedBuffer);

      if (renderedWavUrl) {
        URL.revokeObjectURL(renderedWavUrl);
      }

      const url = URL.createObjectURL(wavBlob);
      setRenderedWavUrl(url);
      setRenderedDuration(renderedBuffer.duration);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Audio processing failed:', err);
      alert('音声をの合成・加工処理に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !renderedWavUrl) {
      handleGenerateAndPlay();
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      onCurrentTimeChange(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onCurrentTimeChange(0);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">5. プレビュー再生 ＆ 音声エクスポート</h2>
          <p className="text-xs text-slate-400">加工後のミックス音声を試聴し、WAVファイルとして保存できます</p>
        </div>
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            disabled={!audioSource || isProcessing}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all cursor-pointer active:scale-95 ${
              !audioSource || isProcessing
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-purple-500/20'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>レンダリング処理中...</span>
              </>
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>一時停止</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>加工結果を再生・プレビュー</span>
              </>
            )}
          </button>

          {renderedDuration > 0 && (
            <span className="text-xs font-mono text-slate-400">
              総再生時間: {renderedDuration.toFixed(1)}秒
            </span>
          )}
        </div>

        {/* Export / Download WAV */}
        {renderedWavUrl && (
          <a
            href={renderedWavUrl}
            download="voice_stamp_studio_mix.wav"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>WAVファイルを保存 (Export)</span>
          </a>
        )}
      </div>
    </div>
  );
};
