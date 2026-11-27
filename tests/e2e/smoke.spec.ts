import { expect, test } from '@playwright/test';

test('first launch opens the interactive tutorial; skipping lands on the level list', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByTestId('coach-card')).toBeVisible();
  await page.screenshot({ path: info.outputPath('tutorial.png') });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByTestId('coach-skip').click();
  await page.goto('/');
  await expect(page.getByTestId('continue')).toBeVisible();
  await expect(page.getByTestId('coach-card')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('levels.png'), fullPage: true });
  expect(errors).toEqual([]);
});
