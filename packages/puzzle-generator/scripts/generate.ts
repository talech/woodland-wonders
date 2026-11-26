/**
 * Puzzle generator CLI (offline, dev-only).
 *
 *   node scripts/generate.ts --band <band> --count <n> --seed <s> [--max-attempts <n>] [--out <dir>]
 *                            [--node-budget <n>] [--max-similarity <0..1>]
 *
 * Writes accepted candidates to <out>/<band>/<id>.json (default <out>: `generated/` at the repo root,
 * gitignored) and prints a report: attempts, accepted, rejections by reason, tier distribution, timing.
 * Output files are deterministic for a given seed, options and GENERATOR_VERSION.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BAND_IDS, GENERATOR_VERSION, generate, isBandId, toJson } from '../src/index.ts';

const USAGE =
  'usage: node scripts/generate.ts --band <tutorial|beginner|easy|intermediate|advanced> --count <n> --seed <s> ' +
  '[--max-attempts <n>] [--out <dir>] [--node-budget <n>] [--max-similarity <0..1>]';

function fail(message: string): never {
  console.error(message);
  console.error(USAGE);
  process.exit(2);
}

const KNOWN = new Set([
  '--band',
  '--count',
  '--seed',
  '--max-attempts',
  '--out',
  '--node-budget',
  '--max-similarity',
]);
const args = new Map<string, string>();
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const flag = argv[i] ?? '';
  const value = argv[i + 1];
  if (!KNOWN.has(flag)) fail(`unknown argument '${flag}'`);
  if (value === undefined || value.startsWith('--')) fail(`missing value for ${flag}`);
  args.set(flag, value);
}

const positiveInt = (flag: string, fallback?: number): number => {
  const raw = args.get(flag);
  if (raw === undefined) {
    if (fallback === undefined) fail(`${flag} is required`);
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) fail(`${flag} must be a positive integer`);
  return n;
};

const band = args.get('--band') ?? fail('--band is required');
if (!isBandId(band)) fail(`unknown band '${band}' (expected ${BAND_IDS.join(', ')})`);
const seed = args.get('--seed') ?? fail('--seed is required');
const count = positiveInt('--count');
const maxAttempts = positiveInt('--max-attempts', Math.max(1000, count * 2000));
const nodeBudget = args.has('--node-budget') ? positiveInt('--node-budget') : undefined;
const simRaw = args.get('--max-similarity');
const maxSimilarity = simRaw === undefined ? undefined : Number(simRaw);
if (maxSimilarity !== undefined && !(maxSimilarity >= 0 && maxSimilarity <= 1))
  fail('--max-similarity must be in [0, 1]');

const repoRoot = resolve(import.meta.dirname, '../../..');
const outRoot = resolve(args.get('--out') ?? join(repoRoot, 'generated'));
const outDir = join(outRoot, band);

const started = performance.now();
const { puzzles, report } = generate({
  band,
  count,
  seed,
  maxAttempts,
  ...(nodeBudget === undefined ? {} : { overrides: { nodeBudget } }),
  ...(maxSimilarity === undefined ? {} : { maxSimilarity }),
});
const elapsed = performance.now() - started;

mkdirSync(outDir, { recursive: true });
for (const p of puzzles) writeFileSync(join(outDir, `${p.definition.id}.json`), toJson(p.definition));

const rate = (n: number) => (elapsed > 0 ? (n / (elapsed / 1000)).toFixed(1) : 'n/a');
const lines = [
  `generator ${GENERATOR_VERSION} · band ${band} · seed '${seed}'`,
  `attempts   ${report.attempts} (max ${maxAttempts}) · ${rate(report.attempts)} attempts/s`,
  `accepted   ${report.accepted}/${count} · yield ${((100 * report.accepted) / Math.max(1, report.attempts)).toFixed(2)}%`,
  `time       ${(elapsed / 1000).toFixed(2)} s`,
  'rejections:',
  ...Object.entries(report.rejections)
    .filter(([, n]) => n > 0)
    .map(([reason, n]) => `  ${reason.padEnd(18)} ${n}`),
  `tiers of gated candidates (unique + deduction-solvable): ${JSON.stringify(report.gatedTiers)}`,
  `tiers of accepted: ${JSON.stringify(report.acceptedTiers)}`,
];
if (puzzles.length > 0) {
  lines.push('accepted puzzles (substantive steps excl. no-habitat · substantive chain · overlap):');
  for (const p of puzzles) {
    const m = p.metrics;
    lines.push(
      `  ${p.definition.id}  ${p.definition.rows}x${p.definition.columns}  tier ${m.requiredTier}  steps ${m.substantiveSteps}  chain ${m.substantiveChain}  overlap ${m.overlap.toFixed(2)}`,
    );
  }
}
lines.push(`wrote ${puzzles.length} file(s) to ${outDir}`);
console.log(lines.join('\n'));
if (report.accepted < count) {
  console.error(`only ${report.accepted}/${count} accepted within ${report.attempts} attempts`);
  process.exit(1);
}
