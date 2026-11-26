/**
 * content:add — validate a puzzle definition JSON file and add it to src/data/puzzles.json.
 * Usage: node scripts/add-puzzle.ts <file.json> [--replace]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { addPuzzle, formatCatalog, reportAdd } from '../src/add.ts';

const args = process.argv.slice(2);
const replace = args.includes('--replace');
const files = args.filter((a) => !a.startsWith('--'));
const unknownFlags = args.filter((a) => a.startsWith('--') && a !== '--replace');
if (files.length !== 1 || unknownFlags.length > 0) {
  console.error('usage: node scripts/add-puzzle.ts <file.json> [--replace]');
  process.exit(2);
}

const catalogUrl = new URL('../src/data/puzzles.json', import.meta.url);
let input: unknown;
try {
  input = JSON.parse(readFileSync(files[0] as string, 'utf8'));
} catch (e) {
  console.error(`cannot read ${files[0]}: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}

const result = addPuzzle(JSON.parse(readFileSync(catalogUrl, 'utf8')), input, { replace });
for (const line of reportAdd(result)) console.log(line);
if (!result.ok) process.exit(1);
writeFileSync(catalogUrl, formatCatalog(result.catalog));
console.log('wrote src/data/puzzles.json. Run `pnpm content:validate` next.');
