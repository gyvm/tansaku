import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, StopCircle } from 'lucide-react';

interface ButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const Modern1: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-20 h-20 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl
      flex items-center justify-center transition-all duration-300
      ${isRecording
        ? 'bg-red-500/80 shadow-red-500/30'
        : 'bg-white/10 dark:bg-slate-800/50 hover:bg-white/20 dark:hover:bg-slate-700/50'}
    `}
  >
    <Mic className={`w-8 h-8 ${isRecording ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
  </button>
);

const Modern2: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-24 h-12 rounded-full relative shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.7),inset_2px_2px_6px_rgba(0,0,0,0.1)]
      bg-slate-100 dark:bg-slate-800 transition-colors
      ${isRecording ? 'bg-red-50 dark:bg-red-900/10' : ''}
    `}
  >
    <motion.div
      className={`
        absolute top-1 bottom-1 w-10 rounded-full shadow-[2px_2px_5px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(255,255,255,0.8)]
        flex items-center justify-center
        ${isRecording ? 'bg-red-500 left-[calc(100%-44px)]' : 'bg-slate-200 dark:bg-slate-600 left-1'}
      `}
      layout
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-slate-400 dark:bg-slate-800'}`} />
    </motion.div>
  </button>
);

const Modern3: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <motion.button
    onClick={onClick}
    className="bg-black text-white rounded-full flex items-center justify-center overflow-hidden"
    animate={{
      width: isRecording ? 140 : 60,
      height: 60
    }}
  >
    <div className="flex items-center gap-3 px-4 w-full justify-center">
      <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white'}`} />
      {isRecording && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="whitespace-nowrap text-sm font-medium"
        >
          00:12:45
        </motion.span>
      )}
    </div>
  </motion.button>
);

const Modern4: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative p-[2px] rounded-full overflow-hidden group w-20 h-20"
  >
    <div className={`
      absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
      animate-spin-slow ${isRecording ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      transition-opacity duration-500
    `} />
    <div className={`
      relative w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center
      transition-all duration-300
      ${isRecording ? 'scale-95' : 'scale-[0.98]'}
    `}>
      <Mic className={`w-6 h-6 ${isRecording ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500' : 'text-slate-400'}`} />
    </div>
  </button>
);

const Modern5: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center gap-2 px-6 py-4 rounded-2xl transition-all duration-300
      ${isRecording
        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:shadow-md'}
    `}
  >
    <div className="relative w-8 h-8">
      {isRecording ? (
        <StopCircle className="w-8 h-8 fill-current" />
      ) : (
        <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-current" />
        </div>
      )}
    </div>
    <span className="text-xs font-medium tracking-wide">
      {isRecording ? 'Stop' : 'Rec'}
    </span>
  </button>
);

export default function ModernButtons() {
  const [recordingStates, setRecordingStates] = useState<Record<number, boolean>>({});

  const toggleRecording = (index: number) => {
    setRecordingStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-white/50 dark:border-white/10">
      <div className="col-span-full w-full mb-4">
        <h3 className="text-sm font-semibold text-indigo-900/50 dark:text-indigo-200/50 uppercase tracking-wider">Modern & Glass</h3>
      </div>
      <Modern1 isRecording={!!recordingStates[1]} onClick={() => toggleRecording(1)} />
      <Modern2 isRecording={!!recordingStates[2]} onClick={() => toggleRecording(2)} />
      <Modern3 isRecording={!!recordingStates[3]} onClick={() => toggleRecording(3)} />
      <Modern4 isRecording={!!recordingStates[4]} onClick={() => toggleRecording(4)} />
      <Modern5 isRecording={!!recordingStates[5]} onClick={() => toggleRecording(5)} />
    </div>
  );
}
