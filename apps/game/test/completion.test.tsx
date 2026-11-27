import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import type { GameState } from '@ww/puzzle-core';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import { Animated } from 'react-native';
import { PuzzleScreen } from '../src/features/PuzzleScreen';
import { findLevel } from '../src/game/levels';
import { createSession, type Session, sessionReducer } from '../src/game/session';
import { SAVE_KEY, toActiveEntry } from '../src/storage/saveData';
import { SafeAreaTestProvider } from './helpers';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const level = findLevel('tutorial-01');
if (!level) throw new Error('tutorial-01 missing');
const { puzzle } = level;

/** A solved game reached by following hints (core/solver only; no answer key). */
function solvedGame(): GameState {
  let s: Session = createSession(puzzle);
  for (let i = 0; i < puzzle.cellCount; i++) {
    s = sessionReducer(s, { type: 'requestHint' });
    if (s.hint?.kind !== 'deduction') break;
    s = sessionReducer(sessionReducer(s, { type: 'revealHint' }), { type: 'applyHint' });
  }
  return s.game;
}

/** Same board minus its last move: one tap away from solved. */
function almostSolved(): { game: GameState; lastCell: number } {
  const game = solvedGame();
  const undone = sessionReducer({ ...createSession(puzzle, game) }, { type: 'undo' });
  const last = game.history.past.at(-1)?.cells[0];
  if (!last) throw new Error('no moves');
  return { game: undone.game, lastCell: last.cell };
}

async function renderScreen(game: GameState, reducedMotionSetting: 'on' | 'off', onSolved = jest.fn()) {
  await render(
    <SafeAreaTestProvider>
      <PuzzleScreen
        puzzle={puzzle}
        title="Level 1"
        onBack={jest.fn()}
        onNext={jest.fn()}
        initialGame={game}
        onSolved={onSolved}
        reducedMotionSetting={reducedMotionSetting}
      />
    </SafeAreaTestProvider>,
  );
  return onSolved;
}

afterEach(() => jest.restoreAllMocks());

describe('completion scene', () => {
  it('turns the board into a scene with hopping animals and next/back/replay', async () => {
    const loop = jest.spyOn(Animated, 'loop');
    const { game, lastCell } = almostSolved();
    const last = game.board.marks[lastCell];
    const onSolved = await renderScreen(game, 'off');
    expect(screen.queryByTestId('board-scene')).toBeNull();
    expect(loop).not.toHaveBeenCalled();

    // Finish with the empty tool or the species the last hint concluded.
    const solved = solvedGame().board.marks[lastCell];
    if (solved === 'empty') await fireEvent.press(screen.getByTestId('tool-empty'));
    await fireEvent.press(screen.getByTestId(`cell-${lastCell}`));
    expect(last).toBe('unmarked');

    expect(screen.getByTestId('board-scene')).toBeOnTheScreen();
    expect(screen.getByText('Scene complete!')).toBeOnTheScreen();
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(loop).toHaveBeenCalled(); // animals idle-hop
    const panel = screen.getByTestId('scene-complete');
    for (const name of ['Next puzzle', 'Back to levels', 'Play again'])
      expect(within(panel).getByRole('button', { name })).toBeOnTheScreen();
    // Cells and controls remain usable: the scene never locks the board.
    expect(screen.getByRole('button', { name: /^Undo/ })).toBeEnabled();
  });

  it('reduced motion: no movement, the scene still appears', async () => {
    const loop = jest.spyOn(Animated, 'loop');
    await renderScreen(solvedGame(), 'on');
    expect(screen.getByTestId('board-scene')).toBeOnTheScreen();
    expect(screen.getByText('Scene complete!')).toBeOnTheScreen();
    expect(loop).not.toHaveBeenCalled();
  });

  it('"Play again" clears the board as an undoable move', async () => {
    await renderScreen(solvedGame(), 'on');
    await fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.queryByTestId('scene-complete')).toBeNull();
    expect(screen.queryByTestId('board-scene')).toBeNull();
    expect(screen.getAllByLabelText(/: unmarked$/).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole('button', { name: /^Undo/ }));
    expect(screen.getByTestId('scene-complete')).toBeOnTheScreen();
  });

  it('a completed puzzle opened from the level list shows its scene', async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        progress: {
          [level.id]: {
            completedRevision: level.definition.revision,
            completedAt: '2026-11-26T10:00:00.000Z',
          },
        },
        active: { [level.id]: toActiveEntry(solvedGame()) },
        settings: { reducedMotion: 'on', onboardingDone: true },
      }),
    );
    await renderRouter('./src/app', { initialUrl: '/' });
    const card = await routerScreen.findByTestId(`level-${level.id}`);
    expect(card).toHaveAccessibleName(/^Level 1, tutorial, completed, /);
    await fireEvent.press(card);
    expect(await routerScreen.findByTestId('board-scene')).toBeOnTheScreen();
    expect(routerScreen.getByRole('button', { name: 'Play again' })).toBeOnTheScreen();
  });
});
