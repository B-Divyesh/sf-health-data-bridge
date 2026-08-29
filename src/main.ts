import './style.css';
import { Capacitor } from '@capacitor/core';
import { sampleRecords } from './sample';
import { loadLocalData, resetDemo, saveLocalData } from './storage';
import { HealthConnect } from './native';
import { cachedUnlock, captureLicense, verifyLicense } from './license';
import type { HealthRecord, ImportReceipt, MappedRecord, RecordKind } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const routeLive = document.createElement('div');
routeLive.className = 'sr-only';
routeLive.setAttribute('aria-live', 'polite');
document.body.append(routeLive);
document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', event => {
  event.preventDefault();
  const main = document.querySelector<HTMLElement>('#main');
  main?.focus();
  main?.scrollIntoView({ behavior: 'instant' });
});

const returnedLicense = captureLicense();
const BUILD = 'v1.0.4';
const ANDROID_TEST_APK = '/downloads/health-data-bridge-debug-v1.0.4.apk';
const apkDigest = document.querySelector<HTMLMetaElement>('meta[name="health-data-bridge-apk-sha256"]')?.content || '';
const isNativeAndroid = Capacitor.getPlatform() === 'android';
const TYPE_LABELS: Record<RecordKind, string> = {
  steps: 'Steps', activeEnergy: 'Active energy', exercise: 'Exercise time', weight: 'Weight'
};
const MAP_FIELDS: Record<RecordKind, string> = {
  steps: 'activity.steps', activeEnergy: 'activity.active_energy_kcal', exercise: 'activity.duration_min', weight: 'measurement.weight_kg'
};

function shell(content: string, demo = false): string {
  return `
    ${demo ? `<aside class="demo-banner" aria-label="Demo status"><span><strong>Demo</strong> — sample data, nothing is saved</span><span class="demo-actions"><button class="text-button" data-reset-demo>Reset demo</button><a href="/bridge" data-link>Start for real</a></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Health Data Bridge home"><svg aria-hidden="true" viewBox="0 0 40 40"><path d="M4 23c7-17 12 7 19-8s11 2 13 6"/><circle cx="6" cy="23" r="3"/><circle cx="35" cy="21" r="3"/></svg><span>Health Data<br>Bridge</span></a>
      <nav aria-label="Main navigation"><a href="/demo" data-link>Demo</a><a href="/bridge" data-link>Open bridge</a><a href="/privacy" data-link>Privacy</a></nav>
    </header>
    ${content}
    <div class="status-toast" role="status" aria-live="polite" hidden></div>
    <footer class="site-footer"><p>Map Health Connect records to a local log.</p><nav aria-label="Footer navigation"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://sociobot.in" rel="external">Built by Param Factory <span class="sr-only">(external)</span></a></nav><p>${BUILD} · Generated artwork disclosed in the design notes.</p></footer>`;
}

