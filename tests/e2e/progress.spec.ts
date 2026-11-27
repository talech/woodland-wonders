import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { createPuzzleOrThrow, type PuzzleDefinition } from '../../packages/puzzle-core/src/index.ts';
import { search } from '../../packages/puzzle-solver/src/search/index.ts';

const CATALOG: PuzzleDefinition[] = JSON.parse(
  readFileSync(new URL('../../packages/puzzle-content/src/data/puzzles.json', import.meta.url), 'utf8'),
);
const NAMES: Record<string, string> = { fox: 'Fox', mouse: 'Mouse', rabbit: 'Rabbit' };
const def = CATALOG.find((d) => d.id.startsWith('beginner-') && Object.keys(d.population).length === 2);

test('progress survives reload; solving shows the scene and marks the level completed', async ({
  page,
}, info) => {
  if (!def) throw new Error('no two-species beginner puzzle');
  const result = search(createPuzzleOrThrow(def), { nodeBudget: 1_000_000 });
  if (result.kind !== 'unique') throw new Error('expected unique');
  const solution = result.solution;
  const cells = solution.flatMap((m, i) => (m === 'unmarked' || m === 'empty' ? [] : [{ i, m }]));
  const cell = (i: number) =>
    page.getByLabel(new RegExp(`^Row ${Math.floor(i / def.columns) + 1}, column ${(i % def.columns) + 1}:`));

  await page.goto(`/puzzle/${def.id}`);
  const firstAnimal = cells[0];
  if (!firstAnimal) throw new Error('no animals');
  await page.getByLabel(new RegExp(`^${NAMES[firstAnimal.m]}, `)).click();
  await cell(firstAnimal.i).click();
  await page.waitForTimeout(700); // debounced save (400 ms)
  await page.reload();
  await expect(cell(firstAnimal.i)).toHaveAccessibleName(new RegExp(`: ${firstAnimal.m}`));
  await expect(page.getByLabel(/^Undo/)).toBeEnabled();

  for (const species of Object.keys(def.population)) {
    await page.getByLabel(new RegExp(`^${NAMES[species]}, `)).click();
    for (const { i, m } of cells) if (m === species && !(i === firstAnimal.i)) await cell(i).click();
  }
  await expect(page.getByText('Scene complete!')).toBeVisible();
  await expect(page.getByTestId('board-scene')).toBeAttached(); // zero-size scene marker
  await page.screenshot({ path: info.outputPath('scene.png'), fullPage: true });

  await page.waitForTimeout(700);
  await page.goto('/');
  await page.getByTestId('coach-skip').click(); // first launch always shows the coach; click() waits (race fix)
  await page.goto('/');
  await expect(page.getByLabel(/beginner, completed/).first()).toBeVisible();
});
