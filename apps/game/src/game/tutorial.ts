/**
 * Interactive tutorial (first launch, tutorial-01). Each step advances only on a real player action, judged
 * from session state via core evaluation (never a timer, never an answer key).
 */
import { evaluateBoard, isAnimal } from '@ww/puzzle-core';
import { type Session, type SessionAction, sessionReducer } from './session.ts';

export const TUTORIAL_PUZZLE_ID = 'tutorial-01';
export const TUTORIAL_HREF = `/puzzle/${TUTORIAL_PUZZLE_ID}?tutorial=1`;

export type TutorialStep = 'clues' | 'habitat' | 'touching' | 'mark-empty' | 'undo' | 'hint' | 'done';

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  'clues',
  'habitat',
  'touching',
  'mark-empty',
  'undo',
  'hint',
  'done',
];

export const TUTORIAL_TEXT: Readonly<
  Record<TutorialStep, { readonly title: string; readonly body: string }>
> = {
  clues: {
    title: 'Welcome to Woodland Wonders!',
    body: 'The numbers count the animals in each row and column. Tap a cell in a row that needs a fox to place one.',
  },
  habitat: {
    title: 'Foxes live by trees',
    body: 'A fox must sit directly beside a tree: up, down, left or right, never diagonally. Place a fox beside a tree.',
  },
  touching: {
    title: 'Foxes never touch',
    body: 'Two foxes can’t be neighbours, not even corner to corner. Pick “Mark empty” to rule out cells.',
  },
  'mark-empty': {
    title: 'Mark what can’t be',
    body: 'Tap a cell that can’t hold a fox, such as one touching your fox, to mark it empty.',
  },
  undo: {
    title: 'Change your mind any time',
    body: 'Nothing is ever locked in. Tap Undo to take back your last move.',
  },
  hint: {
    title: 'Ask for a hint',
    body: 'Stuck? Tap Hint. It points you to the next step and can explain why.',
  },
  done: {
    title: 'You’re ready!',
    body: 'Finish this puzzle your way. Hints are always there, with no penalty.',
  },
};

export interface ScreenState {
  readonly session: Session;
  /** Current tutorial step, or null when not in tutorial mode (or it was closed). */
  readonly tutorial: TutorialStep | null;
}

export type ScreenAction = SessionAction | { readonly type: 'closeTutorial' };

export function createScreenState(session: Session, tutorial: boolean): ScreenState {
  return { session, tutorial: tutorial ? 'clues' : null };
}

function placedAnimalAt(after: Session, action: SessionAction): number | null {
  if (action.type !== 'tapCell') return null;
  const mark = after.game.board.marks[action.cell];
  return mark !== undefined && isAnimal(mark) ? action.cell : null;
}

/** Pure step transition for one action. */
export function advanceTutorial(
  step: TutorialStep,
  action: SessionAction,
  before: Session,
  after: Session,
): TutorialStep {
  const next = (): TutorialStep => TUTORIAL_STEPS[TUTORIAL_STEPS.indexOf(step) + 1] ?? 'done';
  const changed = before.game !== after.game;
  switch (step) {
    case 'clues':
      return placedAnimalAt(after, action) !== null ? next() : step;
    case 'habitat': {
      const cell = placedAnimalAt(after, action);
      if (cell === null) return step;
      const homeless = evaluateBoard(after.puzzle, after.game.board.marks).violations.some(
        (v) => v.kind === 'missing-habitat' && v.cells.includes(cell),
      );
      return homeless ? step : next();
    }
    case 'touching':
      return action.type === 'selectEmpty' || after.tool.kind === 'empty' ? next() : step;
    case 'mark-empty':
      return action.type === 'tapCell' && after.game.board.marks[action.cell] === 'empty' ? next() : step;
    case 'undo':
      return action.type === 'undo' && changed ? next() : step;
    case 'hint':
      return action.type === 'requestHint' ? next() : step;
    case 'done':
      return step;
  }
}

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  if (action.type === 'closeTutorial') return state.tutorial === null ? state : { ...state, tutorial: null };
  const session = sessionReducer(state.session, action);
  const tutorial =
    state.tutorial === null ? null : advanceTutorial(state.tutorial, action, state.session, session);
  return session === state.session && tutorial === state.tutorial ? state : { session, tutorial };
}