function landing(): string {
  document.title = 'Health Data Bridge — map health records locally';
  return shell(`<main id="main" tabindex="-1">
    <section class="hero contour-section">
      <div class="hero-copy">
        <p class="eyebrow">A private Android import map</p>
        <h1 tabindex="-1">Map Health Connect data to your log</h1>
        <p class="lede">For Android loggers who need activity and weight records without sending their history to another service.</p>
        <div class="hero-action"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span>Next, preview 12 records and their field map.</span></div>
        <ul class="plain-facts"><li>Records stay on this device.</li><li>Works offline after the first visit.</li><li>Core import and export are free.</li></ul>
        ${isNativeAndroid ? '' : `<p class="android-download"><a class="inline-link" href="${ANDROID_TEST_APK}" download>Download Android test build</a><br><small>Debug APK · SHA-256: <code>${/^[a-f0-9]{64}$/.test(apkDigest) ? apkDigest : 'Checksum is not published yet.'}</code></small></p>`}
      </div>
      <figure class="hero-art"><picture><source srcset="/assets/topographic-bridge-720.webp 720w, /assets/topographic-bridge-1280.webp 1280w" type="image/webp"><img src="/assets/topographic-bridge-1280.webp" width="1280" height="853" alt="Two colored map routes meet at a blank paper ledger." fetchpriority="high" decoding="async"></picture><figcaption>Every route ends in a field you can inspect.</figcaption></figure>
    </section>
    <section class="live-preview" aria-labelledby="preview-title">
      <div><p class="eyebrow">The product, not a dashboard</p><h2 id="preview-title">See the map before you write</h2><p>Each Health Connect field has one visible local destination. The receipt lists new and skipped records.</p><a class="inline-link" href="/demo" data-link>Open the working sample →</a></div>
      <div class="map-sheet" aria-label="Example field mapping"><div><span>Health Connect</span><strong>Active calories</strong></div><svg viewBox="0 0 160 34" aria-hidden="true"><path d="M3 17h154"/><circle cx="3" cy="17" r="3"/><circle cx="157" cy="17" r="3"/></svg><div><span>Local field</span><strong>active_energy_kcal</strong></div><p class="receipt-stamp">12 new · 0 repeats</p></div>
    </section>
    <section class="steps contour-section" aria-labelledby="steps-title"><p class="eyebrow">A four-station route</p><h2 id="steps-title">How the bridge works</h2><ol><li><span>01</span><h3>Choose records</h3><p>Grant only activity and weight access, or open a local export.</p></li><li><span>02</span><h3>Check the map</h3><p>Pick dates and inspect each source-to-log field.</p></li><li><span>03</span><h3>Write the receipt</h3><p>Export CSV or JSON. Repeats are skipped by record ID.</p></li></ol></section>
    <section class="boundaries" aria-labelledby="boundaries-title"><div><p class="eyebrow">Plain boundaries</p><h2 id="boundaries-title">Your records do not become our records</h2></div><ul><li>No account or cloud history.</li><li>No calorie targets or medical advice.</li><li>No provider sharing.</li><li>No Apple Health support in this version.</li></ul></section>
    <section class="paid" aria-labelledby="paid-title"><div><p class="eyebrow">Existing Bridge Plus licenses</p><h2 id="paid-title">Restore custom export field names</h2><p>New purchases are paused. Existing licenses still enable saved field names. Import, receipts, CSV, and JSON remain free.</p></div><div class="price"><button class="text-button" data-show-license>Paste an existing license</button><form class="license-form" hidden><label for="license-token">License token</label><div><input id="license-token" autocomplete="off"><button type="submit">Verify license</button></div><p class="form-status" aria-live="polite"></p></form></div></section>
  </main>`);
}

function legal(kind: 'privacy' | 'terms'): string {
  const privacy = kind === 'privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} — Health Data Bridge`;
  return shell(`<main id="main" tabindex="-1" class="prose-page"><p class="eyebrow">Effective 28 August 2026</p><h1 tabindex="-1">${privacy ? 'Your records stay under your control' : 'Terms for using the bridge'}</h1>${privacy ? `
    <h2>What the app stores</h2><p>The app stores imported records and receipts on your device. Browser storage uses device-bound encryption.</p>
    <h2>Data flow</h2><ol><li>Health Connect or your chosen file supplies records.</li><li>The app filters and maps records in memory.</li><li>The app writes an encrypted local ledger or your chosen download.</li></ol>
    <h2>What leaves the app</h2><p>Health records never go to our server. License checks send only your license token to Sociobot.</p>
    <h2>What you can remove</h2><p>Delete the app or clear its site data to remove local records. Demo data ends with the browser session.</p>
    <h2>Contact</h2><p>Email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a> with a privacy question.</p>` : `
    <h2>Use</h2><p>Use the app to copy records you have permission to access. Check exports before relying on them.</p>
    <h2>Health notice</h2><p>This utility does not give medical advice. It does not calculate treatment or calorie targets.</p>
    <h2>Existing licenses</h2><p>New Bridge Plus purchases are paused. Existing license holders can restore saved field names on this device.</p>
    <h2>Warranty</h2><p>The app is provided as available. Keep a separate copy of records you cannot replace.</p>`}</main>`);
}

