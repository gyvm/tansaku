import React from 'react';
import type { BoardItem } from '../types';
import { useDraggable } from '../hooks/useDraggable';
import { X } from 'lucide-react';

interface StickyProps {
  item: BoardItem;
  onUpdate: (id: string, changes: Partial<BoardItem>) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
}

export const Sticky: React.FC<StickyProps> = ({ item, onUpdate, onDelete, onFocus }) => {
  const { onMouseDown } = useDraggable({
    x: item.x,
    y: item.y,
    onDrag: (x, y) => onUpdate(item.id, { x, y }),
    onStart: () => onFocus(item.id)
  });

  return (
    <div
      className="absolute flex flex-col shadow-lg rounded-sm overflow-hidden border border-yellow-200/50"
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        zIndex: item.z,
        backgroundColor: '#fef3c7',
      }}
      onMouseDown={onMouseDown}
    >
      {/* Header / Drag Handle */}
      <div className="bg-yellow-200 h-6 flex items-center justify-between px-2 cursor-grab active:cursor-grabbing shrink-0">
        <span className="text-xs text-yellow-800/50 select-none">Sticky</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="text-yellow-800/50 hover:text-red-500 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <textarea
        className="flex-1 w-full bg-transparent resize-none p-2 outline-none text-gray-800 text-sm font-medium leading-relaxed"
        value={item.content || ''}
        onChange={(e) => onUpdate(item.id, { content: e.target.value })}
        onFocus={() => onFocus(item.id)}
        placeholder="Type here..."
      />
    </div>
  );
};
