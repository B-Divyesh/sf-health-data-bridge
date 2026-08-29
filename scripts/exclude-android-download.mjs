import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

// The APK download belongs to the static landing page. Embedding that file in
// the Capacitor web assets recursively packages each APK inside the next one.
const embeddedDownloads = resolve('android/app/src/main/assets/public/downloads');
const entries = await readdir(embeddedDownloads, { withFileTypes: true }).catch(() => []);
await Promise.all(entries
  .filter(entry => entry.isFile() && /^health-data-bridge-debug-v\d+\.\d+\.\d+\.apk$/.test(entry.name))
  .map(entry => rm(resolve(embeddedDownloads, entry.name), { force: true })));
