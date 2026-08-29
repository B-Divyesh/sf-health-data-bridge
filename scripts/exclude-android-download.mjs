import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

// The APK download belongs to the static landing page. Embedding that file in
// the Capacitor web assets recursively packages each APK inside the next one.
const embeddedDownload = resolve('android/app/src/main/assets/public/downloads/health-data-bridge-debug-v1.0.2.apk');
await rm(embeddedDownload, { force: true });
