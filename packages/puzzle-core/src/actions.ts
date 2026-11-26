import type {
  Action,
  ApplyResult,
  BoardState,
  CellChange,
  CellMark,
  CellView,
  Change,
  DispatchResult,
  GameState,
  History,
} from './contracts/board.ts';
import type { Puzzle } from './contracts/constraints.ts';
import type { CellIndex } from './contracts/definition.ts';
import { gameStateSchema, type Result } from './schema.ts';

export function createBoard(puzzle: Puzzle): BoardState {
  return {
    puzzleId: puzzle.definition.id,
    revision: puzzle.definition.revision,
    marks: Object.freeze(new Array<CellMark>(puzzle.cellCount).fill('unmarked')),
  };
}

export const EMPTY_HISTORY: History = Object.freeze({ past: Object.freeze([]), future: Object.freeze([]) });

export function createGame(puzzle: Puzzle): GameState {
  return { board: createBoard(puzzle), history: EMPTY_HISTORY };
}

export function isValidMark(puzzle: Puzzle, mark: string): mark is CellMark {
  return mark === 'unmarked' || mark === 'empty' || puzzle.species.includes(mark);
}

export function cellView(puzzle: Puzzle, marks: readonly CellMark[], cell: CellIndex): CellView {
  const habitat = puzzle.habitatAt[cell];
  if (habitat != null) return { kind: 'habitat', habitat };
  const mark = marks[cell] ?? 'unmarked';
  if (mark === 'unmarked' || mark === 'empty') return { kind: mark };
  return { kind: 'animal', species: mark };
}

function withChange(board: BoardState, change: Change, direction: 'forward' | 'backward'): BoardState {
  const marks = [...board.marks];
  for (const c of change.cells) marks[c.cell] = direction === 'forward' ? c.to : c.from;
  return { ...board, marks: Object.freeze(marks) };
}

/** Pure, deterministic transition. Rule-breaking placements are allowed (ADR-0008 P1); structural ones are not. */
export function applyAction(puzzle: Puzzle, board: BoardState, action: Action): ApplyResult {
  let cells: CellChange[];
  switch (action.type) {
    case 'setCell': {
      const { cell, mark } = action;
      if (!Number.isInteger(cell) || cell < 0 || cell >= puzzle.cellCount)
        return { ok: false, reason: 'out-of-bounds' };
      if (puzzle.habitatAt[cell] != null) return { ok: false, reason: 'habitat-cell' };
      if (!isValidMark(puzzle, mark)) return { ok: false, reason: 'unknown-species' };
      const from = board.marks[cell] ?? 'unmarked';
      if (from === mark) return { ok: false, reason: 'no-op' };
      cells = [{ cell, from, to: mark }];
      break;
    }
    case 'clearAll': {
      cells = board.marks.flatMap((from, cell) =>
        from === 'unmarked' ? [] : [{ cell, from, to: 'unmarked' as const }],
      );
      if (cells.length === 0) return { ok: false, reason: 'no-op' };
      break;
    }
  }
  const change: Change = { cells };
  return { ok: true, state: withChange(board, change, 'forward'), change };
}

/** Apply an action and record it; clears the redo stack. */
export function dispatch(puzzle: Puzzle, game: GameState, action: Action): DispatchResult {
  const result = applyAction(puzzle, game.board, action);
  if (!result.ok) return result;
  return {
    ok: true,
    change: result.change,
    game: { board: result.state, history: { past: [...game.history.past, result.change], future: [] } },
  };
}

export function canUndo(game: GameState): boolean {
  return game.history.past.length > 0;
}

export function canRedo(game: GameState): boolean {
  return game.history.future.length > 0;
}

/** Returns the previous state, or `null` when there is nothing to undo. */
export function undo(game: GameState): GameState | null {
  const change = game.history.past.at(-1);
  if (!change) return null;
  return {
    board: withChange(game.board, change, 'backward'),
    history: { past: game.history.past.slice(0, -1), future: [change, ...game.history.future] },
  };
}

/** Returns the next state, or `null` when there is nothing to redo. */
export function redo(game: GameState): GameState | null {
  const change = game.history.future[0];
  if (!change) return null;
  return {
    board: withChange(game.board, change, 'forward'),
    history: { past: [...game.history.past, change], future: game.history.future.slice(1) },
  };
}

/**
 * Validate an untrusted saved game against a puzzle: shape, identity, legal marks, and history consistency
 * (every recorded change must replay exactly from the current board in both directions).
 */
export function parseGameState(puzzle: Puzzle, raw: unknown): Result<GameState> {
  const parsed = gameStateSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) };
  const { board, history } = parsed.data;
  const issues: string[] = [];
  if (board.puzzleId !== puzzle.definition.id) issues.push('puzzleId mismatch');
  if (board.revision !== puzzle.definition.revision) issues.push('revision mismatch');
  if (board.marks.length !== puzzle.cellCount) issues.push('marks length mismatch');
  if (issues.length > 0) return { ok: false, issues };

  const legalAt = (cell: number, mark: string) =>
    cell >= 0 &&
    cell < puzzle.cellCount &&
    isValidMark(puzzle, mark) &&
    (puzzle.habitatAt[cell] == null || mark === 'unmarked');
  board.marks.forEach((m, i) => {
    if (!legalAt(i, m)) issues.push(`illegal mark '${m}' at cell ${i}`);
  });
  for (const change of [...history.past, ...history.future])
    for (const c of change.cells)
      if (!legalAt(c.cell, c.from) || !legalAt(c.cell, c.to)) issues.push(`illegal change at cell ${c.cell}`);
  if (issues.length > 0) return { ok: false, issues };

  // Replay consistency: walk back through `past`, then forward through `future`.
  const marks = [...board.marks];
  for (const change of [...history.past].reverse())
    for (const c of change.cells) {
      if (marks[c.cell] !== c.to) return { ok: false, issues: ['history inconsistent with board (past)'] };
      marks[c.cell] = c.from;
    }
  const fwd = [...board.marks];
  for (const change of history.future)
    for (const c of change.cells) {
      if (fwd[c.cell] !== c.from) return { ok: false, issues: ['history inconsistent with board (future)'] };
      fwd[c.cell] = c.to;
    }
  // Marks were validated by isValidMark above, so narrowing string → CellMark is sound.
  return { ok: true, value: parsed.data as GameState };
}
