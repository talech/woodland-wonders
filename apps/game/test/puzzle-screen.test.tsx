import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { type CellMark, createPuzzleOrThrow, type Puzzle } from '@ww/puzzle-core';
import { FIXTURES, type Fixture } from '@ww/puzzle-core/testing';
import { PuzzleScreen } from '../src/features/PuzzleScreen';
import { SafeAreaTestProvider } from './helpers';

// pair-5x5 solution: '.....', '...M.', '.m.mt', 'Mm.tF', '.m...'  (fox 1, mouse 2)
const fixture = FIXTURES.pair5x5;
const puzzle = createPuzzleOrThrow(fixture.definition);

async function renderPuzzle(p: Puzzle = puzzle, handlers: { onBack?: () => void; onNext?: () => void } = {}) {
  const onBack = handlers.onBack ?? jest.fn();
  await render(
    <SafeAreaTestProvider>
      <PuzzleScreen
        puzzle={p}
        title="Level 2"
        subtitle="5×5 · Beginner"
        onBack={onBack}
        {...(handlers.onNext ? { onNext: handlers.onNext } : {})}
      />
    </SafeAreaTestProvider>,
  );
}

function solutionOf(f: Fixture): readonly CellMark[] {
  if (!f.solution) throw new Error(`fixture ${f.name} has no solution`);
  return f.solution;
}

const cell = (i: number) => screen.getByTestId(`cell-${i}`);
const tap = (i: number) => fireEvent.press(cell(i));
const selectTool = (id: string) => fireEvent.press(screen.getByTestId(`tool-${id}`));

