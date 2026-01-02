import React, { useState } from 'react';

// 5. DialPad: 黒電話風ダイヤル
export const DialPad = ({ onDigitSelect }: { onDigitSelect: (digit: string) => void }) => {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const [rotating, setRotating] = useState<string | null>(null);

  const handleDial = (digit: string) => {
    if (rotating) return;
    setRotating(digit);
    onDigitSelect(digit);
    setTimeout(() => setRotating(null), 600); // Reset animation
  };

  return (
    <div className="relative w-48 h-48 rounded-full bg-[#1a1a1a] shadow-2xl border-4 border-[#2c3e50] flex items-center justify-center">
      {/* Center Label */}
      <div className="absolute z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-[#d1d5db]">
        <span className="font-display text-xs text-center text-[#2c3e50]">RETRO<br/>PHONE</span>
      </div>

      {/* Digits Holes */}
      {digits.map((digit, i) => {
        const angle = i * 30 + 60; // Start at 60deg
        const radius = 70; // px
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);

        return (
          <button
            key={digit}
            onClick={() => handleDial(digit)}
            className={`
              absolute w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 border-2 border-transparent hover:border-white/50
              flex items-center justify-center text-white font-bold text-lg
              transition-transform duration-500 ease-out
              ${rotating === digit ? 'scale-90 bg-white/40' : ''}
            `}
            style={{
              transform: rotating === digit
                ? `translate(${x}px, ${y}px) rotate(180deg)`
                : `translate(${x}px, ${y}px)`
            }}
          >
            {digit}
          </button>
        );
      })}

      {/* Stopper */}
      <div className="absolute bottom-4 right-10 w-2 h-8 bg-white/80 rounded-full rotate-45 pointer-events-none" />
    </div>
  );
};
