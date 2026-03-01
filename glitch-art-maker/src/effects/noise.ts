export const applyNoise = (imageData: ImageData, strength: number): ImageData => {
  if (strength <= 0) return imageData;

  const { data } = imageData;
  // Max noise amount 0-100
  // Strength 100 => +/- 100 to pixel value
  const amount = (strength / 100) * 100;

  for (let i = 0; i < data.length; i += 4) {
    // Random value between -amount/2 and +amount/2?
    // Or just 0 to amount?
    // "Granular noise" usually implies random +/-
    const noise = (Math.random() - 0.5) * amount;

    // Add noise to RGB
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
    data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    // Alpha unchanged
  }

  return imageData;
};
