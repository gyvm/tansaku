export interface GlitchSettings {
  scanline: {
    strength: number; // 0-100
  };
  rgbSplit: {
    strength: number; // 0-100
  };
  sliceShift: {
    strength: number; // 0-100
  };
  noise: {
    strength: number; // 0-100
  };
  pixelSort: {
    strength: number; // 0-100
  };
}

export const DEFAULT_SETTINGS: GlitchSettings = {
  scanline: { strength: 0 },
  rgbSplit: { strength: 0 },
  sliceShift: { strength: 0 },
  noise: { strength: 0 },
  pixelSort: { strength: 0 },
};

export type GlitchEffect = (imageData: ImageData, strength: number) => ImageData;
