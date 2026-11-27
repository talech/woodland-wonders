import { fireEvent, render, screen } from '@testing-library/react-native';
import type { GameState } from '@ww/puzzle-core';
import { Pressable, StyleSheet, Text } from 'react-native';
import { HowToPlay } from '../src/features/HowToPlay';
import { LevelList } from '../src/features/LevelList';
import { LevelListExtras } from '../src/features/LevelListExtras';
import { NotFound } from '../src/features/NotFound';
import { PuzzleScreen } from '../src/features/PuzzleScreen';
import { findLevel, LEVELS } from '../src/game/levels';
import { createSession, type Session, sessionReducer } from '../src/game/session';
import { SafeAreaTestProvider } from './helpers';

/** Minimum touch target outside the board (board cells are ≥ 32 pt by design, see layout.ts). */
const MIN_TARGET = 44;

interface Problem {
  readonly id: string;
  readonly issue: string;
}

/**
 * Every pressable host element must expose a role and a label, and (outside the board) a ≥ 44 pt target
 * counting hitSlop.
 */
function audit(): Problem[] {
  const problems: Problem[] = [];
  const pressables = screen.container.queryAll(
    (n) =>
      typeof n.type === 'string' &&
      (typeof n.props.onClick === 'function' || typeof n.props.onResponderRelease === 'function'),
  );
  expect(pressables.length).toBeGreaterThan(0);
  for (const n of pressables) {
    const id = String(n.props.testID ?? n.props.accessibilityLabel ?? '?');
    if (!n.props.accessibilityRole && !n.props.role) problems.push({ id, issue: 'no role' });
    if (!n.props.accessibilityLabel) problems.push({ id, issue: 'no label' });
    if (/^cell-\d+$/.test(id)) continue;
    const style = StyleSheet.flatten(n.props.style) ?? {};
    const slop = typeof n.props.hitSlop === 'number' ? n.props.hitSlop * 2 : 0;
    const h = Number(style.height ?? style.minHeight ?? Number.NaN);
    if (!Number.isNaN(h) && h + slop < MIN_TARGET) problems.push({ id, issue: `height ${h}` });
    if (Number.isNaN(h)) problems.push({ id, issue: 'no fixed or minimum height' });
  }
  return problems;
}

const tutorial = findLevel('tutorial-01');
const mice = findLevel('tutorial-03');
if (!tutorial || !mice) throw new Error('catalog changed');

function solved(): GameState {
  let s: Session = createSession(tutorial?.puzzle ?? LEVELS[0]?.puzzle ?? (undefined as never));
  for (let i = 0; i < 20; i++) {
    s = sessionReducer(s, { type: 'requestHint' });
    if (s.hint?.kind !== 'deduction') break;
    s = sessionReducer(sessionReducer(s, { type: 'revealHint' }), { type: 'applyHint' });
  }
  return s.game;
}

const wrap = (ui: React.ReactElement) => render(<SafeAreaTestProvider>{ui}</SafeAreaTestProvider>);

describe('accessibility audit of every screen', () => {
  it('the auditor catches unlabeled, role-less and tiny targets', async () => {
    await render(
      <Pressable testID="bad" onPress={jest.fn()} style={{ height: 20 }}>
        <Text>?</Text>
      </Pressable>,
    );
    expect(audit()).toEqual([
      { id: 'bad', issue: 'no role' },
      { id: 'bad', issue: 'no label' },
      { id: 'bad', issue: 'height 20' },
    ]);
  });

  it('level list (with How to play, Continue and statuses)', async () => {
    const [a, b] = LEVELS;
    await wrap(
      <LevelList
        levels={LEVELS}
        statuses={{ [a?.id ?? '']: 'completed', [b?.id ?? '']: 'in-progress' }}
        suggestedId={b?.id ?? null}
        onOpen={jest.fn()}
        extra={<LevelListExtras onHowToPlay={jest.fn()} />}
      />,
    );
    expect(audit()).toEqual([]);
    expect(screen.getByRole('button', { name: 'How to play' })).toBeOnTheScreen();
  });

  it('How to play', async () => {
    await wrap(<HowToPlay onBack={jest.fn()} onTutorial={jest.fn()} />);
    expect(audit()).toEqual([]);
    expect(screen.getByRole('header', { name: 'How to play' })).toBeOnTheScreen();
  });

  it('puzzle in tutorial mode with reset confirmation and the hint panel open', async () => {
    await wrap(<PuzzleScreen puzzle={tutorial.puzzle} title="Level 1" onBack={jest.fn()} tutorial />);
    await fireEvent.press(screen.getByRole('button', { name: 'Reset puzzle' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Hint/ }));
    expect(screen.getByTestId('coach-card')).toBeOnTheScreen();
    expect(screen.getByTestId('reset-confirm')).toBeOnTheScreen();
    expect(screen.getByTestId('hint-panel')).toBeOnTheScreen();
    expect(audit()).toEqual([]);
  });

  it('puzzle with a species intro', async () => {
    await wrap(
      <PuzzleScreen puzzle={mice.puzzle} title="Level 3" onBack={jest.fn()} introSpecies={['mouse']} />,
    );
    expect(screen.getByTestId('species-intro')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('New friend: mice live directly beside a mushroom (up, down, left or right).'),
    ).toBeOnTheScreen();
    expect(audit()).toEqual([]);
  });

  it('completed scene', async () => {
    await wrap(
      <PuzzleScreen
        puzzle={tutorial.puzzle}
        title="Level 1"
        onBack={jest.fn()}
        onNext={jest.fn()}
        initialGame={solved()}
        reducedMotionSetting="on"
      />,
    );
    expect(screen.getByTestId('board-scene')).toBeOnTheScreen();
    expect(audit()).toEqual([]);
  });

  it('not found', async () => {
    await wrap(<NotFound onBack={jest.fn()} />);
    expect(audit()).toEqual([]);
  });

  it('large text: only board text and decorative number discs are clamped; everything else scales', async () => {
    await wrap(<PuzzleScreen puzzle={tutorial.puzzle} title="Level 1" onBack={jest.fn()} tutorial />);
    const clamped = (root: typeof screen.container) =>
      root.queryAll((n) => n.type === 'Text' && n.props.maxFontSizeMultiplier !== undefined);
    const all = clamped(screen.container);
    const board = clamped(screen.getByTestId('board'));
    expect(all.length).toBeGreaterThan(0);
    expect(all.length).toBe(board.length);
    for (const n of all) expect(n.props.maxFontSizeMultiplier).toBeGreaterThanOrEqual(1.2);
  });
});
