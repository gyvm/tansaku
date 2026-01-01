import React from 'react';

// 8. CrtFrame: ブラウン管風エフェクト
export const CrtFrame = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative p-1 bg-[#1a1a1a] rounded-lg shadow-xl">
      <div className="relative overflow-hidden bg-[#111] rounded border-4 border-[#333] shadow-inner min-h-[200px] flex items-center justify-center">

        {/* Screen Content */}
        <div className="relative z-10 text-[#4af626] font-mono p-4 text-shadow-glow">
          {children}
        </div>

        {/* CRT Lines */}
        <div className="absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />

        {/* Scanline Animation */}
        <div className="absolute inset-0 z-30 pointer-events-none animate-scanline bg-white/5 opacity-20 h-2 w-full top-0" />

        {/* Screen Curvature & Glow */}
        <div className="absolute inset-0 z-40 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
      </div>
    </div>
  );
};
