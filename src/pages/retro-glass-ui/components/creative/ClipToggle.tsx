import React, { useState } from 'react';

// 2. ClipToggle: クリップをスライド
export const ClipToggle = ({ enabled, onToggle }: { enabled: boolean, onToggle: (val: boolean) => void }) => {
  return (
    <div
      className="relative w-32 h-10 bg-[#e5e7eb] rounded-full p-1 cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
      onClick={() => onToggle(!enabled)}
    >
      <div className="absolute inset-0 flex justify-between items-center px-4 text-xs font-bold text-[#9ca3af] uppercase">
        <span>Off</span>
        <span>On</span>
      </div>

      {/* Paper Clip */}
      <div
        className={`
          absolute top-1/2 -translate-y-1/2 left-1 w-12 h-16
          transition-all duration-300 ease-in-out
          flex items-center justify-center
        `}
        style={{
          transform: `translate(${enabled ? '4.5rem' : '0'}, -50%) rotate(${enabled ? '10deg' : '-10deg'})`
        }}
      >
        <svg viewBox="0 0 50 100" className="w-full h-full drop-shadow-lg text-[#5d6d7e] fill-none stroke-current stroke-[8]">
          <path d="M20,20 L20,80 A15,15 0 0,0 50,80 A15,15 0 0,0 50,20" />
          <path d="M10,90 L10,30 A25,25 0 0,1 60,30" className="stroke-[#34495e]" />
        </svg>
      </div>
    </div>
  );
};
