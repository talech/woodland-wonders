import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATALOG } from '@ww/puzzle-content';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
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

describe('next puzzle', () => {
  const [a, b, c] = CATALOG.puzzles;
  if (!a || !b || !c) throw new Error('catalog too small');

  it('"Next puzzle" goes to the next unsolved puzzle', async () => {
    await AsyncStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        progress: { [b.id]: { completedRevision: b.revision, completedAt: '2026-11-26T10:00:00.000Z' } },
        active: {},
        settings: { reducedMotion: 'system', onboardingDone: true },
      }),
    );
    const r = await renderRouter('./src/app', { initialUrl: `/puzzle/${a.id}` });
    await screen.findByTestId('cell-0');
    await solveWithHints();
    await fireEvent.press(screen.getByRole('button', { name: 'Next puzzle' }));
    expect(r.getPathname()).toBe(`/puzzle/${c.id}`);
  });
});
