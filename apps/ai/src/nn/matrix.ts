export function transpose(matrix: number[][]): number[][] {
  const output: number[][] = [];
  for (const [x, row] of matrix.entries()) {
    for (const [y, val] of row.entries()) {
      output[y] = output[y] || [];
      output[y].push(val);
    }
  }
  return output;
}
