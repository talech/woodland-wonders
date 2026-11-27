import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { SAVE_KEY } from '../src/storage/saveData';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

const savedSettings = async () => JSON.parse((await AsyncStorage.getItem(SAVE_KEY)) ?? '{}').settings;
const coachTitle = () => within(screen.getByTestId('coach-card')).getByRole('header');

describe('onboarding', () => {
  it('first launch from the level list starts the tutorial; skipping persists onboardingDone', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    expect(await screen.findByTestId('coach-card')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/puzzle/tutorial-01');
    expect(coachTitle()).toHaveTextContent('Welcome to Woodland Wonders!');

    await fireEvent.press(screen.getByRole('button', { name: 'Skip tutorial' }));
    expect(screen.queryByTestId('coach-card')).toBeNull();
    await waitFor(async () => expect((await savedSettings())?.onboardingDone).toBe(true), { timeout: 3000 });

    await fireEvent.press(screen.getByTestId('header-back'));
    expect(r.getPathname()).toBe('/');
    expect(await screen.findByTestId('how-to-play')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/'); // not restarted
  });

  it('runs through every step on real actions and records completion', async () => {
    await renderRouter('./src/app', { initialUrl: '/' });
    await screen.findByTestId('coach-card');
    const step = (n: number) => expect(screen.getByText(`Step ${n} of 6`)).toBeOnTheScreen();
    step(1);
    await fireEvent.press(screen.getByTestId('cell-0'));
    step(2);
    expect(coachTitle()).toHaveTextContent('Foxes live by trees');
    await fireEvent.press(screen.getByTestId('cell-2')); // (0,2) beside the tree at (0,3)
    step(3);
    await fireEvent.press(screen.getByRole('radio', { name: /^Mark empty/ }));
    step(4);
    await fireEvent.press(screen.getByTestId('cell-6'));
    step(5);
    await fireEvent.press(screen.getByRole('button', { name: /^Undo/ }));
    step(6);
    await fireEvent.press(screen.getByRole('button', { name: /^Hint/ }));
    expect(coachTitle()).toHaveTextContent('You’re ready!');
    await waitFor(async () => expect((await savedSettings())?.onboardingDone).toBe(true), { timeout: 3000 });
    await fireEvent.press(screen.getByRole('button', { name: 'Start playing' }));
    expect(screen.queryByTestId('coach-card')).toBeNull();
  });

  it('visiting a puzzle URL directly never forces the tutorial', async () => {
    await renderRouter('./src/app', { initialUrl: '/puzzle/tutorial-01' });
    expect(await screen.findByTestId('cell-0')).toBeOnTheScreen();
    expect(screen.queryByTestId('coach-card')).toBeNull();
  });

  it('can be re-opened from "How to play"', async () => {
    await AsyncStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        progress: {},
        active: {},
        settings: { reducedMotion: 'system', onboardingDone: true },
      }),
    );
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await fireEvent.press(await screen.findByRole('button', { name: 'How to play' }));
    expect(r.getPathname()).toBe('/how-to-play');
    for (let i = 1; i <= 5; i++) expect(screen.getByLabelText(new RegExp(`^Rule ${i}: `))).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Play the tutorial' }));
    expect(await screen.findByTestId('coach-card')).toBeOnTheScreen();
    expect(r.getPathname()).toBe('/puzzle/tutorial-01');
  });

  it('introduces a new species the first time its puzzle is opened', async () => {
    await renderRouter('./src/app', { initialUrl: '/puzzle/tutorial-03' });
    const intro = await screen.findByTestId('species-intro');
    expect(
      within(intro).getByText('New friend: mice live directly beside a mushroom (up, down, left or right).'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByTestId('species-intro')).toBeNull();
  });

  it('does not repeat the intro once the puzzle has been played', async () => {
    const marks = new Array(16).fill('unmarked');
    marks[0] = 'empty';
    await AsyncStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        progress: {},
        active: {
          'tutorial-04': {
            revision: 1,
            marks,
            history: { past: [{ cells: [{ cell: 0, from: 'unmarked', to: 'empty' }] }], future: [] },
          },
        },
        settings: { reducedMotion: 'system', onboardingDone: true },
      }),
    );
    await renderRouter('./src/app', { initialUrl: '/puzzle/tutorial-04' });
    expect(await screen.findByTestId('cell-1')).toBeOnTheScreen();
    expect(screen.queryByTestId('species-intro')).toBeNull();
  });
});
