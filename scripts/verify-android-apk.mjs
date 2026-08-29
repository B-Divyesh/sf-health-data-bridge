import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const execFileAsync = promisify(execFile);
const mode = process.argv[2];
if (!['--native', '--published'].includes(mode)) {
  throw new Error('Usage: node scripts/verify-android-apk.mjs --native|--published');
}

const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const nativeApk = resolve('android/app/build/outputs/apk/debug/app-debug.apk');
const publishedApk = resolve(`public/downloads/health-data-bridge-debug-v${version}.apk`);
const apk = mode === '--native' ? nativeApk : publishedApk;
const { stdout } = await execFileAsync('unzip', ['-Z1', apk]);
const entries = stdout.split(/\r?\n/).filter(Boolean);
const embeddedApks = entries.filter(entry => /^assets\/public\/downloads\/.*\.apk$/i.test(entry));

if (embeddedApks.length) {
  throw new Error(`Android APK recursively packages downloadable APKs: ${embeddedApks.join(', ')}`);
}
if (entries.includes('assets/public/sw.js')) {
  throw new Error('Android APK packages a browser service worker even though the native bundle must not register one.');
}

if (mode === '--published') {
  const [nativeBytes, publishedBytes] = await Promise.all([readFile(nativeApk), readFile(publishedApk)]);
  const nativeHash = createHash('sha256').update(nativeBytes).digest('hex');
  const publishedHash = createHash('sha256').update(publishedBytes).digest('hex');
  if (nativeHash !== publishedHash) {
    throw new Error(`Published APK hash ${publishedHash} does not match the clean native build ${nativeHash}.`);
  }
  console.log(`Verified published APK ${version}: ${publishedHash}; no recursive APK or service worker assets.`);
} else {
  console.log('Verified native APK has no recursive downloadable APK or browser service worker assets.');
}
