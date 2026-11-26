import { expect, type Page, test } from '@playwright/test';

/** meadow-001 is the tiny4x4 fixture: ['..Ft', '.t.t', '.F..', '....'] — foxes at (1,3) and (3,2), 1-based. */
const cell = (page: Page, row: number, col: number) =>
  page.getByLabel(new RegExp(`^Row ${row}, column ${col}:`));

test('plays meadow-001 to completion in the browser, with undo and feedback', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/puzzle/meadow-001');
  await expect(
    page
      .getByText('Woodland Wonders')
      .or(page.getByText(/meadow-001|Level 1/))
      .first(),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('01-start.png'), fullPage: true });

  await page.getByLabel(/^Fox, /).click();
  // A rule-breaking placement is allowed and flagged (fox without a tree next to it).
  await cell(page, 4, 1).click();
  await expect(cell(page, 4, 1)).toHaveAccessibleName(/fox, needs a tree/);
  await page.screenshot({ path: info.outputPath('02-violation.png'), fullPage: true });
  await page.getByLabel(/^Undo/).click();
  await expect(cell(page, 4, 1)).toHaveAccessibleName(/: unmarked$/);

  await cell(page, 1, 3).click();
  await cell(page, 3, 2).click();
  await expect(page.getByText('Scene complete!')).toBeVisible();
  await page.screenshot({ path: info.outputPath('03-complete.png'), fullPage: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('largest seed board (6x6) fits the viewport width', async ({ page }, info) => {
  await page.goto('/puzzle/meadow-004');
  await expect(cell(page, 6, 6)).toBeVisible();
  const box = await cell(page, 6, 6).boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(box && box.x + box.width).toBeLessThanOrEqual(width);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(32);
  await page.screenshot({ path: info.outputPath('04-6x6.png'), fullPage: true });
});
