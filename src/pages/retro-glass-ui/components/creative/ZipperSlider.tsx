import React, { useState } from 'react';

// 4. ZipperSlider: ジッパーを開閉するスライダー
export const ZipperSlider = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  return (
    <div className="relative w-full h-12 flex items-center select-none">
      {/* Zipper Teeth */}
      <div className="absolute inset-x-0 h-4 flex items-center justify-between overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="w-1.5 h-full bg-[#9ca3af] even:mt-2 odd:-mt-2 rounded-sm" />
        ))}
      </div>

      {/* Track Background */}
      <div className="absolute inset-x-0 h-1 bg-[#2c3e50]/20 rounded-full" />

      {/* Slider Input (Hidden but functional) */}
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      {/* Custom Handle (The Zipper Pull) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
        style={{ left: `${value}%` }}
      >
        <div className="relative -translate-x-1/2 w-8 h-12">
          {/* Puller Body */}
          <div className="w-6 h-8 bg-gradient-to-b from-[#bdaead] to-[#8d7d7c] rounded mx-auto shadow-lg border border-[#5d4d4c]" />
          {/* Ring */}
          <div className="w-4 h-4 rounded-full border-4 border-[#8d7d7c] mx-auto -mt-2 shadow-sm" />
        </div>
      </div>
    </div>
  );
};
