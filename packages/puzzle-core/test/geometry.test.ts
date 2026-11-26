import { describe, expect, it } from 'vitest';
import {
  columnCells,
  inBounds,
  kingNeighbours,
  orthogonalNeighbours,
  rowCells,
  toCoord,
  toIndex,
} from '../src/index.ts';

describe('geometry', () => {
  it('round-trips index and coordinates on rectangular boards', () => {
    for (const [rows, cols] of [
      [3, 3],
      [4, 7],
      [10, 3],
    ] as const)
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) expect(toCoord(cols, toIndex(cols, r, c))).toEqual({ row: r, col: c });
  });

  it('orthogonal neighbours respect corners, edges and interior (5x4)', () => {
    const n = orthogonalNeighbours(5, 4);
    expect(n[toIndex(4, 0, 0)]).toEqual([1, 4]);
    expect(n[toIndex(4, 0, 3)]).toEqual([2, 7]);
    expect(n[toIndex(4, 4, 3)]).toEqual([15, 18]);
    expect(n[toIndex(4, 2, 0)]).toEqual([4, 9, 12]);
    expect(n[toIndex(4, 2, 2)]).toHaveLength(4);
  });

  it('king neighbours include diagonals without wrap-around', () => {
    const n = kingNeighbours(3, 5);
    expect(n[0]).toEqual([1, 5, 6]);
    expect(n[toIndex(5, 0, 4)]).toEqual([3, 8, 9]);
    expect(n[toIndex(5, 1, 2)]).toHaveLength(8);
    expect(n[toIndex(5, 1, 4)]).not.toContain(toIndex(5, 2, 0));
  });

  it('lines and bounds', () => {
    expect(rowCells(4, 1)).toEqual([4, 5, 6, 7]);
    expect(columnCells(3, 4, 2)).toEqual([2, 6, 10]);
    expect(inBounds(3, 4, 2, 3)).toBe(true);
    expect(inBounds(3, 4, 3, 0)).toBe(false);
    expect(inBounds(3, 4, -1, 0)).toBe(false);
    expect(inBounds(3, 4, 0.5, 0)).toBe(false);
  });
});