function notFound(): string {
  document.title = 'Page not found — Health Data Bridge';
  return shell(`<main id="main" tabindex="-1" class="not-found contour-section"><p class="eyebrow">Map edge</p><h1 tabindex="-1">This route stops here</h1><p>The page address does not match a place in this app.</p><a class="button primary" href="/" data-link>Return to the map</a></main>`);
}

function bridgePage(demo: boolean): string {
  document.title = `${demo ? 'Demo' : 'Bridge'} — Health Data Bridge`;
  return shell(`<main id="main" tabindex="-1" class="bridge-main"><div class="bridge-heading"><p class="eyebrow">${demo ? 'Working sample' : 'Local workspace'}</p><h1 tabindex="-1">Build a duplicate-safe import</h1><p>${demo ? 'Twelve sample records are ready to inspect.' : 'Connect on Android or choose a local Health Connect export.'}</p></div><div id="bridge-app" class="bridge-app" aria-live="polite"><div class="loading-state"><span class="survey-spinner" aria-hidden="true"></span><p>Opening the local ledger…</p></div></div></main>`, demo);
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell.length === 0) quoted = true;
    else if (character === ',') { row.push(cell.trim()); cell = ''; }
    else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += character;
  }
  if (quoted) throw new Error('The CSV has an unclosed quoted field.');
  row.push(cell.trim());
  if (row.some(value => value !== '')) rows.push(row);
  return rows;
}

function parseCsv(text: string): HealthRecord[] {
  const [header, ...rows] = parseCsvRows(text);
  const required = ['id', 'type', 'startTime', 'endTime', 'value', 'unit', 'source'];
  if (!header || !required.every(field => header.includes(field))) throw new Error('The CSV needs id, type, startTime, endTime, value, unit, and source columns.');
  if (rows.some(row => row.length !== header.length)) throw new Error('The CSV has a row with the wrong number of fields.');
  return rows.map(row => Object.fromEntries(header.map((key, index) => [key, key === 'value' ? Number(row[index]) : row[index]])) as unknown as HealthRecord);
}

