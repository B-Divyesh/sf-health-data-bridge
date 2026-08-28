import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function importSample(page: import('@playwright/test').Page) {
  await page.goto('/demo');
  await expect(page.getByText('12 records', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview 12 records' }).click();
  await page.getByRole('button', { name: 'Write import receipt' }).click();
}

type EncryptedPayload = { iv: number[]; data: number[] };

async function readEncryptedLedger(page: import('@playwright/test').Page): Promise<EncryptedPayload> {
  await page.waitForFunction(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('health-data-bridge');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<boolean>((resolve, reject) => {
        const request = db.transaction('encrypted').objectStore('encrypted').get('receipts');
        request.onsuccess = () => resolve(Boolean(request.result?.iv?.length && request.result?.data?.length));
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });

  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('health-data-bridge');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<EncryptedPayload>((resolve, reject) => {
        const request = db.transaction('encrypted').objectStore('encrypted').get('receipts');
        request.onsuccess = () => resolve(request.result as EncryptedPayload);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  });
}

test('@claim:duplicate-safe second import writes zero duplicates', async ({ page }) => {
  await importSample(page);
  await expect(page.getByText('12', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Write import receipt' }).click();
  const receipt = page.getByRole('article', { name: 'Latest import receipt' });
  await expect(receipt.locator('dd').nth(0)).toHaveText('0');
  await expect(receipt.locator('dd').nth(1)).toHaveText('12');
});

test('@claim:csv-export exports every local record', async ({ page }) => {
  await importSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream!) text += chunk.toString();
  const rows = text.trim().split('\n');
  expect(rows[0]).toBe('id,type,startTime,endTime,value,unit,source,localField');
  expect(rows).toHaveLength(13);
  expect(text).toContain('measurement.weight_kg');
});

test('@claim:json-export exports records and receipts', async ({ page }) => {
  await importSample(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream!) text += chunk.toString();
  const data = JSON.parse(text);
  expect(data.records).toHaveLength(12);
  expect(data.receipts).toHaveLength(1);
});

test('@claim:local-only demo sends no record data off origin', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url());
  });
  await importSample(page);
  await page.getByRole('button', { name: 'Export JSON' }).click();
  expect(external).toEqual([]);
});

test('@claim:offline-reload demo works after connection loss', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build a duplicate-safe import');
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    await navigator.serviceWorker.ready;
    return Boolean(navigator.serviceWorker.controller);
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('12 records', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview 12 records' }).click();
  await expect(page.getByText('activity.active_energy_kcal').first()).toBeVisible();
});

test('@claim:encrypted-storage keeps real receipts out of plaintext', async ({ page }) => {
  await page.goto('/bridge');
  const fixture = JSON.stringify({ records: [{ id: 'private-record-7', type: 'weight', startTime: '2026-08-01T08:00:00.000Z', endTime: '2026-08-01T08:00:00.000Z', value: 72.1, unit: 'kg', source: 'Local scale' }] });
  await page.locator('input[type=file]').setInputFiles({ name: 'health.json', mimeType: 'application/json', buffer: Buffer.from(fixture) });
  await page.getByRole('button', { name: 'Preview 1 records' }).click();
  await page.getByRole('button', { name: 'Write import receipt' }).click();
  await expect(page.getByText('The local ledger and encrypted receipt are saved.')).toBeVisible();
  const stored = await readEncryptedLedger(page);
  expect(JSON.stringify(stored)).not.toContain('private-record-7');
  expect(stored.iv).toHaveLength(12);
  expect(stored.data.length).toBeGreaterThan(0);

  // Regression: a record is only considered saved when the ciphertext can be
  // decrypted into the same local ledger after a full app reload.
  await page.reload();
  await expect(page.getByText('1 records in this local log')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Receipt history' })).toBeVisible();
});

test('@claim:paid-custom-fields saves a paid custom field name', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sb_license:health-data-bridge:verdict', JSON.stringify({ valid: true, checkedAt: Date.now() })));
  await page.goto('/demo');
  await page.getByLabel('Weight local field').fill('body.mass_kg');
  await page.getByRole('button', { name: 'Save field names' }).click();
  await expect(page.getByText('Field names saved on this device.')).toBeVisible();
  await page.getByRole('button', { name: 'Preview 12 records' }).click();
  await expect(page.getByText('body.mass_kg').first()).toBeVisible();
});

test('@claim:local-file-import opens JSON and CSV exports', async ({ page }) => {
  await page.goto('/bridge');
  const json = JSON.stringify([{ id: 'json-1', type: 'weight', startTime: '2026-08-01T08:00:00.000Z', endTime: '2026-08-01T08:00:00.000Z', value: 72, unit: 'kg', source: 'JSON scale' }]);
  await page.locator('input[type=file]').setInputFiles({ name: 'health.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await expect(page.getByText('1 records', { exact: true })).toBeVisible();
  const csv = 'id,type,startTime,endTime,value,unit,source\ncsv-1,steps,2026-08-02T08:00:00.000Z,2026-08-02T09:00:00.000Z,4200,count,CSV tracker';
  await page.locator('input[type=file]').setInputFiles({ name: 'health.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Preview 1 records' }).click();
  await page.getByText('Preview individual records').click();
  await expect(page.getByText('CSV tracker')).toBeVisible();
});

test('@claim:narrow-health-permissions declares only four health reads', async () => {
  const manifest = await readFile('android/app/src/main/AndroidManifest.xml', 'utf8');
  const healthPermissions = [...manifest.matchAll(/android\.permission\.health\.([A-Z_]+)/g)].map(match => match[1]);
  expect(healthPermissions).toEqual(['READ_STEPS', 'READ_ACTIVE_CALORIES_BURNED', 'READ_EXERCISE', 'READ_WEIGHT']);
  expect(manifest).not.toContain('WRITE_');
});
