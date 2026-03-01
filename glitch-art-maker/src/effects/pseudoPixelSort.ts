export const applyPseudoPixelSort = (imageData: ImageData, strength: number): ImageData => {
  if (strength <= 0) return imageData;

  const { data, width, height } = imageData;

  // Strength 0 -> Threshold 255 (none)
  // Strength 100 -> Threshold 50 (many)
  const threshold = 255 - ((strength / 100) * 200);

  // Max span to sort/smear
  const maxSpan = Math.floor((strength / 100) * 50);

  // Helper to process a span
  const processSpan = (start: number, end: number, y: number) => {
    const spanLength = end - start;
    if (spanLength <= 1) return;

    const safeSpan = Math.min(spanLength, maxSpan);

    // Do a few passes to make the effect more visible than just 1 pixel shift
    // But keep it cheap. 3 passes?
    const passes = 3;

    for (let p = 0; p < passes; p++) {
      for (let k = 0; k < safeSpan - 1; k++) {
        const p1 = start + k;
        const p2 = p1 + 1;

        const i1 = (y * width + p1) * 4;
        const i2 = (y * width + p2) * 4;

        const b1 = (data[i1] + data[i1+1] + data[i1+2]);
        const b2 = (data[i2] + data[i2+1] + data[i2+2]);

        // If left is brighter, swap to right
        if (b1 > b2) {
            const r = data[i1]; const g = data[i1+1]; const b = data[i1+2];
            data[i1] = data[i2]; data[i1+1] = data[i2+1]; data[i1+2] = data[i2+2];
            data[i2] = r; data[i2+1] = g; data[i2+2] = b;
        }
      }
    }
  };

  for (let y = 0; y < height; y++) {
    let spanStart = -1;

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const brightness = (data[i] + data[i+1] + data[i+2]) / 3;

      if (brightness > threshold) {
        if (spanStart === -1) spanStart = x;
      } else {
        if (spanStart !== -1) {
          processSpan(spanStart, x, y);
          spanStart = -1;
        }
      }
    }
    // Handle end of row
    if (spanStart !== -1) {
      processSpan(spanStart, width, y);
    }
  }

  return imageData;
};
