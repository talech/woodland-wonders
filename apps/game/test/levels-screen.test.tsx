import { fireEvent, render, screen } from '@testing-library/react-native';
import { CATALOG } from '@ww/puzzle-content';
import { renderRouter, screen as routerScreen } from 'expo-router/testing-library';
import { LevelList } from '../src/features/LevelList';
import { LEVELS } from '../src/game/levels';
import { SafeAreaTestProvider } from './helpers';

describe('LevelList', () => {
  it('renders every catalog puzzle with id, size and tier', async () => {
    const onOpen = jest.fn();
    await render(
      <SafeAreaTestProvider>
        <LevelList levels={LEVELS} onOpen={onOpen} />
      </SafeAreaTestProvider>,
    );
    expect(CATALOG.puzzles.length).toBeGreaterThan(0);
    for (const [i, def] of CATALOG.puzzles.entries()) {
      const item = screen.getByTestId(`level-${def.id}`);
      expect(item).toHaveAccessibleName(
        new RegExp(`^Level ${i + 1}, ${def.id}, ${def.rows} by ${def.columns}, `, 'i'),
      );
      expect(screen.getByText(new RegExp(def.id))).toBeOnTheScreen();
    }
    const first = CATALOG.puzzles[0];
    if (!first) throw new Error('empty catalog');
    await fireEvent.press(screen.getByTestId(`level-${first.id}`));
    expect(onOpen).toHaveBeenCalledWith(first.id);
  });
});

describe('routes', () => {
  const first = CATALOG.puzzles[0];
  if (!first) throw new Error('empty catalog');

  it('opens a puzzle from the level list', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/' });
    await fireEvent.press(routerScreen.getByTestId(`level-${first.id}`));
    expect(r.getPathname()).toBe(`/puzzle/${first.id}`);
    expect(routerScreen.getByRole('header', { name: 'Level 1' })).toBeOnTheScreen();
    await fireEvent.press(routerScreen.getByTestId('header-back'));
    expect(r.getPathname()).toBe('/');
  });

  it('shows a gentle fallback for an unknown puzzle id', async () => {
    const r = await renderRouter('./src/app', { initialUrl: '/puzzle/no-such-puzzle' });
    expect(routerScreen.getByText('This clearing is hidden')).toBeOnTheScreen();
    await fireEvent.press(routerScreen.getByTestId('not-found-back'));
    expect(r.getPathname()).toBe('/');
  });
});
