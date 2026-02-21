import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Activity } from 'lucide-react';

interface ButtonProps {
  isRecording: boolean;
  onClick: () => void;
}

const Neon1: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative group"
  >
    <div className={`
      absolute inset-0 rounded-full blur-md transition-all duration-300
      ${isRecording ? 'bg-cyan-500 scale-125' : 'bg-cyan-500/20 scale-100 group-hover:bg-cyan-500/50'}
    `} />
    <div className={`
      relative w-16 h-16 rounded-full border-2 border-cyan-400 bg-black flex items-center justify-center
      transition-all duration-300
      ${isRecording ? 'shadow-[0_0_20px_#22d3ee,inset_0_0_10px_#22d3ee]' : 'shadow-[0_0_5px_#22d3ee]'}
    `}>
      <Mic className={`w-6 h-6 text-cyan-400 ${isRecording ? 'animate-pulse' : ''}`} />
    </div>
  </button>
);

const Neon2: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-6 py-3 rounded-none border border-pink-500 font-mono tracking-widest text-pink-500
      transition-all duration-100 relative overflow-hidden group
      ${isRecording ? 'bg-pink-500 text-black shadow-[0_0_15px_#ec4899]' : 'bg-transparent hover:bg-pink-500/10'}
    `}
  >
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none">
      <div className="w-full h-[1px] bg-pink-500 animate-[scan_2s_linear_infinite]" />
    </div>
    {isRecording ? 'RECORDING' : 'INITIATE'}
  </button>
);

const Neon3: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-20 h-20 flex items-center justify-center"
  >
    <svg className="absolute inset-0 w-full h-full -rotate-90">
      <circle
        cx="40" cy="40" r="36"
        stroke="currentColor" strokeWidth="2" fill="transparent"
        className="text-slate-800"
      />
      <motion.circle
        cx="40" cy="40" r="36"
        stroke="currentColor" strokeWidth="2" fill="transparent"
        className="text-green-400 drop-shadow-[0_0_3px_#4ade80]"
        strokeDasharray="226"
        strokeDashoffset="226"
        animate={isRecording ? { strokeDashoffset: 0 } : { strokeDashoffset: 226 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
    </svg>
    <div className={`
      w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700
      transition-all duration-300
      ${isRecording ? 'shadow-[0_0_15px_#4ade80]' : ''}
    `}>
      <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-400' : 'bg-slate-600'}`} />
    </div>
  </button>
);

const Neon4: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className="relative group"
  >
    <motion.div
      className={`
        w-16 h-16 rounded-lg bg-indigo-900 border border-indigo-500/50 flex items-center justify-center
        relative z-10 overflow-hidden
      `}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`absolute inset-0 bg-indigo-500/20 ${isRecording ? 'animate-pulse' : 'hidden'}`} />

      {isRecording ? (
        <div className="flex items-end gap-1 h-6">
           {[1, 2, 3, 4].map(i => (
             <motion.div
               key={i}
               className="w-1 bg-indigo-400"
               animate={{ height: [4, 16, 8, 24, 4] }}
               transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
             />
           ))}
        </div>
      ) : (
        <Activity className="w-6 h-6 text-indigo-400" />
      )}
    </motion.div>

    {isRecording && (
      <motion.div
        className="absolute inset-0 rounded-lg bg-indigo-500 -z-10"
        animate={{ scale: 1.2, opacity: 0 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
    )}
  </button>
);

const Neon5: React.FC<ButtonProps> = ({ isRecording, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-8 py-3 rounded-full text-sm font-bold transition-all relative
      bg-black border border-white/10 text-white overflow-hidden
      hover:border-white/30
    `}
  >
    <div className={`
      absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600
      transition-opacity duration-500 -z-10
      ${isRecording ? 'opacity-100 animate-gradient-x' : 'opacity-0'}
    `} style={{ backgroundSize: '200% 100%' }} />

    <span className="relative z-10 flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
      {isRecording ? 'ON AIR' : 'STANDBY'}
    </span>
  </button>
);

export default function NeonButtons() {
  const [recordingStates, setRecordingStates] = useState<Record<number, boolean>>({});

  const toggleRecording = (index: number) => {
    setRecordingStates(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center p-8 bg-slate-900 rounded-2xl border border-slate-800">
      <div className="col-span-full w-full mb-4 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Neon & Cyberpunk</h3>
        <span className="text-xs text-slate-600">Dark Mode Only</span>
      </div>
      <Neon1 isRecording={!!recordingStates[1]} onClick={() => toggleRecording(1)} />
      <Neon2 isRecording={!!recordingStates[2]} onClick={() => toggleRecording(2)} />
      <Neon3 isRecording={!!recordingStates[3]} onClick={() => toggleRecording(3)} />
      <Neon4 isRecording={!!recordingStates[4]} onClick={() => toggleRecording(4)} />
      <Neon5 isRecording={!!recordingStates[5]} onClick={() => toggleRecording(5)} />
    </div>
  );
}
