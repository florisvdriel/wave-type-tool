// Seeded random number generator for reproducible results
const seededRandom = (seed) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const randomDistribution = (chars, params, canvasWidth, canvasHeight) => {
  const items = [];
  const { columns, rows, randomSeed } = params;
  const totalItems = columns * rows;
  const padding = 50; // Keep items away from edges

  let seed = randomSeed;

  for (let i = 0; i < totalItems; i++) {
    const x = padding + seededRandom(seed++) * (canvasWidth - padding * 2);
    const y = padding + seededRandom(seed++) * (canvasHeight - padding * 2);

    // Calculate virtual row/col based on position
    const virtualCol = Math.floor((x / canvasWidth) * columns);
    const virtualRow = Math.floor((y / canvasHeight) * rows);

    items.push({
      char: chars[i % chars.length],
      x,
      y,
      row: virtualRow,
      col: virtualCol,
      index: i,
      totalRows: rows,
      totalCols: columns,
    });
  }

  return items;
};

export const scatteredDistribution = (chars, params, canvasWidth, canvasHeight) => {
  // Similar to random but with some clustering behavior
  const items = [];
  const { columns, rows, randomSeed } = params;
  const totalItems = columns * rows;

  let seed = randomSeed;

  // Create cluster centers
  const clusterCount = Math.ceil(totalItems / 10);
  const clusters = [];
  for (let i = 0; i < clusterCount; i++) {
    clusters.push({
      x: seededRandom(seed++) * canvasWidth,
      y: seededRandom(seed++) * canvasHeight,
    });
  }

  for (let i = 0; i < totalItems; i++) {
    // Pick a random cluster
    const cluster = clusters[Math.floor(seededRandom(seed++) * clusters.length)];
    const scatter = 100 + seededRandom(seed++) * 150;

    const x = cluster.x + (seededRandom(seed++) - 0.5) * scatter * 2;
    const y = cluster.y + (seededRandom(seed++) - 0.5) * scatter * 2;

    const virtualCol = Math.floor((x / canvasWidth) * columns);
    const virtualRow = Math.floor((y / canvasHeight) * rows);

    items.push({
      char: chars[i % chars.length],
      x: Math.max(20, Math.min(canvasWidth - 20, x)),
      y: Math.max(20, Math.min(canvasHeight - 20, y)),
      row: Math.max(0, Math.min(rows - 1, virtualRow)),
      col: Math.max(0, Math.min(columns - 1, virtualCol)),
      index: i,
      totalRows: rows,
      totalCols: columns,
    });
  }

  return items;
};
