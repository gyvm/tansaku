import React from 'react';
import { Check } from 'lucide-react';

export const Checkbox = ({ label, checked, onChange }: { label?: string, checked?: boolean, onChange?: (checked: boolean) => void }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        className={`
          w-5 h-5 rounded border border-[#9ca3af] bg-[#fdfbf7]
          flex items-center justify-center transition-all duration-200
          group-hover:border-[#5d6d7e]
          ${checked ? 'bg-[#2c3e50] border-[#2c3e50]' : ''}
        `}
        onClick={() => onChange?.(!checked)}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      {label && <span className="text-sm text-[#2c3e50] select-none">{label}</span>}
    </label>
  );
};

export const Switch = ({ checked, onChange }: { checked?: boolean, onChange?: (checked: boolean) => void }) => {
  return (
    <button
      className={`
        relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#5d6d7e]/20
        ${checked ? 'bg-[#2c3e50]' : 'bg-[#d1d5db]'}
      `}
      onClick={() => onChange?.(!checked)}
    >
      <span
        className={`
          absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
};
