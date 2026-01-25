import React from 'react';
import type { BoardItem } from '../types';
import { useDraggable } from '../hooks/useDraggable';
import { X } from 'lucide-react';

interface ImageItemProps {
  item: BoardItem;
  onUpdate: (id: string, changes: Partial<BoardItem>) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
}

export const ImageItem: React.FC<ImageItemProps> = ({ item, onUpdate, onDelete, onFocus }) => {
  const { onMouseDown } = useDraggable({
    x: item.x,
    y: item.y,
    onDrag: (x, y) => onUpdate(item.id, { x, y }),
    onStart: () => onFocus(item.id)
  });

  return (
    <div
      className="absolute flex flex-col shadow-lg rounded-sm overflow-hidden group border border-transparent hover:border-blue-400"
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        zIndex: item.z,
        // Height is auto based on image
      }}
      onMouseDown={onMouseDown}
    >
      {/* Header / Drag Handle (appears on hover) */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2 cursor-grab active:cursor-grabbing z-10">
         <span className="text-xs text-white/80 select-none">Image</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="text-white hover:text-red-300"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <img
        src={item.imageSrc}
        alt="User upload"
        className="w-full h-auto block select-none pointer-events-none"
      />
    </div>
  );
};
