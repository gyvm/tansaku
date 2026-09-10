import React from 'react';
import { Plus, Trash2, Volume2 } from 'lucide-react';
import { SOUND_STAMPS } from '../utils/soundSynthesis';
import type { PlacedStamp } from '../types/audio';

interface StampTimelineProps {
  stamps: PlacedStamp[];
  totalDuration: number;
  currentTime: number;
  onAddStamp: (stampId: string, time: number) => void;
  onRemoveStamp: (id: string) => void;
  onUpdateStampTime: (id: string, time: number) => void;
  onUpdateStampVolume: (id: string, volume: number) => void;
}

export const StampTimeline: React.FC<StampTimelineProps> = ({
  stamps,
  totalDuration,
  currentTime,
  onAddStamp,
  onRemoveStamp,
  onUpdateStampTime,
  onUpdateStampVolume,
}) => {
  const maxDuration = Math.max(totalDuration, 5.0);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(maxDuration, (clickX / rect.width) * maxDuration));

    // Default to adding the first stamp if direct click on empty track area
    onAddStamp('applause', Number(clickedTime.toFixed(1)));
  };

  return (
    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 mb-6">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-slate-200">音スタンプ パレット ＆ タイムライン配置</span>
        <span className="text-xs text-slate-400">スタンプを選んでタイムラインに追加できます</span>
      </div>

      {/* Sound Stamp Selection Palette */}
      <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-slate-800">
        {SOUND_STAMPS.map((stamp) => (
          <button
            key={stamp.id}
            onClick={() => onAddStamp(stamp.id, Number(currentTime.toFixed(1)))}
            className={`px-3 py-1.5 rounded-lg border ${stamp.color} hover:brightness-125 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95`}
          >
            <span className="text-sm">{stamp.emoji}</span>
            <span>{stamp.name}</span>
            <Plus className="w-3 h-3 opacity-60" />
          </button>
        ))}
      </div>

      {/* Visual Timeline Track */}
      <div className="relative mb-4">
        <div
          onClick={handleTimelineClick}
          className="relative h-16 bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden cursor-pointer group"
        >
          {/* Timeline Grid lines */}
          <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-20 text-[10px] text-slate-400">
            <span>0s</span>
            <span>{(maxDuration / 2).toFixed(1)}s</span>
            <span>{maxDuration.toFixed(1)}s</span>
          </div>

          {/* Current Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-10 shadow-glow"
            style={{ left: `${(currentTime / maxDuration) * 100}%` }}
          />

          {/* Placed Stamps Markers on Timeline Track */}
          {stamps.map((stamp) => {
            const def = SOUND_STAMPS.find((s) => s.id === stamp.stampId);
            const leftPct = Math.min(95, Math.max(0, (stamp.time / maxDuration) * 100));

            return (
              <div
                key={stamp.id}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 bottom-2 px-2 py-1 rounded-md bg-indigo-500/30 border border-indigo-400/60 text-indigo-200 flex items-center gap-1.5 text-xs z-20 shadow-md group/item cursor-grab active:cursor-grabbing"
                style={{ left: `${leftPct}%` }}
              >
                <span>{def?.emoji || '🎵'}</span>
                <span className="font-medium hidden sm:inline">{def?.name}</span>
                <span className="text-[10px] opacity-75 font-mono">{stamp.time}s</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed List & Controls for Placed Stamps */}
      {stamps.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 mb-1">配置済みスタンプ一覧・設定</div>
          {stamps.map((stamp) => {
            const def = SOUND_STAMPS.find((s) => s.id === stamp.stampId);
            return (
              <div
                key={stamp.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <span className="text-base">{def?.emoji}</span>
                  <span className="font-semibold text-slate-200">{def?.name}</span>
                </div>

                {/* Time Input */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">再生開始時間:</span>
                  <input
                    type="number"
                    min="0"
                    max={maxDuration}
                    step="0.1"
                    value={stamp.time}
                    onChange={(e) => onUpdateStampTime(stamp.id, Math.max(0, Number(e.target.value)))}
                    className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-center"
                  />
                  <span className="text-slate-500">秒</span>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-2 min-w-[140px]">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={stamp.volume}
                    onChange={(e) => onUpdateStampVolume(stamp.id, Number(e.target.value))}
                    className="w-20 h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[11px] font-mono text-slate-400">{Math.round(stamp.volume * 100)}%</span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => onRemoveStamp(stamp.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="スタンプ削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-3 text-xs text-slate-500">
          タイムラインにスタンプは配置されていません。上のボタンから追加してください。
        </div>
      )}
    </div>
  );
};
