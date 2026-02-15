import { GlitchSettings } from './types';

export const PRESETS: Record<string, GlitchSettings> = {
  'CYBERPUNK MILD': {
    scanline: { strength: 30 },
    rgbSplit: { strength: 15 },
    sliceShift: { strength: 0 },
    noise: { strength: 10 },
    pixelSort: { strength: 0 },
  },
  'BROKEN SIGNAL': {
    scanline: { strength: 50 },
    rgbSplit: { strength: 0 },
    sliceShift: { strength: 60 },
    noise: { strength: 30 },
    pixelSort: { strength: 0 },
  },
  'NEON NIGHTMARE': {
    scanline: { strength: 10 },
    rgbSplit: { strength: 80 },
    sliceShift: { strength: 20 },
    noise: { strength: 50 },
    pixelSort: { strength: 70 },
  },
};
