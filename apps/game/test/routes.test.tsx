import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATALOG } from '@ww/puzzle-content';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { SAVE_KEY } from '../src/storage/saveData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const first = CATALOG.puzzles[0];
if (!first) throw new Error('empty catalog');

beforeEach(async () => {
  await AsyncStorage.clear();
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
