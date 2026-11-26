/**
 * Each strategy in isolation (and with only the cheapest tier-1 helpers) against the oracle, so that higher
 * tiers are exercised on states that tier 1 would otherwise have resolved first. Also checks premise
 * completeness: replaying only a step's dependency closure re-derives the step.
 */
import { createPuzzleOrThrow, type Puzzle } from '@ww/puzzle-core';
import { UNIQUE_FIXTURES } from '@ww/puzzle-core/testing';
import { describe, expect, it } from 'vitest';
import { closure, dependencyGraph } from '../src/dependencies.ts';
import { rawDomains } from '../src/domains.ts';
import { applyStep, runDeduction } from '../src/engine.ts';
import { compileModel } from '../src/model.ts';
import { STRATEGY_ORDER } from '../src/strategies/index.ts';
import { neighbourExclusion } from '../src/strategies/neighbour-exclusion.ts';
import { noHabitat } from '../src/strategies/no-habitat.ts';
import type { DeductionStep } from '../src/types.ts';
import { blank, oracle, randomBoard, randomMarks, strategyById, unsoundEliminations } from './support.ts';

const SEEDS = Array.from({ length: 600 }, (_, i) => 1000 + i);

describe('each strategy is sound in isolation', () => {
  const fired = new Map<string, number>();

  for (const strategy of STRATEGY_ORDER) {
    it(strategy.id, () => {
      const sets = [[strategy], [noHabitat, neighbourExclusion, strategy]];
      for (const seed of SEEDS) {
        const puzzle = createPuzzleOrThrow(randomBoard(seed));
        const model = compileModel(puzzle);
        const truth = oracle(puzzle).solutions[0];
        for (const [variant, marks] of [blank(puzzle), randomMarks(puzzle, seed * 7, truth)].entries()) {
          const o = oracle(puzzle, marks);
          for (const set of sets) {
            const r = runDeduction(model, marks, set);
            expect(unsoundEliminations(r.steps, o), `seed ${seed}/${variant}`).toEqual([]);
            if (o.solutions.length > 0) expect(r.kind, `seed ${seed}/${variant}`).not.toBe('contradiction');
            const own = r.steps.filter((s) => s.strategy === strategy.id).length;
            fired.set(strategy.id, (fired.get(strategy.id) ?? 0) + own);
          }
        }
      }
      // Coverage: the strategy must actually have produced steps on these boards.
      expect(fired.get(strategy.id) ?? 0, `${strategy.id} never fired`).toBeGreaterThanOrEqual(20);
    });
  }
});

/** Re-derive `step` from `domains` with its own strategy: same premises, eliminations ⊇ the original's. */
function rederivable(puzzle: Puzzle, domains: number[], step: DeductionStep): boolean {
  const model = compileModel(puzzle);
  const strategy = strategyById(step.strategy);
  for (const f of strategy.find({ model, domains })) {
    if (f.kind !== 'step') continue;
    const s = f.step;
    if (JSON.stringify(s.premises) !== JSON.stringify(step.premises)) continue;
    if (s.explanation.key !== step.explanation.key) continue;
    const covers = step.eliminations.every((e) => {
      const r = s.eliminations.find((x) => x.cell === e.cell);
      return r !== undefined && e.values.every((v) => r.values.includes(v));
    });
    if (covers) return true;
  }
  return false;
}

function checkReplay(puzzle: Puzzle, marks: ReturnType<typeof blank>, label: string): number {
  const model = compileModel(puzzle);
  const r = runDeduction(model, marks, STRATEGY_ORDER);
  const graph = dependencyGraph(r.steps);
  let checked = 0;
  r.steps.forEach((step, k) => {
    const deps = closure(graph, graph.deps[k] ?? []);
    const domains = rawDomains(model, marks).domains;
    for (const j of deps) {
      const s = r.steps[j];
      if (s) applyStep(model, domains, s);
    }
    expect(rederivable(puzzle, domains, step), `${label} step ${k} (${step.strategy})`).toBe(true);
    checked++;
  });
  return checked;
}

describe('premises are complete (dependency-closure replay re-derives every step)', () => {
  it('on the unique core fixtures', () => {
    for (const f of UNIQUE_FIXTURES) {
      const puzzle = createPuzzleOrThrow(f.definition);
      expect(checkReplay(puzzle, blank(puzzle), f.name)).toBeGreaterThan(0);
    }
  });

  it('on random tiny boards, blank and with marks', () => {
    let checked = 0;
    for (const seed of SEEDS.slice(0, 300)) {
      const puzzle = createPuzzleOrThrow(randomBoard(seed));
      checked += checkReplay(puzzle, blank(puzzle), `seed ${seed}`);
      checked += checkReplay(puzzle, randomMarks(puzzle, seed * 13), `seed ${seed} marks`);
    }
    expect(checked).toBeGreaterThan(1000);
  });
});
