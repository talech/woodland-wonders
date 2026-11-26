/**
 * content:validate — gate for every shipped puzzle (AGENTS.md: verify uniqueness and deduction replay).
 * Exit code 1 on any failure. Checks not yet implementable are reported as PENDING, never as passed.
 */
import { readFileSync } from 'node:fs';
import { createPuzzle } from '@ww/puzzle-core';
import { loadCatalog } from '../src/catalog.ts';

const raw: unknown = JSON.parse(readFileSync(new URL('../src/data/puzzles.json', import.meta.url), 'utf8'));
const { puzzles, rejected } = loadCatalog(raw);
let failed = rejected.length > 0;

for (const r of rejected) console.error(`FAIL  #${r.index} ${r.id}: ${r.issues.join('; ')}`);
for (const def of puzzles) {
  const compiled = createPuzzle(def);
  if (!compiled.ok) {
    failed = true;
    console.error(`FAIL  ${def.id}: ${compiled.issues.join('; ')}`);
  } else console.log(`ok    ${def.id}  ${def.rows}x${def.columns}  schema+semantics`);
}

console.log(`\n${puzzles.length} valid, ${rejected.length} rejected.`);
console.log(
  'PENDING uniqueness (search) and deduction replay: enabled when @ww/puzzle-solver lands (lane B, M2).',
);
process.exit(failed ? 1 : 0);
