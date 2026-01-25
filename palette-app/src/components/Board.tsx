import React from 'react';
import type { BoardItem } from '../types';
import { Sticky } from './Sticky';
import { ImageItem } from './ImageItem';

interface BoardProps {
  items: BoardItem[];
  onUpdate: (id: string, changes: Partial<BoardItem>) => void;
  onDelete: (id: string) => void;
  onFocus: (id: string) => void;
}

export const Board: React.FC<BoardProps> = ({ items, onUpdate, onDelete, onFocus }) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-50">
      {/* Dot Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      ></div>

      {items.map(item => {
        if (item.type === 'sticky') {
          return (
            <Sticky
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onFocus={onFocus}
            />
          );
        } else if (item.type === 'image') {
          return (
             <ImageItem
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onFocus={onFocus}
            />
          );
        }
        return null;
      })}
    </div>
  );
};
