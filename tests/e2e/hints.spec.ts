import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { PuzzleDefinition } from '../../packages/puzzle-core/src/index.ts';

const CATALOG: PuzzleDefinition[] = JSON.parse(
  readFileSync(new URL('../../packages/puzzle-content/src/data/puzzles.json', import.meta.url), 'utf8'),
);
const sixBySix = CATALOG.find(
  (d) => d.rows === 6 && d.columns === 6 && Object.keys(d.population).length === 3,
);

test('two-stage hint: highlight, explain, apply as an undoable move', async ({ page }, info) => {
  if (!sixBySix) throw new Error('no 6x6 puzzle in catalog');
  await page.goto(`/puzzle/${sixBySix.id}`);
  await page.getByLabel(/^Hint/).click();
  await expect(page.getByTestId('hint-panel')).toBeVisible();
  await expect(page.getByLabel(/^Undo/)).toBeInViewport();
  await page.screenshot({ path: info.outputPath('hint-stage1.png') });

  await page.getByText('Show me').click();
  await page.screenshot({ path: info.outputPath('hint-stage2.png') });
  const before = await page
    .getByLabel(/^Row \d+, column \d+: (unmarked|empty|fox|mouse|rabbit)/)
    .allTextContents();
  await page.getByTestId('hint-action-apply').click();
  await expect(page.getByTestId('hint-panel')).toBeHidden();
  // Applied move is undoable.
  await expect(page.getByLabel(/^Undo/)).toBeEnabled();
  expect(before.length).toBeGreaterThan(0);
});

test('contradiction hint explains gently without revealing an answer', async ({ page }, info) => {
  if (!sixBySix) throw new Error('no 6x6 puzzle in catalog');
  await page.goto(`/puzzle/${sixBySix.id}`);
  // Two foxes side by side always break the same-species rule.
  const habitat = new Set(sixBySix.habitats.map((h) => `${h.row},${h.col}`));
  let pair: [number, number] | undefined;
  for (let r = 0; r < 6 && !pair; r++)
    for (let c = 0; c < 5 && !pair; c++)
      if (!habitat.has(`${r},${c}`) && !habitat.has(`${r},${c + 1}`)) pair = [r, c];
  if (!pair) throw new Error('no free pair');
  await page.getByLabel(/^Fox, /).click();
  await page.getByLabel(new RegExp(`^Row ${pair[0] + 1}, column ${pair[1] + 1}:`)).click();
  await page.getByLabel(new RegExp(`^Row ${pair[0] + 1}, column ${pair[1] + 2}:`)).click();
  await page.getByLabel(/^Hint/).click();
  await expect(page.getByText(/Something doesn.t fit/)).toBeVisible();
  await page.screenshot({ path: info.outputPath('hint-contradiction.png') });
});
