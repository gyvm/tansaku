import React from 'react';

// 6. FoggyGlassCard: ホバーでクリアになるすりガラス
export const FoggyGlassCard = ({ title, children }: { title: string, children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden group cursor-pointer shadow-lg">
      {/* Background Content (Visible when clear) */}
      <div className="absolute inset-0 bg-white p-6 flex flex-col justify-center items-center text-center">
        <h3 className="font-display text-xl mb-2 text-[#2c3e50]">{title}</h3>
        <div className="text-[#5d6d7e] text-sm">{children}</div>
      </div>

      {/* Fog Layer */}
      <div
        className="
          absolute inset-0 bg-white/40 backdrop-blur-md
          transition-all duration-700 ease-in-out
          group-hover:backdrop-blur-none group-hover:bg-transparent
          flex items-center justify-center
          border border-white/50
        "
      >
        <span className="font-display text-2xl text-[#2c3e50]/50 group-hover:opacity-0 transition-opacity duration-300">
          ?
        </span>
      </div>
    </div>
  );
};
