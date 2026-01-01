import React from 'react';

// 11. SealingWax: シーリングワックス風アイコン/ボタン
export const SealingWax = ({ color = '#8b0000', icon = 'S' }: { color?: string, icon?: string }) => {
  return (
    <div
      className="relative w-16 h-16 flex items-center justify-center filter drop-shadow-md"
    >
      {/* Irregular Wax Shape */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `inset 2px 2px 6px rgba(255,255,255,0.4), inset -2px -2px 6px rgba(0,0,0,0.3)`,
          clipPath: 'polygon(50% 0%, 61% 5%, 75% 2%, 85% 10%, 95% 15%, 98% 30%, 92% 45%, 98% 60%, 95% 75%, 85% 85%, 75% 95%, 60% 92%, 50% 100%, 40% 92%, 25% 95%, 15% 85%, 5% 75%, 2% 60%, 8% 45%, 2% 30%, 5% 15%, 15% 10%, 25% 2%, 39% 5%)'
        }}
      />
      {/* Inner Stamp Area */}
      <div
        className="absolute w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center font-display font-bold text-xl text-white/90 shadow-inner"
        style={{ backgroundColor: color }}
      >
        {icon}
      </div>
    </div>
  );
};
