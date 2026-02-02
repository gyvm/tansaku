import { useState, useEffect, useRef, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { initStorage, getItem, setItem } from '../services/storage';

const DEFAULT_PX_PER_METER = 3779.527559;
const MARATHON_KM = 42.195;

// Check if running in Tauri environment
// @ts-ignore
const isTauri = typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

interface MouseMarathonState {
  todayPx: number;
  totalPx: number;
  isRunning: boolean;
  pxPerMeter: number;
  lastUpdated: string;
}

export function useMouseMarathon() {
  const [todayPx, setTodayPx] = useState(0);
  const [totalPx, setTotalPx] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pxPerMeter, setPxPerMeter] = useState(DEFAULT_PX_PER_METER);
  const [loaded, setLoaded] = useState(false);
  const [celebration, setCelebration] = useState<{count: number} | null>(null);

  const stateRef = useRef({ todayPx, totalPx, isRunning, pxPerMeter });
  useEffect(() => {
    stateRef.current = { todayPx, totalPx, isRunning, pxPerMeter };
  }, [todayPx, totalPx, isRunning, pxPerMeter]);

  // Load initial state
  useEffect(() => {
    async function load() {
      await initStorage();
      const saved = await getItem<MouseMarathonState>('app_state');
      const today = new Date().toISOString().split('T')[0];

      if (saved) {
        setTotalPx(saved.totalPx || 0);
        setPxPerMeter(saved.pxPerMeter || DEFAULT_PX_PER_METER);

        // Reset today if date changed
        if (saved.lastUpdated === today) {
          setTodayPx(saved.todayPx || 0);
        } else {
          setTodayPx(0);
        }

        setIsRunning(saved.isRunning ?? true);
      } else {
        setIsRunning(true);
      }
      setLoaded(true);
    }
    load();
  }, []);

  // Sync backend tracking
  useEffect(() => {
    if (!loaded || !isTauri) return;
    invoke('set_tracking', { enabled: isRunning }).catch(console.error);
  }, [isRunning, loaded]);

  // Save state (Debounced)
  const saveTimeout = useRef<number | null>(null);
  const saveState = useCallback(() => {
    if (saveTimeout.current) return;
    saveTimeout.current = window.setTimeout(async () => {
      const { todayPx, totalPx, isRunning, pxPerMeter } = stateRef.current;
      const today = new Date().toISOString().split('T')[0];
      await setItem('app_state', {
        todayPx,
        totalPx,
        isRunning,
        pxPerMeter,
        lastUpdated: today
      });
      saveTimeout.current = null;
    }, 1000);
  }, []);

  // Auto-save settings on change
  useEffect(() => {
    if (loaded) saveState();
  }, [pxPerMeter, isRunning, loaded, saveState]);

  // Celebration Check
  const prevCount = useRef<number>(-1); // Start -1 to avoid initial trigger
  useEffect(() => {
     if (!loaded) return;
     const currentKm = totalPx / pxPerMeter / 1000;
     const count = Math.floor(currentKm / MARATHON_KM);

     if (prevCount.current === -1) {
         prevCount.current = count;
     } else if (count > prevCount.current) {
         setCelebration({ count });
         prevCount.current = count;
     }
  }, [totalPx, pxPerMeter, loaded]);

  // Event Listener
  useEffect(() => {
    let unlisten: () => void;

    async function setupListener() {
      if (!isTauri) return;
      try {
        unlisten = await listen<number>('mouse-moved', (event) => {
          const delta = event.payload;
          if (stateRef.current.isRunning) {
               setTodayPx(p => p + delta);
               setTotalPx(p => p + delta);
               saveState();
          }
        });
      } catch (e) {
          console.error("Failed to listen to events", e);
      }
    }

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [saveState]);

  const reset = useCallback(async () => {
      setTodayPx(0);
      setTotalPx(0);
      const today = new Date().toISOString().split('T')[0];
      await setItem('app_state', {
        todayPx: 0,
        totalPx: 0,
        isRunning: stateRef.current.isRunning,
        pxPerMeter: stateRef.current.pxPerMeter,
        lastUpdated: today
      });
      prevCount.current = 0;
  }, []);

  const todayKm = todayPx / pxPerMeter / 1000;
  const totalKm = totalPx / pxPerMeter / 1000;
  const marathonCount = Math.floor(totalKm / MARATHON_KM);
  const nextMarathonKm = (marathonCount + 1) * MARATHON_KM;
  const remainingKm = Math.max(0, nextMarathonKm - totalKm);

  return {
    todayKm,
    totalKm,
    remainingKm,
    marathonCount,
    isRunning,
    setIsRunning,
    reset,
    pxPerMeter,
    setPxPerMeter,
    loaded,
    celebration,
    setCelebration
  };
}
