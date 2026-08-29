import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { once } from 'node:events';

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

test('dark mode has no serious or critical accessibility findings on every state', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  for (const route of ['/', '/bridge', '/privacy', '/terms', '/missing-place']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || '')), route).toEqual([]);
  }
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Preview 12 records' }).click();
  await page.getByRole('button', { name: 'Write import receipt' }).click();
  const completed = await new AxeBuilder({ page }).analyze();
  expect(completed.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('product CSV survives an export and import round trip with quoted fields', async ({ page }) => {
  await page.goto('/bridge');
  const fixture = JSON.stringify([{ id: 'quoted-1', type: 'steps', startTime: '2026-08-01T08:00:00.000Z', endTime: '2026-08-01T09:00:00.000Z', value: 1200, unit: 'count', source: 'Pixel, Watch' }]);
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'quoted.json', mimeType: 'application/json', buffer: Buffer.from(fixture) });
  await page.getByRole('button', { name: 'Preview 1 records' }).click();
  await page.getByRole('button', { name: 'Write import receipt' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const stream = await (await downloadPromise).createReadStream();
  let csv = '';
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain('"Pixel, Watch"');
  await page.locator('input[type=file]').setInputFiles({ name: 'round-trip.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Preview 1 records' }).click();
  await page.getByText('Preview individual records').click();
  await expect(page.getByRole('cell', { name: 'Pixel, Watch' })).toBeVisible();
});

test('invalid health values, units, and date ranges are rejected', async ({ page }) => {
  await page.goto('/bridge');
  const invalidRecords = [
    { id: 'bad-negative', type: 'steps', startTime: '2026-08-01T08:00:00.000Z', endTime: '2026-08-01T09:00:00.000Z', value: -99, unit: 'count', source: 'Phone' },
    { id: 'bad-unit', type: 'steps', startTime: '2026-08-01T08:00:00.000Z', endTime: '2026-08-01T09:00:00.000Z', value: 99, unit: 'kg', source: 'Phone' },
    { id: 'bad-time', type: 'weight', startTime: 'not-a-date', endTime: '2026-08-01T09:00:00.000Z', value: 70, unit: 'kg', source: 'Scale' },
    { id: 'backwards', type: 'exercise', startTime: '2026-08-01T10:00:00.000Z', endTime: '2026-08-01T09:00:00.000Z', value: 30, unit: 'min', source: 'Watch' }
  ];
  for (const [index, record] of invalidRecords.entries()) {
    await page.locator('input[type=file]').setInputFiles({ name: `invalid-${index}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify([record])) });
    await expect(page.getByRole('alert')).toContainText('matching unit');
    await page.getByRole('button', { name: 'Choose another file' }).click();
  }
});

test('returned licenses verify automatically and cache by token', async ({ page }) => {
  const requested: string[] = [];
  await page.route('https://api.sociobot.in/**', async route => {
    const token = new URL(route.request().url()).searchParams.get('license') || '';
    requested.push(token);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: token === 'corrected-token' }) });
  });
  await page.goto('/?license=returned-token');
  await expect.poll(() => requested).toEqual(['returned-token']);
  await expect(page).not.toHaveURL(/license=/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('sb_license:health-data-bridge:verdict') || '{}'))).toMatchObject({ token: 'returned-token', valid: false });
  await page.getByRole('button', { name: 'Paste an existing license' }).click();
  await page.getByLabel('License token').fill('corrected-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('Bridge Plus is active on this device.')).toBeVisible();
  expect(requested).toEqual(['returned-token', 'corrected-token']);
});

test('new sales are not linked while the external checkout is unavailable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('New purchases are paused.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
});

test('landing offers the built Android test package with its checksum', async ({ page }) => {
  await page.goto('/');
  const download = page.getByRole('link', { name: 'Download Android test build' });
  await expect(download).toHaveAttribute('href', '/downloads/health-data-bridge-debug-v1.0.4.apk');
  await expect(page.locator('.android-download code')).toHaveText(/^[a-f0-9]{64}$/);
});

test('SPA navigation starts at the heading and browser back restores scroll', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  const originalY = await page.evaluate(() => window.scrollY);
  await page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(originalY);
});

test('390px layout has 44px targets and reflows at 200 percent text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  // The checkbox inputs are deliberately visually hidden; their 48px labels
  // are the accessible touch targets. Date and text inputs are their own
  // targets, and the footer links must be at least 44px in both dimensions.
  for (const element of await page.locator('button:visible, a:visible, input:not([type=checkbox]):visible, summary:visible, .check-grid label:visible').all()) {
    const box = await element.boundingBox();
    expect(box?.height || 0, await element.textContent() || await element.getAttribute('aria-label') || 'control').toBeGreaterThanOrEqual(44);
  }
  for (const element of await page.getByRole('contentinfo').getByRole('link').all()) {
    const box = await element.boundingBox();
    expect(box?.width || 0, await element.textContent() || 'footer control').toBeGreaterThanOrEqual(44);
    expect(box?.height || 0, await element.textContent() || 'footer control').toBeGreaterThanOrEqual(44);
  }
  await page.addStyleTag({ content: 'html { font-size: 32px !important; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('a changed published shell installs a new worker and replaces the old shell cache', async ({ browser }) => {
  const [html, worker] = await Promise.all([
    readFile('dist/index.html', 'utf8'),
    readFile('dist/sw.js', 'utf8')
  ]);
  const version = worker.match(/const VERSION = '([^']+)'/i)?.[1];
  expect(version).toMatch(/^hdb-v1\.0\.4-[a-f0-9]{16}$/);
  if (!version) throw new Error('The production worker needs a concrete cache version.');
  const oldVersion = `${version}-previous`;
  let servedWorker = worker.replace(version!, oldVersion);
  const distRoot = resolve('dist');
  const mime = new Map([
    ['.html', 'text/html; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
    ['.webp', 'image/webp'], ['.png', 'image/png'], ['.svg', 'image/svg+xml'], ['.webmanifest', 'application/manifest+json']
  ]);
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (pathname === '/sw.js') {
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(servedWorker);
      return;
    }
    const route = pathname === '/' || ['/demo', '/bridge', '/privacy', '/terms'].includes(pathname) ? '/index.html' : pathname;
    const candidate = resolve(distRoot, `.${route}`);
    if (!candidate.startsWith(`${distRoot}/`)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const body = route === '/index.html' ? html : await readFile(candidate);
      response.writeHead(200, { 'Content-Type': mime.get(extname(candidate)) || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a local HTTP port for service worker test.');
  const origin = `http://127.0.0.1:${address.port}`;
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/demo`);
    await page.waitForFunction(async expected => (await caches.keys()).includes(expected), oldVersion);

    servedWorker = worker;
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    await page.waitForFunction(async ({ oldCache, newCache }) => {
      const keys = await caches.keys();
      return keys.includes(newCache) && !keys.includes(oldCache);
    }, { oldCache: oldVersion, newCache: version });
  } finally {
    await context.close();
    await new Promise<void>(resolveServer => server.close(() => resolveServer()));
  }
});

test('static response policy preserves SPA routes, 404s, and immutable assets', async () => {
  const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8'));
  expect(config.navigationFallback).toBeUndefined();
  expect(config.routes.filter((route: { rewrite?: string }) => route.rewrite === '/index.html').map((route: { route: string }) => route.route)).toEqual(['/demo', '/bridge', '/privacy', '/terms']);
  expect(config.responseOverrides['404'].rewrite).toBe('/404.html');
  expect(config.routes.find((route: { route: string }) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
});
