// Perlin noise-based wave - requires p5 instance
let noiseOffset = 0;

export const noise = (t, frequency = 1, amplitude = 1, p5Instance = null) => {
  if (!p5Instance) {
    // Fallback to simple random-ish behavior
    return (Math.sin(t * frequency * 3.7) * Math.cos(t * frequency * 2.3)) * amplitude;
  }

  // Use p5's noise function for smooth randomness
  const noiseVal = p5Instance.noise(t * frequency + noiseOffset);
  // Map from 0-1 to -1 to 1
  return (noiseVal * 2 - 1) * amplitude;
};

export const setNoiseOffset = (offset) => {
  noiseOffset = offset;
};
