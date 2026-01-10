export const waveDistribution = (chars, params, canvasWidth, canvasHeight) => {
  const items = [];
  const { columns, rows } = params;
  const padding = 50;

  const effectiveWidth = canvasWidth - padding * 2;
  const effectiveHeight = canvasHeight - padding * 2;

  for (let row = 0; row < rows; row++) {
    const rowProgress = row / (rows - 1 || 1);
    const baseY = padding + rowProgress * effectiveHeight;

    for (let col = 0; col < columns; col++) {
      const colProgress = col / (columns - 1 || 1);
      const baseX = padding + colProgress * effectiveWidth;

      // Add wave offset to Y position based on column
      const waveOffset = Math.sin(colProgress * Math.PI * 2) * 50;
      const y = baseY + waveOffset;

      const charIndex = row * columns + col;

      items.push({
        char: chars[charIndex % chars.length],
        x: baseX,
        y,
        row,
        col,
        index: charIndex,
        totalRows: rows,
        totalCols: columns,
      });
    }
  }

  return items;
};
