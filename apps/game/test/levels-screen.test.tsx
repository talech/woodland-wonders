import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { CATALOG } from '@ww/puzzle-content';
import { LevelList } from '../src/features/LevelList';
import { tierText } from '../src/game/labels';
import { LEVELS, type LevelStatus } from '../src/game/levels';
import { SafeAreaTestProvider } from './helpers';

async function renderList(
  statuses: Record<string, LevelStatus>,
  suggestedId: string | null,
  onOpen = jest.fn(),
) {
  await render(
    <SafeAreaTestProvider>
      <LevelList levels={LEVELS} statuses={statuses} suggestedId={suggestedId} onOpen={onOpen} />
    </SafeAreaTestProvider>,
  );
  return onOpen;
}

describe('LevelList', () => {
  it('renders every catalog puzzle, grouped by tier, with spoken status', async () => {
    const [a, b, c] = LEVELS;
    if (!a || !b || !c) throw new Error('catalog too small');
    await renderList({ [a.id]: 'completed', [b.id]: 'in-progress' }, c.id);
    expect(CATALOG.puzzles.length).toBe(LEVELS.length);
    for (const [i, def] of CATALOG.puzzles.entries()) {
      const item = screen.getByTestId(`level-${def.id}`);
      // Raw content ids are never shown or spoken.
      expect(item.props.accessibilityLabel).not.toContain(def.id);
      expect(within(item).queryByText(new RegExp(def.id))).toBeNull();
      expect(within(item).getByText(`${def.rows}×${def.columns}`)).toBeOnTheScreen();
      expect(item).toHaveAccessibleName(
        new RegExp(`^Level ${i + 1}, ${def.difficulty?.tier ?? 'unrated'}, .*${def.rows} by ${def.columns}`),
      );
    }
    expect(screen.getByTestId(`level-${a.id}`)).toHaveAccessibleName(/^Level 1, tutorial, completed, /);
    expect(screen.getByTestId(`level-${b.id}`)).toHaveAccessibleName(/^Level 2, tutorial, in progress, /);
    expect(screen.getByTestId(`level-${c.id}`)).toHaveAccessibleName(/, not started, .*, next up$/);
    expect(within(screen.getByTestId(`level-${a.id}`)).getByText('Completed')).toBeOnTheScreen();
    expect(within(screen.getByTestId(`level-${c.id}`)).getByText('Next up')).toBeOnTheScreen();
    const tiers = [...new Set(CATALOG.puzzles.map((d) => d.difficulty?.tier))];
    for (const t of tiers) expect(screen.getByRole('header', { name: tierText(t) })).toBeOnTheScreen();
  });

  it('offers Continue to the suggested level, without locking any other', async () => {
    const third = LEVELS[2];
    const last = LEVELS.at(-1);
    if (!third || !last) throw new Error('catalog too small');
    const onOpen = await renderList({}, third.id);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue: Level 3' }));
    expect(onOpen).toHaveBeenLastCalledWith(third.id);
    await fireEvent.press(screen.getByTestId(`level-${last.id}`));
    expect(onOpen).toHaveBeenLastCalledWith(last.id);
  });

  it('celebrates when everything is complete', async () => {
    const all = Object.fromEntries(LEVELS.map((l) => [l.id, 'completed' as const]));
    await renderList(all, null);
    expect(screen.getByTestId('all-complete')).toBeOnTheScreen();
    expect(screen.queryByTestId('continue')).toBeNull();
  });
});
