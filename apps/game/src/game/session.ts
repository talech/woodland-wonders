/**
 * Puzzle-screen state as a pure reducer (ADR-0008, M0-REVIEW §6.2). All board transitions go through core
 * `dispatch` / `undo` / `redo`; this module only maps tools + taps to core actions.
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

export type Tool = { readonly kind: 'species'; readonly species: SpeciesId } | { readonly kind: 'empty' };

export interface Session {
  readonly puzzle: Puzzle;
  readonly game: GameState;
  readonly tool: Tool;
}

export type SessionAction =
  | { readonly type: 'selectSpecies'; readonly species: SpeciesId }
  | { readonly type: 'selectEmpty' }
  | { readonly type: 'tapCell'; readonly cell: CellIndex }
  | { readonly type: 'undo' }
  | { readonly type: 'redo' };

/** Default tool is the first species in canonical ruleset order (or the empty tool for a species-less puzzle). */
export function createSession(puzzle: Puzzle): Session {
  const first = puzzle.species[0];
  return {
    puzzle,
    game: createGame(puzzle),
    tool: first === undefined ? { kind: 'empty' } : { kind: 'species', species: first },
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
      return result.ok ? { ...state, game: result.game } : state;
    }
    case 'undo': {
      const game = undo(state.game);
      return game ? { ...state, game } : state;
    }
    case 'redo': {
      const game = redo(state.game);
      return game ? { ...state, game } : state;
    }
  }
}
