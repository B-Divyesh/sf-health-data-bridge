import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, rm, readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const version = packageJson.version;
const source = resolve('android/app/build/outputs/apk/debug/app-debug.apk');
const downloads = resolve('public/downloads');
const filename = `health-data-bridge-debug-v${version}.apk`;
const destination = resolve(downloads, filename);

await mkdir(downloads, { recursive: true });
await copyFile(source, destination);

for (const entry of await readdir(downloads, { withFileTypes: true })) {
  if (entry.isFile() && /^health-data-bridge-debug-v\d+\.\d+\.\d+\.apk$/.test(entry.name) && entry.name !== filename) {
    await rm(resolve(downloads, entry.name));
  }
}

const digest = createHash('sha256').update(await readFile(destination)).digest('hex');
console.log(`Published ${basename(destination)} (${digest}). Run npm run build to stamp the static landing page.`);
