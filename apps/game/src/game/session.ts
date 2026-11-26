/**
 * Puzzle-screen state as a pure reducer (ADR-0008, M0-REVIEW §6.2). All board transitions go through core
 * `dispatch` / `undo` / `redo`; this module only maps tools + taps to core actions. Hints come from the
 * solver's `nextHint` on the current marks (ADR-0008 P4): never auto-applied, unlimited, no penalty, and
 * cleared by any board change.
 */
import {
  type CellIndex,
  type CellMark,
  createGame,
  dispatch,
  type GameState,
  type Puzzle,
  redo,
  type SpeciesId,
  undo,
} from '@ww/puzzle-core';
import { type Conclusion, type DeductionStep, type Hint, nextHint } from '@ww/puzzle-solver';

export type Tool = { readonly kind: 'species'; readonly species: SpeciesId } | { readonly kind: 'empty' };

export type ContradictionHint = Extract<Hint, { kind: 'contradiction' }>;

export type HintState =
  | {
      readonly kind: 'deduction';
      /** 1: region + strategy name · 2: full explanation + Apply. */
      readonly stage: 1 | 2;
      readonly steps: readonly DeductionStep[];
      readonly conclusion: Conclusion;
    }
  | {
      readonly kind: 'contradiction';
      readonly hint: ContradictionHint;
      /** Undos back to the nearest board that is not a contradiction; null if none exists in history. */
      readonly rewind: number | null;
      /** The player asked to rewind and is now asked to confirm. */
      readonly confirming: boolean;
    }
  | { readonly kind: 'stuck' }
  | { readonly kind: 'solved' };

export interface Session {
  readonly puzzle: Puzzle;
  readonly game: GameState;
  readonly tool: Tool;
  readonly hint: HintState | null;
}

export type SessionAction =
  | { readonly type: 'selectSpecies'; readonly species: SpeciesId }
  | { readonly type: 'selectEmpty' }
  | { readonly type: 'tapCell'; readonly cell: CellIndex }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' }
  | { readonly type: 'requestHint' }
  | { readonly type: 'revealHint' }
  | { readonly type: 'applyHint' }
  | { readonly type: 'dismissHint' }
  | { readonly type: 'askRewind' }
  | { readonly type: 'cancelRewind' }
  | { readonly type: 'confirmRewind' };

/** Default tool is the first species in canonical ruleset order (or the empty tool for a species-less puzzle). */
export function createSession(puzzle: Puzzle): Session {
  const first = puzzle.species[0];
  return {
    puzzle,
    game: createGame(puzzle),
    tool: first === undefined ? { kind: 'empty' } : { kind: 'species', species: first },
    hint: null,
  };
}

/**
 * Tap semantics: a species tool places its species (replacing anything else) or clears the cell if that species
 * is already there; the empty tool toggles between `empty` and `unmarked`.
 */
export function markForTap(current: CellMark, tool: Tool): CellMark {
  if (tool.kind === 'empty') return current === 'empty' ? 'unmarked' : 'empty';
  return current === tool.species ? 'unmarked' : tool.species;
}

/**
 * Smallest number of undos after which `nextHint` no longer reports a contradiction, or null when even the
 * oldest recorded board is contradictory (cannot happen for valid puzzles, whose blank board is workable).
 */
export function findWorkableRewind(puzzle: Puzzle, game: GameState): number | null {
  let current: GameState = game;
  for (let steps = 1; steps <= game.history.past.length; steps++) {
    const previous = undo(current);
    if (!previous) return null;
    current = previous;
    if (nextHint(puzzle, current.board.marks).kind !== 'contradiction') return steps;
  }
  return null;
}

/** Compute the hint for the current board (stage 1 for deductions). */
export function hintFor(puzzle: Puzzle, game: GameState): HintState {
  const hint = nextHint(puzzle, game.board.marks);
  switch (hint.kind) {
    case 'deduction':
      return { kind: 'deduction', stage: 1, steps: hint.steps, conclusion: hint.conclusion };
    case 'contradiction':
      return { kind: 'contradiction', hint, rewind: findWorkableRewind(puzzle, game), confirming: false };
    case 'stuck':
      return { kind: 'stuck' };
    case 'solved':
      return { kind: 'solved' };
  }
}

/** A board change always clears the hint (it may no longer apply). */
function withGame(state: Session, game: GameState): Session {
  return { ...state, game, hint: null };
}

/** Returns the same object when nothing changes, so React can skip re-renders. */
export function sessionReducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'selectSpecies': {
      if (!state.puzzle.species.includes(action.species)) return state;
      if (state.tool.kind === 'species' && state.tool.species === action.species) return state;
      return { ...state, tool: { kind: 'species', species: action.species } };
    }
    case 'selectEmpty':
      return state.tool.kind === 'empty' ? state : { ...state, tool: { kind: 'empty' } };
    case 'tapCell': {
      const current = state.game.board.marks[action.cell];
      if (current === undefined) return state;
      const result = dispatch(state.puzzle, state.game, {
        type: 'setCell',
        cell: action.cell,
        mark: markForTap(current, state.tool),
      });
      // Rejections (habitat cell, out of bounds, no-op) leave the board untouched: habitat cells are inert.
      return result.ok ? withGame(state, result.game) : state;
    }
    case 'undo': {
      const game = undo(state.game);
      return game ? withGame(state, game) : state;
    }
    case 'redo': {
      const game = redo(state.game);
      return game ? withGame(state, game) : state;
    }
    case 'requestHint':
      return { ...state, hint: hintFor(state.puzzle, state.game) };
    case 'revealHint': {
      const { hint } = state;
      if (hint?.kind !== 'deduction' || hint.stage === 2) return state;
      return { ...state, hint: { ...hint, stage: 2 } };
    }
    case 'applyHint': {
      const { hint } = state;
      if (hint?.kind !== 'deduction' || hint.stage !== 2) return state;
      const { cell, value } = hint.conclusion;
      // A normal, undoable move through core dispatch.
      const result = dispatch(state.puzzle, state.game, { type: 'setCell', cell, mark: value });
      return result.ok ? withGame(state, result.game) : { ...state, hint: null };
    }
    case 'dismissHint':
      return state.hint === null ? state : { ...state, hint: null };
    case 'askRewind':
    case 'cancelRewind': {
      const { hint } = state;
      if (hint?.kind !== 'contradiction' || hint.rewind === null) return state;
      const confirming = action.type === 'askRewind';
      return hint.confirming === confirming ? state : { ...state, hint: { ...hint, confirming } };
    }
    case 'confirmRewind': {
      const { hint } = state;
      if (hint?.kind !== 'contradiction' || hint.rewind === null || !hint.confirming) return state;
      let game: GameState = state.game;
      for (let i = 0; i < hint.rewind; i++) game = undo(game) ?? game;
      // Plain core undos: every rewound move stays redo-able.
      return withGame(state, game);
    }
  }
}
