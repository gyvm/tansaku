import { GlitchSettings } from './types';
import { applyScanline } from './scanline';
import { applyRgbSplit } from './rgbSplit';
import { applySliceShift } from './sliceShift';
import { applyNoise } from './noise';
import { applyPseudoPixelSort } from './pseudoPixelSort';

/**
 * 全ての有効なグリッチエフェクトを順番に適用するパイプライン関数
 * 入力画像は複製され、元のImageDataは変更されません。
 */
export const applyGlitchPipeline = (
  sourceImageData: ImageData,
  settings: GlitchSettings
): ImageData => {
  // 元のImageDataを変更しないようにバッファをコピー
  const newArray = new Uint8ClampedArray(sourceImageData.data);
  let currentImageData = new ImageData(newArray, sourceImageData.width, sourceImageData.height);

  // 1. Scanline (走査線)
  if (settings.scanline.strength > 0) {
    currentImageData = applyScanline(currentImageData, settings.scanline.strength);
  }

  // 2. Noise (ノイズ)
  // 色ズレの前にノイズを入れるか、後に入れるかで質感が変わる (今回は前)
  if (settings.noise.strength > 0) {
    currentImageData = applyNoise(currentImageData, settings.noise.strength);
  }

  // 3. Slice Shift (帯状のズレ)
  if (settings.sliceShift.strength > 0) {
    currentImageData = applySliceShift(currentImageData, settings.sliceShift.strength);
  }

  // 4. RGB Split (色収差・色ズレ)
  if (settings.rgbSplit.strength > 0) {
    currentImageData = applyRgbSplit(currentImageData, settings.rgbSplit.strength);
  }

  // 5. Pixel Sort (ピクセルソート風)
  if (settings.pixelSort.strength > 0) {
    currentImageData = applyPseudoPixelSort(currentImageData, settings.pixelSort.strength);
  }

  return currentImageData;
};
