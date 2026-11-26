/**
 * content:validate — gate for every shipped puzzle (AGENTS.md, ADR-0006).
 * For each puzzle: schema + semantics, exactly one solution (bounded search; `unknown` fails),
 * deduction-only solve from the blank board (no guessing), and replay agreement: the deduced board
 * must equal the search solution. Exit code 1 on any failure.
 */
import { readFileSync } from 'node:fs';
import { type CellMark, createBoard, createPuzzle } from '@ww/puzzle-core';
import { analyzeDifficulty, deduce, domainValues } from '@ww/puzzle-solver';
import { search } from '@ww/puzzle-solver/search';
import { loadCatalog } from '../src/catalog.ts';

const NODE_BUDGET = 2_000_000;

const raw: unknown = JSON.parse(readFileSync(new URL('../src/data/puzzles.json', import.meta.url), 'utf8'));
const { puzzles, rejected } = loadCatalog(raw);
let failed = rejected.length > 0;
const fail = (id: string, why: string) => {
  failed = true;
  console.error(`FAIL  ${id}: ${why}`);
};

for (const r of rejected) fail(`#${r.index} ${r.id}`, r.issues.join('; '));

for (const def of puzzles) {
  const compiled = createPuzzle(def);
  if (!compiled.ok) {
    fail(def.id, compiled.issues.join('; '));
    continue;
  }
  const puzzle = compiled.value;

  const found = search(puzzle, { nodeBudget: NODE_BUDGET });
  if (found.kind !== 'unique') {
    fail(def.id, `uniqueness: ${found.kind} (${found.nodes} nodes)`);
    continue;
  }

  const result = deduce(puzzle, createBoard(puzzle).marks);
  if (result.kind !== 'solved') {
    fail(
      def.id,
      `deduction: ${result.kind} after ${result.steps.length} steps (requires guessing or unsupported strategy)`,
    );
    continue;
  }
  const deduced: CellMark[] = result.domains.map((set, cell) => {
    if (puzzle.habitatAt[cell] != null) return 'unmarked';
    const [value] = domainValues(puzzle, set);
    return value ?? 'unmarked';
  });
  const mismatch = deduced.findIndex((m, i) => {
    const s = found.solution[i] ?? 'unmarked';
    const norm = (x: CellMark) => (x === 'unmarked' ? 'empty' : x);
    return puzzle.habitatAt[i] == null && norm(m) !== norm(s);
  });
  if (mismatch >= 0) {
    fail(def.id, `replay: deduced board differs from search solution at cell ${mismatch}`);
    continue;
  }

  const m = analyzeDifficulty(result.steps);
  console.log(
    `ok    ${def.id.padEnd(12)} ${`${def.rows}x${def.columns}`.padEnd(5)} unique (${found.nodes} nodes) · deduced in ${m.stepCount} steps · max tier ${m.maxTier}`,
  );
}

console.log(`\n${puzzles.length} checked, ${rejected.length} rejected: ${failed ? 'FAILED' : 'all passed'}.`);
process.exit(failed ? 1 : 0);
