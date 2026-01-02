import React from 'react';

// 14. TypewriterInput: タイプライター風入力
export const TypewriterInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <div className="relative group">
      <input
        className="
          w-full bg-transparent border-b-2 border-[#2c3e50]
          py-2 pl-2 pr-2 font-display text-xl text-[#2c3e50]
          placeholder:text-[#2c3e50]/30 focus:outline-none
          caret-[#c0392b]
        "
        {...props}
      />

      {/* Typewriter mechanical parts decoration */}
      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#2c3e50]/20" />
      <div className="absolute -left-2 top-2 bottom-2 w-1 bg-[#d1d5db] rounded-l" />
      <div className="absolute -right-2 top-2 bottom-2 w-1 bg-[#d1d5db] rounded-r" />
    </div>
  );
};
