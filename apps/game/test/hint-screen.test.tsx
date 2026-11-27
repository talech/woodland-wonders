import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { createPuzzleOrThrow } from '@ww/puzzle-core';
import { FIXTURES } from '@ww/puzzle-core/testing';
import { AccessibilityInfo } from 'react-native';
import { PuzzleScreen } from '../src/features/PuzzleScreen';
import { createSession, sessionReducer } from '../src/game/session';
import { SafeAreaTestProvider } from './helpers';

// tiny-4x4: '..Ft', '.t.t', '.F..', '....' (foxes at cells 2 and 9)
const puzzle = createPuzzleOrThrow(FIXTURES.tiny4x4.definition);

async function renderPuzzle() {
  await render(
    <SafeAreaTestProvider>
      <PuzzleScreen puzzle={puzzle} title="Level 1" onBack={jest.fn()} />
    </SafeAreaTestProvider>,
  );
}

const cell = (i: number) => screen.getByTestId(`cell-${i}`);
const press = (id: string) => fireEvent.press(screen.getByTestId(id));
const panel = () => screen.getByTestId('hint-panel');

/** The hint the reducer would give on a blank board (the screen must show the same one). */
function blankHint() {
  const s = sessionReducer(createSession(puzzle), { type: 'requestHint' });
  if (s.hint?.kind !== 'deduction') throw new Error('expected deduction');
  return s.hint;
}

describe('hints on the puzzle screen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('stage 1 → stage 2 → apply places the right mark and is undoable', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    const expected = blankHint();
    const { cell: target, value } = expected.conclusion;
    await renderPuzzle();

    await fireEvent.press(screen.getByRole('button', { name: /^Hint/ }));
    expect(screen.getByRole('button', { name: /^Hint/ })).toBeSelected();
    expect(within(panel()).getByText(/^Idea: /)).toBeOnTheScreen();
    expect(within(panel()).queryByText(/^So row/)).toBeNull();
    expect(announce).toHaveBeenCalledWith(expect.stringMatching(/^Hint: /));

    // Highlighted cells: outline + acorn icon, and an accessibility hint.
    expect(screen.getByTestId(`cell-${target}-hint`)).toBeOnTheScreen();
    expect(cell(target).props.accessibilityHint).toBe('The cell this hint is about');
    expect(cell(target)).toHaveAccessibleName(/: unmarked$/); // never revealed at stage 1

    await press('hint-action-reveal');
    expect(within(panel()).getByText(/^So row \d, column \d must be/)).toBeOnTheScreen();

    await press('hint-action-apply');
    expect(screen.queryByTestId('hint-panel')).toBeNull();
    expect(cell(target)).toHaveAccessibleName(new RegExp(`: ${value === 'empty' ? 'empty' : 'fox'}$`));
    expect(cell(target).props.accessibilityHint).toBeUndefined();

    await fireEvent.press(screen.getByRole('button', { name: /^Undo/ }));
    expect(cell(target)).toHaveAccessibleName(/: unmarked$/);
  });

  it('a board change clears the hint', async () => {
    await renderPuzzle();
    await press('action-hint');
    expect(panel()).toBeOnTheScreen();
    await fireEvent.press(cell(15));
    expect(screen.queryByTestId('hint-panel')).toBeNull();
    expect(screen.queryByTestId(/^cell-\d+-hint$/)).toBeNull();
  });

  it('the hint can be dismissed at any time (close or the hint button)', async () => {
    await renderPuzzle();
    await press('action-hint');
    await press('hint-dismiss');
    expect(screen.queryByTestId('hint-panel')).toBeNull();
    await press('action-hint');
    await press('hint-action-reveal');
    await press('action-hint');
    expect(screen.queryByTestId('hint-panel')).toBeNull();
    expect(cell(0)).toHaveAccessibleName(/: unmarked$/); // nothing was applied
  });

  it('a wrong-but-legal placement shows the contradiction and "last workable board" restores a consistent board', async () => {
    await renderPuzzle();
    await fireEvent.press(cell(1)); // fox at (0,1): next to a tree, breaks no clue yet
    await press('tool-empty');
    await fireEvent.press(cell(12));
    await press('action-hint');

    expect(within(panel()).getByText('Something doesn’t fit')).toBeOnTheScreen();
    expect(within(panel()).getByText(/can’t be finished from here/)).toBeOnTheScreen();
    expect(within(panel()).getByText('Your last workable board was 2 moves ago.')).toBeOnTheScreen();
    expect(screen.queryAllByTestId(/^cell-\d+-hint$/).length).toBeGreaterThan(0);

    await press('hint-action-rewind');
    // Asks for confirmation before changing anything.
    expect(cell(1)).toHaveAccessibleName(/: fox$/);
    expect(within(panel()).getByText('Go back 2 moves? You can redo them afterwards.')).toBeOnTheScreen();
    await press('hint-action-confirm-rewind');

    expect(screen.queryByTestId('hint-panel')).toBeNull();
    expect(cell(1)).toHaveAccessibleName(/: unmarked$/);
    expect(cell(12)).toHaveAccessibleName(/: unmarked$/);
    expect(screen.getByRole('button', { name: /^Redo/ })).toBeEnabled();

    // The restored board is workable: the next hint is an ordinary deduction.
    await press('action-hint');
    expect(within(panel()).getByText(/^Idea: /)).toBeOnTheScreen();
  });

  it('a rule already broken on the board points at the flagged cells', async () => {
    await renderPuzzle();
    await fireEvent.press(cell(10)); // fox at (2,2): clues fine, but no tree next to it
    await press('action-hint');
    expect(
      within(panel()).getByText('The fox at row 3, column 3 has no tree directly beside it.'),
    ).toBeOnTheScreen();
    expect(within(panel()).getByText(/! badge/)).toBeOnTheScreen();
    await press('hint-action-rewind');
    await press('hint-action-cancel-rewind');
    expect(cell(10)).toHaveAccessibleName('Row 3, column 3: fox, needs a tree directly beside it');
  });

  it('following hints from blank solves the puzzle', async () => {
    await renderPuzzle();
    for (let i = 0; i < puzzle.cellCount && !screen.queryByTestId('scene-complete'); i++) {
      await press('action-hint');
      await press('hint-action-reveal');
      await press('hint-action-apply');
    }
    expect(screen.getByTestId('scene-complete')).toBeOnTheScreen();
    await press('action-hint');
    expect(within(panel()).getByText('All done!')).toBeOnTheScreen();
  });

  it('keeps stable label prefixes used by end-to-end tests', async () => {
    await renderPuzzle();
    await press('action-hint');
    expect(screen.getAllByLabelText(/^Undo/)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^Hint/)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^Mark empty/)).toHaveLength(1);
    expect(screen.getAllByLabelText(/^Fox, /)).toHaveLength(1);
  });
});
