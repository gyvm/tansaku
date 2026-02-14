import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  formatValue = (v) => v.toString(),
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-mono text-primary uppercase tracking-wider">{label}</label>
        <span className="text-xs font-mono text-textMuted bg-surfaceVariant px-2 py-0.5 rounded">
          {formatValue(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full h-2 bg-surfaceVariant rounded-none appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,210,255,0.5)] hover:[&::-webkit-slider-thumb]:bg-white transition-colors"
        {...props}
      />
    </div>
  );
};
