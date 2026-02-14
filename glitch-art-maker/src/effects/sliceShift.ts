export const applySliceShift = (imageData: ImageData, strength: number): ImageData => {
  if (strength <= 0) return imageData;

  const { data, width, height } = imageData;

  // Number of slices: 0 to 20
  const numSlices = Math.floor((strength / 100) * 20);
  // Max shift: 0 to 50px
  const maxShift = Math.floor((strength / 100) * 50);

  if (numSlices === 0) return imageData;

  // We need a copy to read from, so we don't smear the image recursively within the same frame
  const original = new Uint8ClampedArray(data);

  for (let n = 0; n < numSlices; n++) {
    // Random height: 5 to 50px
    const sliceHeight = Math.floor(Math.random() * 45) + 5;
    // Random y position
    const startY = Math.floor(Math.random() * (height - sliceHeight));
    // Random shift: -maxShift to +maxShift
    const shift = Math.floor((Math.random() - 0.5) * 2 * maxShift);

    if (shift === 0) continue;

    for (let y = startY; y < startY + sliceHeight; y++) {
      for (let x = 0; x < width; x++) {
        // We want to move pixel at x to x+shift
        // So at destination x, we read from x-shift

        let sourceX = x - shift;

        // Wrap around or clamp?
        // Cyberpunk style usually looks cool with wrap or simple clamp.
        // Let's wrap for more chaotic feel.
        if (sourceX < 0) sourceX += width;
        if (sourceX >= width) sourceX -= width;

        const destIndex = (y * width + x) * 4;
        const sourceIndex = (y * width + sourceX) * 4;

        data[destIndex] = original[sourceIndex];
        data[destIndex+1] = original[sourceIndex+1];
        data[destIndex+2] = original[sourceIndex+2];
        data[destIndex+3] = original[sourceIndex+3];
      }
    }
  }

  return imageData;
};
