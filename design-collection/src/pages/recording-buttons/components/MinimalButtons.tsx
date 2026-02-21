import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Circle } from 'lucide-react';

interface ButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const Minimal1: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group"
  >
    <div className={`
      w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
      ${isRecording ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}
    `}>
      <motion.div
        animate={isRecording ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {isRecording ? (
          <Square className="w-6 h-6 text-white fill-current" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-red-500" />
        )}
      </motion.div>
    </div>
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
      {isRecording ? 'Recording...' : 'Tap to Record'}
    </span>
  </button>
);

const Minimal2: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      relative px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-3
      ${isRecording
        ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
    `}
  >
    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
    {isRecording ? '00:00:12' : 'Start Recording'}
  </button>
);

const Minimal3: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative group"
  >
    <motion.div
      className={`
        w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-colors
        ${isRecording
          ? 'border-red-500 bg-red-500 text-white'
          : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-red-400 hover:text-red-400'}
      `}
      animate={isRecording ? { borderRadius: "50%" } : { borderRadius: "12px" }}
    >
      <Mic className="w-6 h-6" />
    </motion.div>
    {isRecording && (
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      />
    )}
  </button>
);

const Minimal4: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 group"
  >
    <div className={`
      w-12 h-12 rounded-full border flex items-center justify-center transition-all
      ${isRecording ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700'}
    `}>
       <motion.div
        animate={isRecording ? { height: [12, 24, 16, 28, 12] } : { height: 12 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className={`w-1 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      />
      <motion.div
        animate={isRecording ? { height: [20, 12, 30, 14, 20] } : { height: 20 }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 }}
        className={`w-1 mx-1 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      />
      <motion.div
        animate={isRecording ? { height: [16, 28, 12, 24, 16] } : { height: 16 }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        className={`w-1 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}
      />
    </div>
    <div className="text-left">
      <div className="text-sm font-semibold text-slate-900 dark:text-white">
        {isRecording ? 'Recording Audio' : 'Voice Memo'}
      </div>
      <div className="text-xs text-slate-500">
        {isRecording ? 'Tap to stop' : 'Tap to start'}
      </div>
    </div>
  </button>
);

const Minimal5: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <div className="flex items-center justify-center">
    <button
      onClick={onClick}
      className={`
        px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all
        ${isRecording
          ? 'bg-red-600 text-white shadow-lg shadow-red-500/40 hover:bg-red-700'
          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'}
      `}
    >
      {isRecording ? (
        <span className="flex items-center gap-2">
          <Square className="w-4 h-4 fill-current" /> Stop
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Circle className="w-4 h-4 fill-current" /> Record
        </span>
      )}
    </button>
  </div>
);

export default function MinimalButtons() {
  const [recordingStates, setRecordingStates] = useState<Record<number, boolean>>({});

  const toggleRecording = (index: number) => {
    setRecordingStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
      <div className="col-span-full w-full mb-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Minimal Collection</h3>
      </div>
      <Minimal1 isRecording={!!recordingStates[1]} onClick={() => toggleRecording(1)} />
      <Minimal2 isRecording={!!recordingStates[2]} onClick={() => toggleRecording(2)} />
      <Minimal3 isRecording={!!recordingStates[3]} onClick={() => toggleRecording(3)} />
      <Minimal4 isRecording={!!recordingStates[4]} onClick={() => toggleRecording(4)} />
      <Minimal5 isRecording={!!recordingStates[5]} onClick={() => toggleRecording(5)} />
    </div>
  );
}
