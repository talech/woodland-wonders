import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import {
  type CellMark,
  createPuzzleOrThrow,
  type PuzzleDefinition,
} from '../../packages/puzzle-core/src/index.ts';
import { search } from '../../packages/puzzle-solver/src/search/index.ts';

/**
 * Content-independent: puzzles come from the shipped catalog, and solutions are computed at test time
 * with the exhaustive search (test-only; the app never ships answers).
 */
const CATALOG: PuzzleDefinition[] = JSON.parse(
  readFileSync(new URL('../../packages/puzzle-content/src/data/puzzles.json', import.meta.url), 'utf8'),
);
const NAMES: Record<string, string> = { fox: 'Fox', mouse: 'Mouse', rabbit: 'Rabbit' };

function solve(def: PuzzleDefinition): readonly CellMark[] {
  const result = search(createPuzzleOrThrow(def), { nodeBudget: 1_000_000 });
  if (result.kind !== 'unique') throw new Error(`${def.id}: expected unique, got ${result.kind}`);
  return result.solution;
}
const cell = (page: Page, row: number, col: number) =>
  page.getByLabel(new RegExp(`^Row ${row}, column ${col}:`));
const first = CATALOG[0];
const largest = [...CATALOG].sort((a, b) => b.rows * b.columns - a.rows * a.columns)[0];

async function playSolution(page: Page, def: PuzzleDefinition) {
  const solution = solve(def);
  for (const species of Object.keys(def.population)) {
    await page.getByLabel(new RegExp(`^${NAMES[species] ?? species}, `)).click();
    for (let i = 0; i < solution.length; i++) {
      if (solution[i] === species)
        await cell(page, Math.floor(i / def.columns) + 1, (i % def.columns) + 1).click();
    }
  }
}

test('plays the first puzzle to completion, with a flagged rule break and undo', async ({ page }, info) => {
  if (!first) throw new Error('empty catalog');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`/puzzle/${first.id}`);
  await page.screenshot({ path: info.outputPath('01-start.png'), fullPage: true });

  // Find a grass cell with no orthogonal habitat: placing an animal there must be allowed and flagged.
  const habitat = new Set(first.habitats.map((h) => `${h.row},${h.col}`));
  const lonely = [...Array(first.rows * first.columns).keys()]
    .map((i) => ({ r: Math.floor(i / first.columns), c: i % first.columns }))
    .find(
      ({ r, c }) =>
        !habitat.has(`${r},${c}`) &&
        ![
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ].some(([a, b]) => habitat.has(`${a},${b}`)),
    );
  const species = Object.keys(first.population)[0] ?? 'fox';
  if (lonely) {
    await page.getByLabel(new RegExp(`^${NAMES[species]}, `)).click();
    await cell(page, lonely.r + 1, lonely.c + 1).click();
    await expect(cell(page, lonely.r + 1, lonely.c + 1)).toHaveAccessibleName(/needs a /);
    await page.screenshot({ path: info.outputPath('02-violation.png'), fullPage: true });
    await page.getByLabel(/^Undo/).click();
    await expect(cell(page, lonely.r + 1, lonely.c + 1)).toHaveAccessibleName(/: unmarked$/);
  }

  await playSolution(page, first);
  await expect(page.getByText('Scene complete!')).toBeVisible();
  await page.screenshot({ path: info.outputPath('03-complete.png'), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('largest catalog board fits the width, keeps controls reachable, and is solvable in the UI', async ({
  page,
}, info) => {
  if (!largest) throw new Error('empty catalog');
  await page.goto(`/puzzle/${largest.id}`);
  const corner = cell(page, largest.rows, largest.columns);
  await expect(corner).toBeVisible();
  const box = await corner.boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box && box.x + box.width).toBeLessThanOrEqual(width);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(32);
  // Regression (M1-C.1): core controls reachable without scrolling; tray names never break mid-word.
  await expect(page.getByLabel(/^Undo/)).toBeInViewport();
  await expect(page.getByLabel(/^Mark empty|^Empty/).first()).toBeInViewport();
  await page.screenshot({ path: info.outputPath('04-largest.png'), fullPage: true });
  await playSolution(page, largest);
  await expect(page.getByText('Scene complete!')).toBeVisible();
});
