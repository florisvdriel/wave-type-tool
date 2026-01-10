export const bounce = (t, frequency = 1, amplitude = 1) => {
  // Elastic/bounce easing function
  const x = (t * frequency) % (Math.PI * 2);
  const normalized = x / (Math.PI * 2);

  // Bouncing effect using damped sine
  const decay = Math.exp(-normalized * 3);
  const oscillation = Math.sin(normalized * Math.PI * 4);

  return oscillation * decay * amplitude;
};

export const elastic = (t, frequency = 1, amplitude = 1) => {
  // More pronounced elastic effect
  const x = t * frequency;
  const decay = Math.exp(-Math.abs(Math.sin(x)) * 0.5);
  return Math.sin(x * 2) * decay * amplitude;
};
