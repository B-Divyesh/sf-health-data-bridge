import { createHash } from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
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

function payloadEntries(archiveEntries) {
  return archiveEntries
    .filter(entry => !/^META-INF\/(?:MANIFEST\.MF|.*\.(?:SF|RSA|DSA|EC))$/i.test(entry))
    .sort();
}

async function payloadDigest(path, archiveEntries) {
  const digest = createHash('sha256');
  for (const entry of payloadEntries(archiveEntries)) {
    digest.update(entry).update('\0');
    const unzip = spawn('unzip', ['-p', path, entry], { stdio: ['ignore', 'pipe', 'pipe'] });
    const completion = once(unzip, 'close');
    let stderr = '';
    unzip.stderr.setEncoding('utf8');
    unzip.stderr.on('data', chunk => { stderr += chunk; });
    for await (const chunk of unzip.stdout) digest.update(chunk);
    const [code] = await completion;
    if (code !== 0) throw new Error(`Could not inspect ${entry} in ${path}: ${stderr.trim()}`);
    digest.update('\0');
  }
  return digest.digest('hex');
}

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
  const { stdout: nativeListing } = await execFileAsync('unzip', ['-Z1', nativeApk]);
  const nativeEntries = nativeListing.split(/\r?\n/).filter(Boolean);
  if (payloadEntries(nativeEntries).join('\n') !== payloadEntries(entries).join('\n')) {
    throw new Error('Published APK entries do not match the clean native build.');
  }
  const [nativePayload, publishedPayload] = await Promise.all([
    payloadDigest(nativeApk, nativeEntries),
    payloadDigest(publishedApk, entries)
  ]);
  if (nativePayload !== publishedPayload) {
    throw new Error(`Published APK payload ${publishedPayload} does not match clean native payload ${nativePayload}.`);
  }
  const signatureNote = nativeHash === publishedHash ? 'including signature' : 'with an independently generated debug signature';
  console.log(`Verified published APK ${version}: ${publishedHash}; payload ${publishedPayload} matches ${signatureNote}.`);
} else {
  console.log('Verified native APK has no recursive downloadable APK or browser service worker assets.');
}
