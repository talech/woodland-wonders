import { groupByTier, LEVELS, levelStatus, nextUnsolved } from '../src/game/levels';

const ids = LEVELS.map((l) => l.id);
const done = (...list: string[]) => ({
  progress: Object.fromEntries(list.map((id) => [id, { completedRevision: 1 }])),
  active: {},
});

describe('progression', () => {
  it('suggests the first unsolved level in catalog order', () => {
    expect(nextUnsolved(done())?.id).toBe(ids[0]);
    expect(nextUnsolved(done(ids[0] ?? '', ids[1] ?? ''))?.id).toBe(ids[2]);
    expect(nextUnsolved(done(...ids))).toBeUndefined();
  });

  it('after a puzzle, picks the next unsolved one, skipping solved ones and wrapping around', () => {
    const [a, b, c] = ids;
    if (!a || !b || !c) throw new Error('catalog too small');
    expect(nextUnsolved(done(a), a)?.id).toBe(b);
    expect(nextUnsolved(done(a, b), a)?.id).toBe(c);
    const last = ids.at(-1) ?? '';
    expect(nextUnsolved(done(last), last)?.id).toBe(a);
    // Never suggests the puzzle just finished, even if its completion was not recorded yet.
    expect(nextUnsolved(done(...ids.slice(1)), a)).toBeUndefined();
  });

  it('derives level status from completion and active boards', () => {
    const save = {
      progress: { x: { completedRevision: 2 }, y: {} },
      active: { y: { marks: ['unmarked', 'fox'] }, z: { marks: ['unmarked'] } },
    };
    expect(levelStatus(save, 'x')).toBe('completed');
    expect(levelStatus(save, 'y')).toBe('in-progress');
    expect(levelStatus(save, 'z')).toBe('new');
    expect(levelStatus(save, 'w')).toBe('new');
  });

  it('groups levels by tier in catalog order', () => {
    const groups = groupByTier();
    expect(groups.flatMap((g) => g.levels.map((l) => l.id))).toEqual(ids);
    expect(groups.map((g) => g.tier)).toEqual(['tutorial', 'beginner', 'easy', 'intermediate', 'advanced']);
  });
});
