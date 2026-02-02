import { useState, useEffect } from 'react';
import { useMouseMarathon } from './hooks/useMouseMarathon';
import { Play, Pause, RotateCcw, Settings, Trophy, X, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const {
    todayKm, totalKm, remainingKm, marathonCount,
    isRunning, setIsRunning, reset,
    pxPerMeter, setPxPerMeter,
    celebration, setCelebration
  } = useMouseMarathon();

  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [localPx, setLocalPx] = useState(String(pxPerMeter));

  useEffect(() => {
    setLocalPx(String(pxPerMeter));
  }, [pxPerMeter]);

  const handleSaveSettings = () => {
    const val = parseFloat(localPx);
    if (!isNaN(val) && val > 0) {
      setPxPerMeter(val);
      setShowSettings(false);
    }
  };

  const handleReset = () => {
    reset();
    setShowResetConfirm(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-slate-800 to-black flex items-center justify-center p-4 font-sans select-none">
       {/* Main Card */}
       <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-white relative">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                <Trophy size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Mouse Marathon</h1>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
            >
              <Settings size={20} />
            </button>
          </div>

          {/* Today's Distance (Hero) */}
          <div className="mb-8 text-center">
            <div className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Today</div>
            <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
              {todayKm.toFixed(3)}
              <span className="text-2xl ml-2 font-normal text-white/40">km</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="text-white/50 text-xs font-bold uppercase mb-1">Total</div>
              <div className="text-xl font-semibold">{totalKm.toFixed(2)} <span className="text-sm text-white/40">km</span></div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
               <div className="text-white/50 text-xs font-bold uppercase mb-1">Next Marathon</div>
               <div className="text-xl font-semibold">{remainingKm.toFixed(2)} <span className="text-sm text-white/40">km</span></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "flex-1 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                isRunning
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/50 hover:bg-amber-500/20"
                  : "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20"
              )}
            >
              {isRunning ? <><Pause fill="currentColor" size={20} /> Stop</> : <><Play fill="currentColor" size={20} /> Start</>}
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/5 transition-all active:scale-95"
            >
              <RotateCcw size={24} />
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-white/30">
             {marathonCount > 0 ? `${marathonCount} Marathons Completed` : "Keep moving!"}
          </div>
       </div>

       {/* Settings Modal */}
       {showSettings && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-white font-bold text-lg">Settings</h2>
               <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
             </div>

             <label className="block text-white/70 text-sm mb-2">Pixels per Meter</label>
             <input
                type="number"
                value={localPx}
                onChange={(e) => setLocalPx(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 mb-4"
             />
             <p className="text-xs text-white/30 mb-6">
               Adjust based on your screen DPI. Default (96 DPI) is approx 3779.5 px/m.
             </p>

             <button onClick={handleSaveSettings} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
               Save
             </button>
           </div>
         </div>
       )}

       {/* Reset Confirm Modal */}
       {showResetConfirm && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#1e1e2e] border border-white/10 rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
              <h2 className="text-white font-bold text-xl mb-2">Reset Data?</h2>
              <p className="text-white/60 text-sm mb-6">This will clear your total distance and progress. This action cannot be undone.</p>

              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl">Cancel</button>
                <button onClick={handleReset} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20">Reset</button>
              </div>
            </div>
         </div>
       )}

       {/* Celebration Modal */}
       {celebration && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center border-4 border-white/20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-30 pointer-events-none"></div>

             <Trophy size={64} className="mx-auto text-white mb-4 drop-shadow-md animate-bounce" />
             <h2 className="text-3xl font-black text-white mb-2 drop-shadow-sm">FULL MARATHON!</h2>
             <p className="text-white/90 text-lg mb-6 leading-relaxed">
               おめでとう！<br/>
               あなたのカーソルは42.195km分、<br/>迷走しました。
             </p>
             <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-white font-bold mb-8">
               {celebration.count}回目の完走
             </div>

             <button
               onClick={() => setCelebration(null)}
               className="w-full bg-white text-orange-600 font-bold py-4 rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
             >
               Awesome!
             </button>
           </div>
         </div>
       )}
    </div>
  )
}
