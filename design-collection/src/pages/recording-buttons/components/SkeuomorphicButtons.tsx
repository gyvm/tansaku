import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

interface ButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const Skeuomorphic1: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative group w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 shadow-[inset_0_1px_4px_rgba(0,0,0,0.2),_0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center transition-transform active:scale-95"
  >
    <div className={`
      w-16 h-16 rounded-full border-4 border-slate-300 dark:border-slate-600
      bg-gradient-to-b from-red-500 to-red-600 shadow-[0_2px_5px_rgba(0,0,0,0.3),_inset_0_1px_2px_rgba(255,255,255,0.4)]
      flex items-center justify-center transition-all duration-200
      ${isRecording ? 'translate-y-0.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)] brightness-90' : 'hover:brightness-110'}
    `}>
      <Mic className={`w-6 h-6 text-white drop-shadow-sm ${isRecording ? 'opacity-100' : 'opacity-80'}`} />
    </div>
  </button>
);

const Skeuomorphic2: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex flex-col items-center gap-2"
  >
    <div className={`
      w-16 h-24 rounded-lg bg-slate-300 dark:bg-slate-600 shadow-[0_4px_0_#94a3b8,0_8px_10px_rgba(0,0,0,0.2)]
      transition-all duration-150 active:translate-y-1 active:shadow-[0_0_0_#94a3b8,0_0_5px_rgba(0,0,0,0.2)]
      flex items-center justify-center border-t border-white/50
      ${isRecording ? 'translate-y-1 shadow-[0_0_0_#94a3b8]' : ''}
    `}>
      <div className={`
        w-12 h-12 rounded-full border-2 border-slate-400/50 bg-slate-200 dark:bg-slate-700
        flex items-center justify-center shadow-inner
      `}>
        <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-slate-400'}`} />
      </div>
    </div>
    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">REC</span>
  </button>
);

const Skeuomorphic3: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-20 h-20 rounded-[20px] flex items-center justify-center transition-all duration-300
      bg-slate-100 dark:bg-slate-800
      ${isRecording
        ? 'shadow-[inset_5px_5px_10px_#bebebe,inset_-5px_-5px_10px_#ffffff] dark:shadow-[inset_5px_5px_10px_#0f172a,inset_-5px_-5px_10px_#334155]'
        : 'shadow-[5px_5px_10px_#bebebe,-5px_-5px_10px_#ffffff] dark:shadow-[5px_5px_10px_#0f172a,-5px_-5px_10px_#334155] hover:shadow-[7px_7px_14px_#bebebe,-7px_-7px_14px_#ffffff]'}
    `}
  >
    <Mic className={`w-8 h-8 transition-colors ${isRecording ? 'text-red-500' : 'text-slate-400'}`} />
  </button>
);

const Skeuomorphic4: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <div className="flex flex-col items-center gap-2">
    <div
      onClick={onClick}
      className={`
        cursor-pointer w-16 h-28 rounded-full bg-slate-800 p-1 shadow-xl border-2 border-slate-600
        relative overflow-hidden transition-colors duration-500
      `}
    >
      <div className="absolute inset-0 bg-black/20" />
      <motion.div
        className={`
          w-full h-14 rounded-full shadow-lg border-t border-white/20
          absolute left-0 right-0 z-10 flex items-center justify-center
          ${isRecording ? 'bg-red-600' : 'bg-slate-600'}
        `}
        animate={{ y: isRecording ? 0 : 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="w-8 h-1 rounded-full bg-black/20" />
      </motion.div>
    </div>
    <span className="text-[10px] font-mono text-slate-400">ON / OFF</span>
  </div>
);

const Skeuomorphic5: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-24 h-24 rounded-full border-8 flex items-center justify-center relative
      ${isRecording ? 'border-red-900/10' : 'border-slate-100 dark:border-slate-800'}
    `}
  >
    <div className={`
      absolute inset-0 rounded-full border border-slate-200 dark:border-slate-700
    `} />
    <div className={`
      w-16 h-16 rounded-full bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800
      shadow-[0_4px_6px_rgba(0,0,0,0.1),0_10px_15px_rgba(0,0,0,0.1)]
      flex items-center justify-center transition-transform active:scale-95 border border-slate-200 dark:border-slate-600
    `}>
      <div className={`
        w-4 h-4 rounded-full transition-all duration-300
        ${isRecording ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-slate-300 dark:bg-slate-500'}
      `} />
    </div>
  </button>
);

export default function SkeuomorphicButtons() {
  const [recordingStates, setRecordingStates] = useState<Record<number, boolean>>({});

  const toggleRecording = (index: number) => {
    setRecordingStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="col-span-full w-full mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Skeuomorphic Collection</h3>
      </div>
      <Skeuomorphic1 isRecording={!!recordingStates[1]} onClick={() => toggleRecording(1)} />
      <Skeuomorphic2 isRecording={!!recordingStates[2]} onClick={() => toggleRecording(2)} />
      <Skeuomorphic3 isRecording={!!recordingStates[3]} onClick={() => toggleRecording(3)} />
      <Skeuomorphic4 isRecording={!!recordingStates[4]} onClick={() => toggleRecording(4)} />
      <Skeuomorphic5 isRecording={!!recordingStates[5]} onClick={() => toggleRecording(5)} />
    </div>
  );
}
