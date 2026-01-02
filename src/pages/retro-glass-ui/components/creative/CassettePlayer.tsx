import React from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';

// 15. CassettePlayer: カセットテープ風プレイヤーUI
export const CassettePlayer = () => {
  return (
    <div className="w-64 bg-[#333] rounded-2xl p-4 shadow-xl border-t border-[#555] border-b-4 border-b-[#222]">
      {/* Tape Window */}
      <div className="bg-[#e5e5e5] rounded h-24 mb-4 relative overflow-hidden flex items-center justify-center border-2 border-[#999] shadow-inner">
        {/* Reels */}
        <div className="flex gap-8 z-10">
          <div className="w-12 h-12 rounded-full border-4 border-white bg-transparent animate-spin-slow flex items-center justify-center">
             <div className="w-2 h-2 bg-black rounded-full" />
             <div className="absolute w-12 h-2 bg-transparent border-l-2 border-r-2 border-white rotate-45" />
             <div className="absolute w-12 h-2 bg-transparent border-l-2 border-r-2 border-white -rotate-45" />
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-white bg-transparent animate-spin-slow flex items-center justify-center">
             <div className="w-2 h-2 bg-black rounded-full" />
             <div className="absolute w-12 h-2 bg-transparent border-l-2 border-r-2 border-white rotate-45" />
             <div className="absolute w-12 h-2 bg-transparent border-l-2 border-r-2 border-white -rotate-45" />
          </div>
        </div>

        {/* Tape Label Background */}
        <div className="absolute inset-x-0 top-2 bottom-2 bg-[#f0a500] opacity-20 transform -skew-x-12" />
      </div>

      {/* Controls */}
      <div className="flex justify-between px-2">
        <ControlButton icon={<Rewind className="w-4 h-4" />} />
        <ControlButton icon={<Play className="w-4 h-4" />} active />
        <ControlButton icon={<Pause className="w-4 h-4" />} />
        <ControlButton icon={<FastForward className="w-4 h-4" />} />
      </div>
    </div>
  );
};

const ControlButton = ({ icon, active }: { icon: React.ReactNode, active?: boolean }) => (
  <button
    className={`
      w-10 h-10 rounded-md shadow-md flex items-center justify-center text-[#ddd]
      active:scale-95 transition-all active:shadow-none
      border-b-4 border-[#222] active:border-b-0 active:translate-y-1
      ${active ? 'bg-[#555] translate-y-1 border-b-0 shadow-none text-[#4af626]' : 'bg-[#444]'}
    `}
  >
    {icon}
  </button>
);
