import React, { useRef, useState } from 'react';
import { Plus, Trash2, Volume2, MoveHorizontal, MousePointerClick } from 'lucide-react';
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
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [selectedStampId, setSelectedStampId] = useState<string>('applause');
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);

  // Helper to calculate time in seconds from clientX
  const getTimeFromClientX = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relativeX / rect.width));
    const time = ratio * maxDuration;
    return Math.round(time * 10) / 10;
  };

  // Click on empty track area to add selected stamp
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we were just dragging a stamp, skip click handler
    if (draggingStampId) return;

    const clickedTime = getTimeFromClientX(e.clientX);
    onAddStamp(selectedStampId, clickedTime);
  };

  // Drag & Drop handlers for dropping palette stamp onto timeline
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const stampId = e.dataTransfer.getData('text/plain') || selectedStampId;
    const droppedTime = getTimeFromClientX(e.clientX);
    onAddStamp(stampId, droppedTime);
  };

  // Pointer events for dragging placed stamps on timeline track
  const handleMarkerPointerDown = (stampId: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingStampId(stampId);
  };

  const handleMarkerPointerMove = (stampId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingStampId !== stampId) return;
    const newTime = getTimeFromClientX(e.clientX);
    onUpdateStampTime(stampId, newTime);
  };

  const handleMarkerPointerUp = (stampId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingStampId === stampId) {
      setDraggingStampId(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore capture release error
      }
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 mb-6">
      {/* Header & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <span className="text-sm font-semibold text-slate-200">音スタンプ パレット ＆ タイムライン配置</span>
        <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-800/50">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>ドラッグ＆ドロップで配置・微調整が可能</span>
        </div>
      </div>

      {/* Sound Stamp Selection Palette */}
      <div className="mb-4 pb-3 border-b border-slate-800">
        <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
          <span>スタンプを選択（クリックで現在位置に配置、またはタイムラインへドラッグ）:</span>
          {selectedStampId && (
            <span className="text-[11px] text-indigo-300 font-medium">
              選択中: {SOUND_STAMPS.find((s) => s.id === selectedStampId)?.emoji}{' '}
              {SOUND_STAMPS.find((s) => s.id === selectedStampId)?.name}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SOUND_STAMPS.map((stamp) => {
            const isSelected = selectedStampId === stamp.id;
            return (
              <div
                key={stamp.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', stamp.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  setSelectedStampId(stamp.id);
                }}
                onClick={() => {
                  setSelectedStampId(stamp.id);
                  onAddStamp(stamp.id, Number(currentTime.toFixed(1)));
                }}
                className={`px-3 py-1.5 rounded-lg border ${stamp.color} hover:brightness-125 text-xs font-medium flex items-center gap-1.5 transition-all cursor-grab active:cursor-grabbing shadow-sm active:scale-95 ${
                  isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105' : 'opacity-85'
                }`}
                title="ドラッグしてタイムラインに置くか、クリックで再生位置に配置"
              >
                <span className="text-sm">{stamp.emoji}</span>
                <span>{stamp.name}</span>
                <Plus className="w-3 h-3 opacity-60" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Timeline Track */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-1">
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />
            タイムライン (クリックまたはドラッグで配置)
          </span>
          <span className="font-mono text-[11px]">総長: {maxDuration.toFixed(1)}秒</span>
        </div>

        <div
          ref={trackRef}
          onClick={handleTimelineClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative h-20 bg-slate-900/90 rounded-xl border transition-colors overflow-hidden cursor-pointer select-none ${
            isDragOver ? 'border-indigo-400 bg-indigo-950/30 ring-2 ring-indigo-500/50' : 'border-slate-800'
          }`}
        >
          {/* Timeline Grid lines */}
          <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-20 text-[10px] text-slate-400 font-mono">
            <span>0.0s</span>
            <span>{(maxDuration * 0.25).toFixed(1)}s</span>
            <span>{(maxDuration * 0.5).toFixed(1)}s</span>
            <span>{(maxDuration * 0.75).toFixed(1)}s</span>
            <span>{maxDuration.toFixed(1)}s</span>
          </div>

          {/* Drag over guide prompt */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/10 backdrop-blur-[1px] pointer-events-none z-30">
              <span className="text-xs font-semibold text-indigo-300 bg-slate-950/80 px-3 py-1.5 rounded-full border border-indigo-500/40 shadow-lg">
                ここにドロップしてスタンプを配置 🎯
              </span>
            </div>
          )}

          {/* Current Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-10 shadow-glow pointer-events-none"
            style={{ left: `${(currentTime / maxDuration) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 -translate-x-1 -mt-0.5 shadow-md" />
          </div>

          {/* Placed Stamps Markers on Timeline Track */}
          {stamps.map((stamp) => {
            const def = SOUND_STAMPS.find((s) => s.id === stamp.stampId);
            const leftPct = Math.min(92, Math.max(0, (stamp.time / maxDuration) * 100));
            const isBeingDragged = draggingStampId === stamp.id;

            return (
              <div
                key={stamp.id}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => handleMarkerPointerDown(stamp.id, e)}
                onPointerMove={(e) => handleMarkerPointerMove(stamp.id, e)}
                onPointerUp={(e) => handleMarkerPointerUp(stamp.id, e)}
                onPointerCancel={(e) => handleMarkerPointerUp(stamp.id, e)}
                className={`absolute top-2.5 bottom-2.5 px-2.5 py-1 rounded-lg border text-xs z-20 shadow-lg flex items-center gap-1.5 transition-shadow touch-none cursor-grab active:cursor-grabbing ${
                  isBeingDragged
                    ? 'bg-indigo-600 border-indigo-300 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950 z-30 scale-105'
                    : 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/60 text-indigo-200 hover:border-indigo-400'
                }`}
                style={{ left: `${leftPct}%` }}
              >
                <span className="text-sm select-none">{def?.emoji || '🎵'}</span>
                <span className="font-semibold hidden sm:inline select-none">{def?.name}</span>
                <span className="text-[10px] font-mono opacity-90 px-1 py-0.5 rounded bg-slate-950/60 select-none">
                  {stamp.time.toFixed(1)}s
                </span>

                {/* Floating tooltip during drag */}
                {isBeingDragged && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-indigo-500 text-slate-950 font-bold text-[10px] whitespace-nowrap shadow-md pointer-events-none">
                    {stamp.time.toFixed(1)}秒へ移動中
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed List & Controls for Placed Stamps */}
      {stamps.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 mb-1">配置済みスタンプ一覧・細かな調整</div>
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
          タイムラインにスタンプは配置されていません。上のパレットからドラッグ＆ドロップするか、ボタンを押して追加してください。
        </div>
      )}
    </div>
  );
};
