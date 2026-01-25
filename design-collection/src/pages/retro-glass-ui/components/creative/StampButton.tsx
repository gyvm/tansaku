import React, { useState } from 'react';

// 1. StampButton: 押すとインクが滲む
export const StampButton = ({ text, onClick }: { text: string, onClick?: () => void }) => {
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    setPressed(true);
    onClick?.();
    setTimeout(() => setPressed(false), 300);
  };

  return (
    <button
      onClick={handlePress}
      className={`
        relative px-6 py-3 font-display font-bold text-lg text-white
        bg-[#c0392b] border-2 border-[#922b21] rounded-lg
        shadow-[0_4px_0_#922b21] active:shadow-none active:translate-y-1
        transition-all duration-100 uppercase tracking-widest
        overflow-hidden
      `}
    >
      <span className="relative z-10">{text}</span>
      {/* Ink Spread Effect */}
      <span
        className={`
          absolute inset-0 bg-black/20 rounded-lg pointer-events-none transition-all duration-500
          ${pressed ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}
        `}
        style={{ filter: 'blur(8px)' }}
      />
    </button>
  );
};
