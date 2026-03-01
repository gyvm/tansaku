export const applyScanline = (imageData: ImageData, strength: number): ImageData => {
  if (strength <= 0) return imageData;

  const { data, width, height } = imageData;
  // Map 0-100 to some useful intensity
  const intensity = strength / 100;

  // Fixed spacing for MVP, e.g., every 3rd line
  const lineSpacing = 3;

  for (let y = 0; y < height; y++) {
    if (y % lineSpacing === 0) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        // Darken pixel
        // Factor: 0 means no change, 1 means black
        // Let's say max strength makes it 50% darker
        const factor = 1 - (intensity * 0.7);

        data[i] = data[i] * factor;
        data[i+1] = data[i+1] * factor;
        data[i+2] = data[i+2] * factor;
      }
    }
  }

  return imageData;
};
