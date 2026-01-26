import React, { useState, useRef, useEffect } from 'react';

// 3. AnalogKnob: 回せるボリュームノブ
export const AnalogKnob = ({ value, min = 0, max = 100, onChange }: { value: number, min?: number, max?: number, onChange: (val: number) => void }) => {
  const [rotation, setRotation] = useState((value / max) * 270 - 135);
  const knobRef = useRef<HTMLDivElement>(null);

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    // Simple implementation for demo purposes - in real app would need global mouse listeners
    // Just simulating toggle/click interaction for now as drag requires more setup
    const nextVal = value >= max ? min : value + 10;
    onChange(nextVal);
  };

  // Calculate visual rotation from value
  const deg = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#e5e7eb] to-[#9ca3af] shadow-lg flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        style={{ transform: `rotate(${deg}deg)` }}
        onClick={handleDrag}
      >
        <div className="absolute inset-2 rounded-full bg-[#f3f4f6] shadow-inner" />
        <div className="absolute top-2 w-1 h-3 bg-[#c0392b] rounded-full" />
      </div>
      <span className="font-display text-sm text-[#5d6d7e]">{Math.round(value)}</span>
    </div>
  );
};
