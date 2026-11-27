/**
 * check:bundle — ground-truth bundle boundary check (ADR-0004), complementing check:boundaries.
 * Reads the source maps of the exported game build and fails if any forbidden module shipped.
 * Run after `pnpm build:web` (which exports with --source-maps). Usage: node scripts/check-bundle.ts [distDir]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'apps/game/dist/web');
const FORBIDDEN: { re: RegExp; why: string }[] = [
  { re: /packages\/puzzle-solver\/src\/search\//, why: 'exhaustive search' },
  { re: /packages\/puzzle-generator\//, why: 'generator' },
  { re: /packages\/[^/]+\/src\/testing\//, why: 'test fixtures' },
  { re: /packages\/puzzle-content\/scripts\//, why: 'content tooling' },
];
const REQUIRED = [/packages\/puzzle-core\/src\//, /packages\/puzzle-solver\/src\/index\.ts/];

interface RawMap {
  sources?: string[];
  sections?: { map: RawMap }[];
}
const sources = new Set<string>();
const collect = (m: RawMap) => {
  for (const s of m.sources ?? []) sources.add(s);
  for (const s of m.sections ?? []) collect(s.map);
};
const maps: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.map')) maps.push(p);
  }
};
walk(dist);
if (maps.length === 0) {
  console.error(`check:bundle — no source maps under ${dist}; export with --source-maps`);
  process.exit(1);
}
for (const m of maps) collect(JSON.parse(readFileSync(m, 'utf8')) as RawMap);

const errors: string[] = [];
for (const s of sources) for (const f of FORBIDDEN) if (f.re.test(s)) errors.push(`${f.why} shipped: ${s}`);
for (const r of REQUIRED)
  if (![...sources].some((s) => r.test(s))) errors.push(`sanity: expected a source matching ${r}`);
if (errors.length > 0) {
  console.error(`check:bundle — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`check:bundle — ok (${maps.length} maps, ${sources.size} sources, none forbidden)`);