function validateRecords(records: HealthRecord[]): HealthRecord[] {
  const kinds: RecordKind[] = ['steps', 'activeEnergy', 'exercise', 'weight'];
  const units: Record<RecordKind, HealthRecord['unit']> = { steps: 'count', activeEnergy: 'kcal', exercise: 'min', weight: 'kg' };
  if (!Array.isArray(records) || !records.length) throw new Error('No supported activity or weight records were found.');
  const invalid = records.find(record => {
    if (!record || typeof record.id !== 'string' || !record.id.trim() || !kinds.includes(record.type)) return true;
    if (!Number.isFinite(record.value) || record.value < 0 || (record.type === 'weight' && record.value === 0)) return true;
    if (record.unit !== units[record.type] || typeof record.source !== 'string' || !record.source.trim()) return true;
    const start = Date.parse(record.startTime); const end = Date.parse(record.endTime);
    return !Number.isFinite(start) || !Number.isFinite(end) || start > end;
  });
  if (invalid) throw new Error('Each record needs a valid ID, date range, non-negative value, source, and matching unit.');
  return records;
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value: unknown): string {
  return String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!);
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function mountBridge(demo: boolean): Promise<void> {
  const host = document.querySelector<HTMLDivElement>('#bridge-app');
  if (!host) return;
  const saved = await loadLocalData(demo);
  let source = demo ? sampleRecords : [];
  let selectedTypes: RecordKind[] = ['steps', 'activeEnergy', 'exercise', 'weight'];
  let dateFrom = demo ? '2026-08-22' : new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  let dateTo = demo ? '2026-08-26' : new Date().toISOString().slice(0, 10);
  let mapped: MappedRecord[] = [];
  let receipts = saved.receipts;
  let importedIds = saved.importedIds;
  let logRecords = saved.records;
  let lastReceipt: ImportReceipt | undefined;
  let error = '';
  const isPlus = demo || cachedUnlock();
  const fieldsStorage = demo ? sessionStorage : localStorage;
  const fieldsKey = demo ? 'demo:custom-fields' : 'hdb:custom-fields';
  let mapFields: Record<RecordKind, string> = { ...MAP_FIELDS };
  if (isPlus) {
    try { mapFields = { ...mapFields, ...JSON.parse(fieldsStorage.getItem(fieldsKey) || '{}') }; } catch { /* use defaults */ }
  }

  const validRange = () => Boolean(dateFrom && dateTo && dateFrom <= dateTo);
  const filtered = () => validRange() ? source.filter(record => selectedTypes.includes(record.type) && record.startTime.slice(0, 10) >= dateFrom && record.startTime.slice(0, 10) <= dateTo) : [];
  const render = () => {
    const candidates = filtered();
    const rangeError = !validRange() ? 'Choose an end date that is on or after the start date.' : '';
    host.innerHTML = `<ol class="route-rail" aria-label="Import progress"><li class="active"><span>1</span>Source</li><li class="${source.length ? 'active' : ''}"><span>2</span>Range</li><li class="${mapped.length ? 'active' : ''}"><span>3</span>Map</li><li class="${lastReceipt ? 'active' : ''}"><span>4</span>Receipt</li></ol>
      ${error ? `<div class="error-state" role="alert"><strong>The records could not be opened.</strong><p>${escapeHtml(error)}</p><button data-clear-error>Choose another file</button></div>` : ''}
      <section class="station source-station" aria-labelledby="source-title"><div class="station-number">01</div><div class="station-body"><h2 id="source-title">Choose the source</h2>${demo ? `<p><strong>Sample Health Connect export</strong><br>Pixel Watch, OpenScale, and Health Connect</p><button data-reload-sample>Reload 12 sample records</button>` : `<p>On Android, request only the record types below. On the web, open a JSON or CSV export.</p><div class="source-actions"><button class="primary" data-connect>Read Health Connect</button><label class="file-button">Choose JSON or CSV<input type="file" accept=".json,.csv,application/json,text/csv" data-file></label></div><p class="native-status" aria-live="polite"></p>`}</div></section>
      <section class="station" aria-labelledby="range-title"><div class="station-number">02</div><div class="station-body"><h2 id="range-title">Set the range</h2><div class="date-grid"><label>From<input type="date" value="${dateFrom}" data-from aria-describedby="${rangeError ? 'range-error' : ''}"></label><label>To<input type="date" value="${dateTo}" data-to aria-describedby="${rangeError ? 'range-error' : ''}"></label></div>${rangeError ? `<p id="range-error" class="range-error" role="alert">${rangeError}</p>` : ''}<fieldset><legend>Record types</legend><div class="check-grid">${(Object.keys(TYPE_LABELS) as RecordKind[]).map(type => `<label><input type="checkbox" value="${type}" data-type ${selectedTypes.includes(type) ? 'checked' : ''}><span>${TYPE_LABELS[type]}</span></label>`).join('')}</div></fieldset><div class="range-summary"><strong>${candidates.length} records</strong><span>${source.length ? 'match this map' : 'will appear after you choose a source'}</span></div></div></section>
      <section class="station" aria-labelledby="map-title"><div class="station-number">03</div><div class="station-body"><h2 id="map-title">Inspect the field map</h2>${isPlus ? `<div class="plus-fields"><strong>Bridge Plus field names</strong>${(Object.keys(TYPE_LABELS) as RecordKind[]).map(type => `<label>${TYPE_LABELS[type]}<input value="${escapeHtml(mapFields[type])}" data-field-name="${type}" aria-label="${TYPE_LABELS[type]} local field"></label>`).join('')}<button data-save-fields>Save field names</button><span class="field-status" aria-live="polite"></span></div>` : ''}${source.length ? `<button class="secondary" data-preview ${rangeError || !candidates.length ? 'disabled' : ''}>${mapped.length ? 'Refresh preview' : `Preview ${candidates.length} records`}</button>` : `<div class="empty-state"><p>No records to map yet.</p><span>Choose a source at station 01.</span></div>`}${mapped.length ? `<div class="mapping-list">${(Object.keys(TYPE_LABELS) as RecordKind[]).filter(type => mapped.some(record => record.type === type)).map(type => `<div><span><small>Health Connect</small>${TYPE_LABELS[type]}</span><svg viewBox="0 0 100 24" aria-hidden="true"><path d="M2 12h96"/><circle cx="2" cy="12" r="2"/><circle cx="98" cy="12" r="2"/></svg><span><small>Local log</small><code>${escapeHtml(mapFields[type])}</code></span><b>${mapped.filter(record => record.type === type).length}</b></div>`).join('')}</div><details><summary>Preview individual records</summary><div class="record-table" role="region" aria-label="Record preview" tabindex="0"><table><thead><tr><th>Date</th><th>Field</th><th>Value</th><th>Source</th></tr></thead><tbody>${mapped.map(record => `<tr><td>${new Date(record.startTime).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td><td><code>${escapeHtml(record.localField)}</code></td><td>${record.value.toLocaleString()} ${record.unit}</td><td>${escapeHtml(record.source)}</td></tr>`).join('')}</tbody></table></div></details>` : ''}</div></section>
      <section class="station receipt-station" aria-labelledby="receipt-title"><div class="station-number">04</div><div class="station-body"><h2 id="receipt-title">Write the receipt</h2>${mapped.length ? `<p>Record IDs prevent the same source record from being written twice.</p><button class="primary" data-import>Write import receipt</button>` : `<div class="empty-state"><p>No receipt yet.</p><span>Preview the field map at station 03.</span></div>`}${lastReceipt ? `<article class="receipt" aria-label="Latest import receipt"><div><span>Import receipt</span><strong>${lastReceipt.id}</strong></div><dl><div><dt>New records</dt><dd>${lastReceipt.importedCount}</dd></div><div><dt>Repeats skipped</dt><dd>${lastReceipt.duplicateCount}</dd></div><div><dt>Date range</dt><dd>${lastReceipt.dateFrom}<br>${lastReceipt.dateTo}</dd></div><div><dt>Written</dt><dd>${new Date(lastReceipt.createdAt).toLocaleString()}</dd></div></dl><p>${lastReceipt.importedCount === 0 ? 'No records changed. Every record ID was already in the ledger.' : 'The local ledger and encrypted receipt are saved.'}</p></article>` : ''}${logRecords.length ? `<div class="export-row"><button data-csv>Export CSV</button><button data-json>Export JSON</button><span>${logRecords.length} records in this local log</span></div>` : ''}</div></section>
      ${receipts.length ? `<section class="ledger-history" aria-labelledby="history-title"><h2 id="history-title">Receipt history</h2><ol>${receipts.slice().reverse().map(receipt => `<li><span>${new Date(receipt.createdAt).toLocaleDateString()}</span><strong>${receipt.importedCount} new</strong><span>${receipt.duplicateCount} skipped</span></li>`).join('')}</ol></section>` : ''}`;

    host.querySelector('[data-clear-error]')?.addEventListener('click', () => { error = ''; render(); });
    host.querySelector('[data-reload-sample]')?.addEventListener('click', () => { source = sampleRecords; mapped = []; render(); });
    host.querySelector<HTMLInputElement>('[data-file]')?.addEventListener('change', async event => {
      const file = (event.currentTarget as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = file.name.toLowerCase().endsWith('.csv') ? parseCsv(text) : (() => { const data = JSON.parse(text); return Array.isArray(data) ? data : data.records; })();
        source = validateRecords(parsed); mapped = []; error = '';
        const dates = source.map(record => record.startTime.slice(0, 10)).sort();
        dateFrom = dates[0]; dateTo = dates[dates.length - 1]; render();
      } catch (reason) { error = reason instanceof Error ? reason.message : 'Choose a Health Connect JSON or CSV export.'; render(); }
    });
    host.querySelector('[data-connect]')?.addEventListener('click', async () => {
      const status = host.querySelector<HTMLElement>('.native-status')!;
      if (!validRange()) {
        status.textContent = 'Choose an end date that is on or after the start date.';
        return;
      }
      status.textContent = 'Checking Health Connect…';
      try {
        const availability = await HealthConnect.availability();
        if (!availability.available) throw new Error(availability.reason || 'Health Connect is not available on this device.');
        const permission = await HealthConnect.requestPermissions({ recordTypes: selectedTypes });
        const result = await HealthConnect.readRecords({ recordTypes: permission.granted, startTime: new Date(`${dateFrom}T00:00:00`).toISOString(), endTime: new Date(`${dateTo}T23:59:59`).toISOString() });
        source = validateRecords(result.records); mapped = []; status.textContent = `${source.length} records read.`; render();
      } catch (reason) { status.textContent = reason instanceof Error ? `${reason.message} Choose a local export instead.` : 'Health Connect could not be read. Choose a local export instead.'; }
    });
    host.querySelector<HTMLInputElement>('[data-from]')?.addEventListener('change', event => { dateFrom = (event.currentTarget as HTMLInputElement).value; mapped = []; render(); });
    host.querySelector<HTMLInputElement>('[data-to]')?.addEventListener('change', event => { dateTo = (event.currentTarget as HTMLInputElement).value; mapped = []; render(); });
    host.querySelectorAll<HTMLInputElement>('[data-type]').forEach(input => input.addEventListener('change', () => { selectedTypes = [...host.querySelectorAll<HTMLInputElement>('[data-type]:checked')].map(item => item.value as RecordKind); mapped = []; render(); }));
    host.querySelector('[data-save-fields]')?.addEventListener('click', () => {
      host.querySelectorAll<HTMLInputElement>('[data-field-name]').forEach(input => { mapFields[input.dataset.fieldName as RecordKind] = input.value.trim() || MAP_FIELDS[input.dataset.fieldName as RecordKind]; });
      fieldsStorage.setItem(fieldsKey, JSON.stringify(mapFields));
      const status = host.querySelector<HTMLElement>('.field-status'); if (status) status.textContent = demo ? 'Field names saved for this demo session.' : 'Field names saved on this device.';
      mapped = []; 
    });
    host.querySelector('[data-preview]')?.addEventListener('click', () => { mapped = candidates.map(record => ({ ...record, localField: mapFields[record.type] })); render(); host.querySelector('#map-title')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
    host.querySelector('[data-import]')?.addEventListener('click', async () => {
      const seen = new Set(importedIds);
      const fresh = mapped.filter(record => {
        if (seen.has(record.id)) return false;
        seen.add(record.id);
        return true;
      });
      const duplicates = mapped.length - fresh.length;
      const receipt: ImportReceipt = { id: `HDB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(receipts.length + 1).padStart(3, '0')}`, createdAt: new Date().toISOString(), dateFrom, dateTo, sourceCount: mapped.length, importedCount: fresh.length, duplicateCount: duplicates, recordIds: mapped.map(record => record.id), types: selectedTypes };
      importedIds = [...new Set([...importedIds, ...fresh.map(record => record.id)])];
      logRecords = [...logRecords, ...fresh]; receipts = [...receipts, receipt]; lastReceipt = receipt;
      await saveLocalData(demo, { receipts, importedIds, records: logRecords }); render();
    });
    host.querySelector('[data-csv]')?.addEventListener('click', () => {
      const keys: (keyof MappedRecord)[] = ['id', 'type', 'startTime', 'endTime', 'value', 'unit', 'source', 'localField'];
      download('health-data-bridge-log.csv', [keys.join(','), ...logRecords.map(record => keys.map(key => escapeCsv(record[key])).join(','))].join('\n'), 'text/csv');
    });
    host.querySelector('[data-json]')?.addEventListener('click', () => download('health-data-bridge-log.json', JSON.stringify({ exportedAt: new Date().toISOString(), records: logRecords, receipts }, null, 2), 'application/json'));
  };
  render();
}

function setupLicense(): void {
  document.querySelector('[data-show-license]')?.addEventListener('click', () => {
    const form = document.querySelector<HTMLFormElement>('.license-form'); if (form) { form.hidden = false; form.querySelector('input')?.focus(); }
  });
  document.querySelector<HTMLFormElement>('.license-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const input = document.querySelector<HTMLInputElement>('#license-token')!; const status = document.querySelector<HTMLElement>('.form-status')!;
    status.textContent = 'Checking the license…';
    const valid = await verifyLicense(input.value.trim());
    status.textContent = valid ? 'Bridge Plus is active on this device.' : 'This license is not active. Check the token and try again.';
    if (valid) document.querySelector<HTMLElement>('[data-show-license]')!.textContent = 'Bridge Plus is active';
  });
  const licenseButton = document.querySelector<HTMLElement>('[data-show-license]');
  if (cachedUnlock() && licenseButton) licenseButton.textContent = 'Bridge Plus is active';
}

function setupNavigation(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '');
    history.pushState({ scrollY: 0 }, '', link.href);
    renderRoute(0);
  }));
  document.querySelector('[data-reset-demo]')?.addEventListener('click', () => { resetDemo(); mountBridge(true); });
}

