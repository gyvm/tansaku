import React, { useRef, useState, useEffect } from 'react';
import { Plus, Trash2, Volume2, MoveHorizontal, MousePointerClick, X, CornerDownLeft } from 'lucide-react';
import { SOUND_STAMPS, generateStampBuffer } from '../utils/soundSynthesis';
import type { PlacedStamp } from '../types/audio';

interface StampTimelineProps {
  stamps: PlacedStamp[];
  totalDuration: number;
  currentTime: number;
  onAddStamp: (stampId: string, time: number) => void;
  onRemoveStamp: (id: string) => void;
  onClearAllStamps?: () => void;
  onUpdateStampTime: (id: string, time: number) => void;
  onUpdateStampVolume: (id: string, volume: number) => void;
}

export const StampTimeline: React.FC<StampTimelineProps> = ({
  stamps,
  totalDuration,
  currentTime,
  onAddStamp,
  onRemoveStamp,
  onClearAllStamps,
  onUpdateStampTime,
  onUpdateStampVolume,
}) => {
  const maxDuration = Math.max(totalDuration, 5.0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [selectedStampId, setSelectedStampId] = useState<string>('applause');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const selectedStampDef = SOUND_STAMPS.find((s) => s.id === selectedStampId) || SOUND_STAMPS[0];

  // Keydown handler for Delete / Backspace to remove selected marker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMarkerId) {
        onRemoveStamp(selectedMarkerId);
        setSelectedMarkerId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMarkerId, onRemoveStamp]);

  // Play preview sound of a stamp
  const handlePreviewStamp = async (stampId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewingId(stampId);
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const buffer = await generateStampBuffer(stampId, audioCtx.sampleRate);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
      source.onended = () => {
        setPreviewingId(null);
        audioCtx.close();
      };
    } catch (err) {
      console.error('Failed to preview stamp audio:', err);
      setPreviewingId(null);
    }
  };

  // Helper to calculate time in seconds from clientX
  const getTimeFromClientX = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, relativeX / rect.width));
    const time = ratio * maxDuration;
    return Math.round(time * 10) / 10;
  };

  // Click on timeline track to add selected stamp
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStampId) return;
    const clickedTime = getTimeFromClientX(e.clientX);
    onAddStamp(selectedStampId, clickedTime);
  };

  // Mouse move on timeline track for ghost preview marker
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStampId) {
      setHoverTime(null);
      return;
    }
    const time = getTimeFromClientX(e.clientX);
    setHoverTime(time);
  };

  const handleTimelineMouseLeave = () => {
    setHoverTime(null);
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
    setHoverTime(null);
    const stampId = e.dataTransfer.getData('text/plain') || selectedStampId;
    const droppedTime = getTimeFromClientX(e.clientX);
    onAddStamp(stampId, droppedTime);
  };

  // Pointer events for dragging placed stamps on timeline track
  const handleMarkerPointerDown = (stampId: string, e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setSelectedMarkerId(stampId);
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
          <span>ドラッグ＆ドロップまたはクリックで自由配置</span>
        </div>
      </div>

      {/* Sound Stamp Selection Palette */}
      <div className="mb-4 pb-3 border-b border-slate-800">
        <div className="text-xs text-slate-400 mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span>スタンプを選択（試聴・クリック配置・ドラッグ＆ドロップ対応）:</span>
          {selectedStampDef && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-indigo-300 font-medium">
                選択中: {selectedStampDef.emoji} {selectedStampDef.name}
              </span>
              <button
                onClick={() => onAddStamp(selectedStampId, Number(currentTime.toFixed(1)))}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md transition-all active:scale-95 cursor-pointer"
                title={`現在位置 (${currentTime.toFixed(1)}秒) に「${selectedStampDef.name}」を追加`}
              >
                <CornerDownLeft className="w-3 h-3" />
                <span>再生位置 ({currentTime.toFixed(1)}s) に配置</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {SOUND_STAMPS.map((stamp) => {
            const isSelected = selectedStampId === stamp.id;
            const isPreviewing = previewingId === stamp.id;
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
                }}
                className={`group relative px-2.5 py-1.5 rounded-lg border ${stamp.color} hover:brightness-125 text-xs font-medium flex items-center gap-1.5 transition-all cursor-grab active:cursor-grabbing shadow-sm ${
                  isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10' : 'opacity-85'
                }`}
                title="クリックで選択、ドラッグしてタイムラインに直接配置"
              >
                <span className="text-sm select-none">{stamp.emoji}</span>
                <span className="select-none">{stamp.name}</span>

                {/* Audio Preview Button */}
                <button
                  onClick={(e) => handlePreviewStamp(stamp.id, e)}
                  className={`p-1 rounded-md hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer ${
                    isPreviewing ? 'text-amber-400 animate-pulse' : 'opacity-70 group-hover:opacity-100'
                  }`}
                  title={`${stamp.name} の音を試聴`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>

                {/* Quick Add at current time button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStampId(stamp.id);
                    onAddStamp(stamp.id, Number(currentTime.toFixed(1)));
                  }}
                  className="p-1 rounded-md hover:bg-indigo-500/30 text-indigo-300 hover:text-white transition-colors cursor-pointer opacity-70 group-hover:opacity-100"
                  title="再生位置に追加"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
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
            タイムライン (クリックまたはドラッグで配置、マーカー選択後に Delete キーで削除)
          </span>
          <span className="font-mono text-[11px]">総長: {maxDuration.toFixed(1)}秒</span>
        </div>

        <div
          ref={trackRef}
          onClick={handleTimelineClick}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
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

          {/* Ghost marker on hover */}
          {hoverTime !== null && !isDragOver && !draggingStampId && (
            <div
              className="absolute top-2.5 bottom-2.5 px-2.5 py-1 rounded-lg border border-dashed border-indigo-400/70 bg-indigo-500/20 text-indigo-200 text-xs z-10 flex items-center gap-1 pointer-events-none transition-all shadow-md"
              style={{ left: `${Math.min(92, Math.max(0, (hoverTime / maxDuration) * 100))}%` }}
            >
              <span className="text-sm opacity-80">{selectedStampDef.emoji}</span>
              <span className="font-medium hidden sm:inline opacity-80">{selectedStampDef.name}</span>
              <span className="text-[10px] font-mono bg-indigo-950/80 px-1 py-0.5 rounded text-indigo-300">
                {hoverTime.toFixed(1)}s
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
            const isSelected = selectedMarkerId === stamp.id;

            return (
              <div
                key={stamp.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMarkerId(stamp.id);
                }}
                onPointerDown={(e) => handleMarkerPointerDown(stamp.id, e)}
                onPointerMove={(e) => handleMarkerPointerMove(stamp.id, e)}
                onPointerUp={(e) => handleMarkerPointerUp(stamp.id, e)}
                onPointerCancel={(e) => handleMarkerPointerUp(stamp.id, e)}
                className={`group absolute top-2.5 bottom-2.5 px-2.5 py-1 rounded-lg border text-xs z-20 shadow-lg flex items-center gap-1.5 transition-all touch-none cursor-grab active:cursor-grabbing ${
                  isBeingDragged
                    ? 'bg-indigo-600 border-indigo-300 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950 z-30 scale-105'
                    : isSelected
                    ? 'bg-indigo-900 border-indigo-400 text-white ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950 z-25'
                    : 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/60 text-indigo-200 hover:border-indigo-400'
                }`}
                style={{ left: `${leftPct}%` }}
              >
                <span className="text-sm select-none">{def?.emoji || '🎵'}</span>
                <span className="font-semibold hidden sm:inline select-none">{def?.name}</span>
                <span className="text-[10px] font-mono opacity-90 px-1 py-0.5 rounded bg-slate-950/60 select-none">
                  {stamp.time.toFixed(1)}s
                </span>

                {/* Direct delete button on timeline marker */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStamp(stamp.id);
                    if (selectedMarkerId === stamp.id) setSelectedMarkerId(null);
                  }}
                  className="p-0.5 rounded hover:bg-red-500/30 text-indigo-300 hover:text-red-300 transition-colors cursor-pointer"
                  title="このスタンプを削除"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

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
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>配置済みスタンプ一覧 ({stamps.length}件)・細かな調整</span>
            {onClearAllStamps && (
              <button
                onClick={onClearAllStamps}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-800/40 transition-colors cursor-pointer"
                title="配置されたスタンプをすべて削除"
              >
                <Trash2 className="w-3 h-3" />
                <span>すべてクリア</span>
              </button>
            )}
          </div>

          {stamps.map((stamp) => {
            const def = SOUND_STAMPS.find((s) => s.id === stamp.stampId);
            const isSelected = selectedMarkerId === stamp.id;
            return (
              <div
                key={stamp.id}
                onClick={() => setSelectedMarkerId(stamp.id)}
                className={`p-2.5 rounded-lg bg-slate-900/80 border transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 text-xs ${
                  isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-900' : 'border-slate-800'
                }`}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveStamp(stamp.id);
                    if (selectedMarkerId === stamp.id) setSelectedMarkerId(null);
                  }}
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
          タイムラインにスタンプは配置されていません。上のパレットから試聴・選択してドラッグ＆ドロップするか、ボタンを押して追加してください。
        </div>
      )}
    </div>
  );
};