describe('PuzzleScreen', () => {
  it('renders the header, tray, clues, board and toolbar', async () => {
    await renderPuzzle();
    expect(screen.getByRole('header', { name: 'Level 2' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Back to levels' })).toBeOnTheScreen();
    expect(screen.getByTestId('tool-fox')).toBeSelected();
    expect(screen.getByTestId('tool-mouse')).not.toBeSelected();
    expect(screen.getByText('Lives next to a mushroom')).toBeOnTheScreen();
    expect(screen.getAllByTestId(/^cell-\d+$/)).toHaveLength(25);
    expect(screen.getByTestId('action-undo')).toBeDisabled();
    expect(screen.getByTestId('action-redo')).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Hint/ })).toBeEnabled();
    expect(screen.queryByTestId('hint-panel')).toBeNull();
    expect(screen.queryByTestId('scene-complete')).toBeNull();
  });

  it('keeps the toolbar in a fixed bar outside the scrolling region', async () => {
    await renderPuzzle();
    const scroll = screen.getByTestId('puzzle-scroll');
    const bar = screen.getByTestId('puzzle-toolbar');
    for (const id of ['action-undo', 'action-redo', 'tool-empty']) {
      expect(within(scroll).queryByTestId(id)).toBeNull();
      expect(within(bar).getByTestId(id)).toBeOnTheScreen();
    }
    expect(within(scroll).getByTestId('board')).toBeOnTheScreen();
    expect(within(bar).getByRole('button', { name: /^Undo/ })).toBeOnTheScreen();
  });

  it('sizes the board from the measured space above the toolbar', async () => {
    await renderPuzzle();
    const layout = (height: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width: 360, height } } });
    await fireEvent(screen.getByTestId('puzzle-chrome'), 'layout', layout(150));
    await fireEvent(screen.getByTestId('puzzle-scroll'), 'layout', layout(520));
    // 520 − 150 − 32 padding = 338 → 5 rows × cell + clue(0.7·cell) ≤ 338 → cell 59.
    expect(cell(0)).toHaveStyle({ width: 59, height: 59 });
    await fireEvent(screen.getByTestId('puzzle-scroll'), 'layout', layout(380));
    // 198 → cell 34.
    expect(cell(0)).toHaveStyle({ width: 34, height: 34 });
    await fireEvent(screen.getByTestId('puzzle-scroll'), 'layout', layout(200));
    // Too short: never below 32 pt; the region scrolls instead.
    expect(cell(0)).toHaveStyle({ width: 32, height: 32 });
  });

  it('labels cells with a role, label and selected state', async () => {
    await renderPuzzle();
    expect(cell(0)).toHaveAccessibleName('Row 1, column 1: unmarked');
    expect(cell(14)).toHaveAccessibleName('Row 3, column 5: tree (habitat)');
    expect(cell(14)).toBeDisabled();
    await tap(19);
    const fox = screen.getByRole('button', { name: 'Row 4, column 5: fox' });
    expect(fox).toBeSelected();
    expect(cell(0)).not.toBeSelected();
  });

  it('labels clues with progress', async () => {
    await renderPuzzle();
    // Row 2 (index 1) needs one animal.
    expect(screen.getByTestId('clue-row-1')).toHaveAccessibleName('Row 2: 0 of 1 animal');
    await selectTool('mouse');
    await tap(8);
    expect(screen.getByTestId('clue-row-1')).toHaveAccessibleName('Row 2: 1 of 1 animal, complete');
    expect(screen.getByLabelText('Column 4: 1 of 1 animal, complete')).toBeOnTheScreen();
  });

  it('placing an animal updates its count', async () => {
    await renderPuzzle();
    expect(screen.getByTestId('tool-mouse')).toHaveAccessibleName(/^Mouse, 0 of 2 placed/);
    await selectTool('mouse');
    expect(screen.getByTestId('tool-mouse')).toBeSelected();
    await tap(8);
    expect(screen.getByTestId('tool-mouse')).toHaveAccessibleName(/^Mouse, 1 of 2 placed/);
    expect(screen.getByText('1/2')).toBeOnTheScreen();
    expect(cell(8)).toHaveAccessibleName('Row 2, column 4: mouse');
  });

  it('tapping the same species again clears the cell', async () => {
    await renderPuzzle();
    await tap(19);
    expect(cell(19)).toHaveAccessibleName('Row 4, column 5: fox');
    await tap(19);
    expect(cell(19)).toHaveAccessibleName('Row 4, column 5: unmarked');
  });

  it('same species touching shows a violation but the tap is still allowed', async () => {
    await renderPuzzle();
    await selectTool('mouse');
    await tap(8);
    await tap(12); // diagonal to 8, both next to a mushroom
    expect(cell(12)).toHaveAccessibleName('Row 3, column 3: mouse, touching another mouse');
    expect(cell(8)).toHaveAccessibleName('Row 2, column 4: mouse, touching another mouse');
    expect(screen.getByTestId('tool-mouse')).toHaveAccessibleName(/^Mouse, 2 of 2 placed, complete/);
    expect(screen.queryByTestId('scene-complete')).toBeNull();
  });

  it('marks an over-full row clue', async () => {
    await renderPuzzle();
    await tap(5);
    await tap(7); // row 2 needs 1
    expect(screen.getByTestId('clue-row-1')).toHaveAccessibleName('Row 2: 2 of 1 animal, too many');
  });

  it('the empty tool toggles empty and unmarked', async () => {
    await renderPuzzle();
    await fireEvent.press(screen.getByTestId('tool-empty'));
    expect(screen.getByTestId('tool-empty')).toBeSelected();
    expect(screen.getByTestId('tool-fox')).not.toBeSelected();
    await tap(0);
    expect(cell(0)).toHaveAccessibleName('Row 1, column 1: empty');
    await tap(0);
    expect(cell(0)).toHaveAccessibleName('Row 1, column 1: unmarked');
  });

  it('habitat cells ignore taps', async () => {
    await renderPuzzle();
    await tap(14);
    expect(cell(14)).toHaveAccessibleName('Row 3, column 5: tree (habitat)');
    expect(screen.getByTestId('action-undo')).toBeDisabled();
  });

  it('undo and redo restore the board', async () => {
    await renderPuzzle();
    await tap(19);
    await selectTool('mouse');
    await tap(8);
    await fireEvent.press(screen.getByTestId('action-undo'));
    expect(cell(8)).toHaveAccessibleName('Row 2, column 4: unmarked');
    expect(cell(19)).toHaveAccessibleName('Row 4, column 5: fox');
    expect(screen.getByTestId('action-redo')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('action-undo'));
    expect(cell(19)).toHaveAccessibleName('Row 4, column 5: unmarked');
    expect(screen.getByTestId('action-undo')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('action-redo'));
    await fireEvent.press(screen.getByTestId('action-redo'));
    expect(cell(19)).toHaveAccessibleName('Row 4, column 5: fox');
    expect(cell(8)).toHaveAccessibleName('Row 2, column 4: mouse');
    expect(screen.getByTestId('action-redo')).toBeDisabled();
  });

  it('playing the full fixture solution shows the completion state', async () => {
    const onNext = jest.fn();
    const onBack = jest.fn();
    await renderPuzzle(puzzle, { onNext, onBack });
    const solution = solutionOf(fixture);
    for (const species of puzzle.species) {
      await selectTool(species);
      for (const [i, mark] of solution.entries()) if (mark === species) await tap(i);
    }
    expect(screen.getByTestId('scene-complete')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Scene complete!' })).toBeOnTheScreen();
    expect(within(screen.getByTestId('puzzle-toolbar')).getByTestId('action-undo')).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Next puzzle' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByTestId('complete-back'));
    expect(onBack).toHaveBeenCalledTimes(1);

    // Completion never locks the board: undo returns to play.
    await fireEvent.press(screen.getByTestId('action-undo'));
    expect(screen.queryByTestId('scene-complete')).toBeNull();
  });

  it('omits "Next puzzle" when there is none', async () => {
    const tiny = FIXTURES.tiny4x4;
    const p = createPuzzleOrThrow(tiny.definition);
    await renderPuzzle(p);
    for (const [i, mark] of solutionOf(tiny).entries()) if (mark === 'fox') await tap(i);
    expect(screen.getByTestId('scene-complete')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Next puzzle' })).toBeNull();
    expect(screen.getByTestId('complete-back')).toBeOnTheScreen();
  });
});
