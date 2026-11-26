import type { CellIndex } from './contracts/definition.ts';

export interface Coord {
  readonly row: number;
  readonly col: number;
}

const ORTHOGONAL: readonly Coord[] = [
  { row: -1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
];

const KING: readonly Coord[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

export function toIndex(columns: number, row: number, col: number): CellIndex {
  return row * columns + col;
}

export function toCoord(columns: number, cell: CellIndex): Coord {
  return { row: Math.floor(cell / columns), col: cell % columns };
}

export function inBounds(rows: number, columns: number, row: number, col: number): boolean {
  return (
    Number.isInteger(row) && Number.isInteger(col) && row >= 0 && col >= 0 && row < rows && col < columns
  );
}

function neighbourTable(rows: number, columns: number, offsets: readonly Coord[]): CellIndex[][] {
  const table: CellIndex[][] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const list: CellIndex[] = [];
      for (const d of offsets) {
        const r = row + d.row;
        const c = col + d.col;
        if (inBounds(rows, columns, r, c)) list.push(toIndex(columns, r, c));
      }
      table.push(list);
    }
  }
  return table;
}

/** Orthogonal (4-neighbourhood) adjacency, ascending cell order, no wrap-around. */
export function orthogonalNeighbours(rows: number, columns: number): CellIndex[][] {
  return neighbourTable(rows, columns, ORTHOGONAL);
}

/** King-move (8-neighbourhood) adjacency, ascending cell order, no wrap-around. */
export function kingNeighbours(rows: number, columns: number): CellIndex[][] {
  return neighbourTable(rows, columns, KING);
}

export function rowCells(columns: number, row: number): CellIndex[] {
  return Array.from({ length: columns }, (_, col) => toIndex(columns, row, col));
}

export function columnCells(rows: number, columns: number, col: number): CellIndex[] {
  return Array.from({ length: rows }, (_, row) => toIndex(columns, row, col));
}
