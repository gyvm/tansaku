export const applyRgbSplit = (imageData: ImageData, strength: number): ImageData => {
  if (strength <= 0) return imageData;

  const { data, width, height } = imageData;
  // Max shift of 20px seems reasonable for 1200px width
  const offset = Math.floor((strength / 100) * 20);

  if (offset === 0) return imageData;

  // We need a copy of the source data because we are reading and writing to the same buffer logic
  // actually we are modifying 'data' in place, so we need to read from the 'original' state of this step.
  const original = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;

      // RED: Shift RIGHT
      // If x - offset is valid, take that pixel's RED from original
      // Actually simpler: The pixel at (x,y) should take the RED value from (x-offset, y)
      // Wait, usually RGB split means "The Red channel is drawn at x+offset".
      // So at pixel x, we see the Red that WAS at x-offset.
      let rIndex = -1;
      if (x - offset >= 0) {
        rIndex = (y * width + (x - offset)) * 4;
        data[i] = original[rIndex];
      } else {
        // Edge handling: just keep original or wrap? Let's keep original or 0?
        // Keeping original is less jarring.
        // Or 0?
        // Let's just not touch it (keeps original R).
      }

      // BLUE: Shift LEFT
      // At pixel x, we see the Blue that WAS at x+offset
      let bIndex = -1;
      if (x + offset < width) {
        bIndex = (y * width + (x + offset)) * 4;
        data[i + 2] = original[bIndex + 2];
      }

      // GREEN: Maybe shift vertically slightly?
      // Let's do a small vertical shift for G
      const vOffset = Math.floor(offset / 3);
      if (vOffset > 0 && y + vOffset < height) {
        const gIndex = ((y + vOffset) * width + x) * 4;
        data[i + 1] = original[gIndex + 1];
      }
    }
  }

  return imageData;
};
