export const gridDistribution = (chars, params, canvasWidth, canvasHeight) => {
  const items = [];
  const { columns, rows } = params;

  const cellWidth = canvasWidth / columns;
  const cellHeight = canvasHeight / rows;

  let charIndex = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = col * cellWidth + cellWidth / 2;
      const y = row * cellHeight + cellHeight / 2;

      items.push({
        char: chars[charIndex % chars.length],
        x,
        y,
        row,
        col,
        index: charIndex,
        totalRows: rows,
        totalCols: columns,
      });

      charIndex++;
    }
  }

  return items;
};
