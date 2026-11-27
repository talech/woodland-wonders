import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATALOG } from '@ww/puzzle-content';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { SAVE_KEY } from '../src/storage/saveData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const first = CATALOG.puzzles[0];
if (!first) throw new Error('empty catalog');

/** Returning player: onboarding already done (onboarding flows are covered in onboarding.test.tsx). */
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

describe('routes', () => {
  it('opens a puzzle from the level list', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await fireEvent.press(await screen.findByTestId(`level-${first.id}`));
    expect(r.getPathname()).toBe(`/puzzle/${first.id}`);
    expect(await screen.findByRole('header', { name: 'Level 1' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('header-back'));
    expect(r.getPathname()).toBe('/');
  });

  it('shows a gentle fallback for an unknown puzzle id', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/puzzle/no-such-puzzle' });
    expect(screen.getByText('This clearing is hidden')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('not-found-back'));
    expect(r.getPathname()).toBe('/');
  });
});

describe('persistence flow', () => {
  it('play → leave → return restores the board and undo history, and writes the save', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    await fireEvent.press(await screen.findByTestId(`level-${first.id}`));
    await fireEvent.press(await screen.findByTestId('cell-0'));
    expect(screen.getByTestId('cell-0')).toHaveAccessibleName(/: fox/);
    await fireEvent.press(screen.getByTestId('header-back'));

    await fireEvent.press(await screen.findByTestId(`level-${first.id}`));
    expect(await screen.findByTestId('cell-0')).toHaveAccessibleName(/: fox/);
    expect(screen.getByRole('button', { name: /^Undo/ })).toBeEnabled();
    await fireEvent.press(screen.getByRole('button', { name: /^Undo/ }));
    expect(screen.getByTestId('cell-0')).toHaveAccessibleName(/: unmarked$/);

    await waitFor(
      async () => {
        const raw = await AsyncStorage.getItem(SAVE_KEY);
        expect(raw).not.toBeNull();
        expect(JSON.parse(raw ?? '{}').active[first.id].history.future).toHaveLength(1);
      },
      { timeout: 3000 },
    );
  });

  it('restores a board saved in an earlier session', async () => {
    const marks = new Array(first.rows * first.columns).fill('unmarked');
    marks[0] = 'empty';
    const change = { cells: [{ cell: 0, from: 'unmarked', to: 'empty' }] };
    await AsyncStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        progress: {},
        active: { [first.id]: { revision: first.revision, marks, history: { past: [change], future: [] } } },
        settings: { reducedMotion: 'system', onboardingDone: true },
      }),
    );
    await renderRouter('./src/app', { initialUrl: `/puzzle/${first.id}` });
    expect(await screen.findByTestId('cell-0')).toHaveAccessibleName(/: empty$/);
    expect(screen.getByRole('button', { name: /^Undo/ })).toBeEnabled();
  });
});

/** Solve the open puzzle by following hints (Hint → Show me → Apply) until the scene appears. */
async function solveWithHints() {
  for (let i = 0; i < 100 && !screen.queryByTestId('scene-complete'); i++) {
    await fireEvent.press(screen.getByRole('button', { name: /^Hint/ }));
    await fireEvent.press(screen.getByTestId('hint-action-reveal'));
    await fireEvent.press(screen.getByTestId('hint-action-apply'));
  }
  expect(screen.getByTestId('scene-complete')).toBeOnTheScreen();
}

describe('progression flow', () => {
  const [a, b, c] = CATALOG.puzzles;
  if (!a || !b || !c) throw new Error('catalog too small');

  it('complete → the list shows it completed and suggests the next one', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await fireEvent.press(await screen.findByTestId(`level-${a.id}`));
    await screen.findByTestId('cell-0');
    await solveWithHints();
    await fireEvent.press(screen.getByTestId('header-back'));
    expect(r.getPathname()).toBe('/');
    expect(await screen.findByTestId(`level-${a.id}`)).toHaveAccessibleName(
      /^Level 1, tutorial, completed, /,
    );
    expect(screen.getByTestId(`level-${b.id}`)).toHaveAccessibleName(/next up$/);
    await waitFor(
      async () => {
        const saved = JSON.parse((await AsyncStorage.getItem(SAVE_KEY)) ?? '{}');
        expect(saved.progress[a.id].completedRevision).toBe(a.revision);
        expect(Number.isNaN(Date.parse(saved.progress[a.id].completedAt))).toBe(false);
      },
      { timeout: 3000 },
    );
  });

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
