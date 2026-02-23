import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Pause, Play, Smile } from 'lucide-react';

interface ButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const Playful1: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button onClick={onClick} className="relative w-24 h-24 flex items-center justify-center">
    <motion.div
      className={`absolute inset-0 rounded-full opacity-30 ${isRecording ? 'bg-orange-400' : 'bg-slate-200 dark:bg-slate-700'}`}
      animate={{
        scale: isRecording ? [1, 1.2, 0.9, 1.1, 1] : 1,
        borderRadius: isRecording
          ? ["50%", "40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 60% 30% 70% 40%", "50%"]
          : "50%"
      }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    />
    <motion.div
      className={`
        relative w-16 h-16 rounded-full flex items-center justify-center text-white
        ${isRecording ? 'bg-orange-500' : 'bg-slate-400'}
      `}
      whileTap={{ scale: 0.9 }}
    >
      <Mic className="w-6 h-6" />
    </motion.div>
  </button>
);

const Playful2: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button onClick={onClick} className="group flex flex-col items-center gap-2">
    <div className={`
      text-4xl transition-transform duration-300
      ${isRecording ? 'scale-125 rotate-12' : 'group-hover:scale-110'}
    `}>
      {isRecording ? '🎤' : '😶'}
    </div>
    <div className={`
      px-4 py-1 rounded-full text-xs font-bold transition-colors
      ${isRecording ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}
    `}>
      {isRecording ? 'Singing!' : 'Quiet'}
    </div>
  </button>
);

const Playful3: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-20 h-20 rounded-[2rem] bg-white dark:bg-slate-800 shadow-[0_8px_0_#cbd5e1] dark:shadow-[0_8px_0_#1e293b]
      border-2 border-slate-200 dark:border-slate-700
      active:translate-y-2 active:shadow-none transition-all duration-100 flex items-center justify-center
      ${isRecording ? 'translate-y-2 shadow-none border-green-400 bg-green-50 dark:bg-green-900/20' : ''}
    `}
  >
    <div className={`
      w-10 h-10 rounded-full flex items-center justify-center transition-colors
      ${isRecording ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}
    `}>
      <div className={`w-3 h-3 bg-current rounded-full ${isRecording ? 'animate-bounce' : ''}`} />
    </div>
  </button>
);

const Playful4: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative overflow-hidden w-32 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-blue-400 group"
  >
    <motion.div
      className="absolute inset-0 bg-blue-400"
      initial={{ x: "-100%" }}
      animate={{ x: isRecording ? "0%" : "-100%" }}
      transition={{ type: "spring", damping: 20 }}
    />
    <span className={`
      relative z-10 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 w-full h-full
      ${isRecording ? 'text-white' : 'text-blue-500'}
    `}>
      {isRecording ? (
        <>Recording <span className="animate-pulse">●</span></>
      ) : (
        <>Press Me</>
      )}
    </span>
  </button>
);

const Playful5: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center
      transition-all duration-500
      ${isRecording ? 'rotate-180 bg-purple-100 dark:bg-purple-900/20' : 'hover:-rotate-12'}
    `}
  >
    <motion.div
      animate={{
        rotate: isRecording ? 360 : 0,
        scale: isRecording ? 1.2 : 1
      }}
      transition={{ duration: 0.5 }}
    >
      {isRecording ? (
        <Pause className="w-6 h-6 text-purple-600 fill-current" />
      ) : (
        <Play className="w-6 h-6 text-purple-400 ml-1 fill-current" />
      )}
    </motion.div>
  </button>
);

export default function PlayfulButtons() {
  const [recordingStates, setRecordingStates] = useState<Record<number, boolean>>({});

  const toggleRecording = (index: number) => {
    setRecordingStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center p-8 bg-amber-50 dark:bg-slate-800/50 rounded-2xl border border-amber-100 dark:border-slate-700">
      <div className="col-span-full w-full mb-4">
        <h3 className="text-sm font-semibold text-amber-500/70 dark:text-slate-400 uppercase tracking-wider">Playful & Fun</h3>
      </div>
      <Playful1 isRecording={!!recordingStates[1]} onClick={() => toggleRecording(1)} />
      <Playful2 isRecording={!!recordingStates[2]} onClick={() => toggleRecording(2)} />
      <Playful3 isRecording={!!recordingStates[3]} onClick={() => toggleRecording(3)} />
      <Playful4 isRecording={!!recordingStates[4]} onClick={() => toggleRecording(4)} />
      <Playful5 isRecording={!!recordingStates[5]} onClick={() => toggleRecording(5)} />
    </div>
  );
}
