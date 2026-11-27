import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATALOG } from '@ww/puzzle-content';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { SAVE_KEY } from '../src/storage/saveData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

async function solveWithHints() {
  for (let i = 0; i < 100 && !screen.queryByTestId('scene-complete'); i++) {
    await fireEvent.press(screen.getByRole('button', { name: /^Hint/ }));
    await fireEvent.press(screen.getByTestId('hint-action-reveal'));
    await fireEvent.press(screen.getByTestId('hint-action-apply'));
  }
  expect(screen.getByTestId('scene-complete')).toBeOnTheScreen();
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      progress: {},
      active: {},
      settings: { reducedMotion: 'system', onboardingDone: true },
    }),
  );
});

describe('milestones are saved immediately', () => {
  it('completion is written on the next tick, not after the 400 ms debounce', async () => {
    const [a] = CATALOG.puzzles;
    if (!a) throw new Error('empty catalog');
    await renderRouter('./src/app', { initialUrl: `/puzzle/${a.id}` });
    await screen.findByTestId('cell-0');
    await solveWithHints();
    // 1 ms later the last move's 400 ms debounce is still pending; only the milestone write can have landed.
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    const saved = JSON.parse((await AsyncStorage.getItem(SAVE_KEY)) ?? '{}');
    expect(saved.progress?.[a.id]?.completedRevision).toBe(a.revision);
  });
});
