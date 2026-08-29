import { createHash } from 'node:crypto';
import { access, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const version = packageJson.version;
const apk = resolve(root, `public/downloads/health-data-bridge-debug-v${version}.apk`);
const indexPath = resolve(root, 'dist/index.html');
const workerTemplatePath = resolve(root, 'public/sw.js');
const workerPath = resolve(root, 'dist/sw.js');
const checksumMarker = '__HDB_APK_SHA256__';
const cacheMarker = '__HDB_CACHE_VERSION__';

let apkChecksum = '';
try {
  await access(apk);
  apkChecksum = createHash('sha256').update(await readFile(apk)).digest('hex');
} catch {
  // A clean web-only build can happen before the Android artifact is made.
  // The landing page states that the checksum is unpublished in that case.
}

let html = await readFile(indexPath, 'utf8');
if (!html.includes(checksumMarker)) {
  throw new Error(`Expected ${checksumMarker} in ${indexPath}; Vite must emit the checksum marker before finalization.`);
}
html = html.replace(checksumMarker, apkChecksum || 'unpublished');
await writeFile(indexPath, html);

const cacheVersion = `hdb-v${version}-${createHash('sha256').update(html).digest('hex').slice(0, 16)}`;
const workerTemplate = await readFile(workerTemplatePath, 'utf8');
if (!workerTemplate.includes(cacheMarker)) {
  throw new Error(`Expected ${cacheMarker} in ${workerTemplatePath}; refusing to ship an unversioned worker.`);
}
await writeFile(workerPath, workerTemplate.replace(cacheMarker, cacheVersion));

console.log(`Finalized web shell with ${apkChecksum ? 'published APK checksum' : 'unpublished APK checksum'} and worker ${cacheVersion}.`);