function renderRoute(scrollY?: number): void {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const routes: Record<string, () => string> = { '/': landing, '/demo': () => bridgePage(true), '/bridge': () => bridgePage(false), '/privacy': () => legal('privacy'), '/terms': () => legal('terms') };
  app.innerHTML = (routes[path] || notFound)();
  setupNavigation(); setupLicense();
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = `https://health-data-bridge.sociobot.in${path === '/' ? '/' : path}`;
  const updateConnection = () => {
    const toast = document.querySelector<HTMLElement>('.status-toast');
    if (!toast) return;
    toast.hidden = navigator.onLine;
    toast.textContent = navigator.onLine ? '' : 'Offline. Local records and exports still work.';
  };
  updateConnection();
  window.ononline = updateConnection;
  window.onoffline = updateConnection;
  if (path === '/demo') mountBridge(true);
  if (path === '/bridge') mountBridge(false);
  const h1 = document.querySelector<HTMLHeadingElement>('h1');
  routeLive.textContent = h1?.textContent || '';
  if (scrollY !== undefined) requestAnimationFrame(() => {
    h1?.focus({ preventScroll: true });
    window.scrollTo({ top: scrollY, behavior: 'instant' });
  });
}

history.scrollRestoration = 'manual';
if (!history.state) history.replaceState({ scrollY: window.scrollY }, '');
window.addEventListener('popstate', event => renderRoute(Number(event.state?.scrollY) || 0));
renderRoute();

if (returnedLicense) void verifyLicense(returnedLicense).then(valid => {
  const toast = document.querySelector<HTMLElement>('.status-toast');
  if (toast) { toast.hidden = false; toast.textContent = valid ? 'Bridge Plus is active on this device.' : 'This license is not active. Paste a corrected token to try again.'; }
  const licenseButton = document.querySelector<HTMLElement>('[data-show-license]');
  if (valid && licenseButton) licenseButton.textContent = 'Bridge Plus is active';
});

if (!isNativeAndroid && 'serviceWorker' in navigator) window.addEventListener('load', async () => {
  const registration = await navigator.serviceWorker.register('/sw.js');
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        const toast = document.querySelector<HTMLElement>('.status-toast');
        if (toast) { toast.hidden = false; toast.textContent = 'An update is ready. Reload to use it.'; }
      }
    });
  });
});
