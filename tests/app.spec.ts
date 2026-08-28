import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing page states the job and has one primary path', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Health Data Bridge — map health records locally');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.locator('img[alt]')).toHaveCount(1);
});

test('keyboard users can skip navigation and run the import preview', async ({ page }) => {
  await page.goto('/demo');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();

  const preview = page.getByRole('button', { name: 'Preview 12 records' });
  await preview.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Write import receipt' })).toBeVisible();
});

test('demo reset clears the isolated receipt ledger', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Preview 12 records' }).click();
  await page.getByRole('button', { name: 'Write import receipt' }).click();
  await expect(page.getByRole('heading', { name: 'Receipt history' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('heading', { name: 'Receipt history' })).toHaveCount(0);
});

test('invalid file gives a plain recovery path', async ({ page }) => {
  await page.goto('/bridge');
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('The records could not be opened.');
  await expect(alert.getByRole('button', { name: 'Choose another file' })).toBeVisible();
});

test('mobile layout keeps every control inside the viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/demo');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('button', { name: 'Preview 12 records' })).toBeVisible();
});

test('legal and missing routes have one heading and a way back', async ({ page }) => {
  for (const route of ['/privacy', '/terms', '/missing-place']) {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
  await expect(page.getByRole('link', { name: 'Return to the map' })).toBeVisible();
});

test('demo has no serious or critical accessibility findings', async ({ page }) => {
  await page.goto('/demo');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});
