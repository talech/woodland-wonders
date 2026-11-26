/**
 * Player board, action and history contracts. FROZEN — changes require an ADR.
 */
import type { CellIndex, HabitatId, PuzzleId, SpeciesId } from './definition.ts';

/**
 * Player mark for a cell. Habitat cells are always `'unmarked'`.
 * `'unmarked'` (undecided) and `'empty'` (player asserts no animal) are distinct states.
 */
export type CellMark = 'unmarked' | 'empty' | SpeciesId;

/** Derived, presentation-friendly view of a cell. */
export type CellView =
  | { readonly kind: 'habitat'; readonly habitat: HabitatId }
  | { readonly kind: 'unmarked' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'animal'; readonly species: SpeciesId };

export interface BoardState {
  readonly puzzleId: PuzzleId;
  readonly revision: number;
  readonly marks: readonly CellMark[];
}

export type Action =
  | { readonly type: 'setCell'; readonly cell: CellIndex; readonly mark: CellMark }
  | { readonly type: 'clearAll' };

export interface CellChange {
  readonly cell: CellIndex;
  readonly from: CellMark;
  readonly to: CellMark;
}

/** An atomic, invertible change produced by one action. */
export interface Change {
  readonly cells: readonly CellChange[];
}

export type ActionRejection = 'habitat-cell' | 'out-of-bounds' | 'unknown-species' | 'no-op';

export type ApplyResult =
  | { readonly ok: true; readonly state: BoardState; readonly change: Change }
  | { readonly ok: false; readonly reason: ActionRejection };

export interface History {
  /** Oldest first. */
  readonly past: readonly Change[];
  /** Next redo first. */
  readonly future: readonly Change[];
}

export interface GameState {
  readonly board: BoardState;
  readonly history: History;
}

export type DispatchResult =
  | { readonly ok: true; readonly game: GameState; readonly change: Change }
  | { readonly ok: false; readonly reason: ActionRejection };
