import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, relative, resolve } from 'node:path';

const source = resolve('dist');
const destination = resolve('dist-native');
await rm(destination, { recursive: true, force: true });

await cp(source, destination, {
  recursive: true,
  filter: path => {
    const pathFromBuild = relative(source, resolve(path));
    return pathFromBuild !== 'downloads'
      && !pathFromBuild.startsWith(`downloads/`)
      && basename(path) !== 'sw.js';
  }
});

const indexPath = resolve(destination, 'index.html');
let nativeHtml = await readFile(indexPath, 'utf8');
nativeHtml = nativeHtml.replace(
  /(<meta name="health-data-bridge-apk-sha256" content=")[^"]*("\s*\/?>)/,
  '$1not-used-in-android$2'
);
await writeFile(indexPath, nativeHtml);

console.log('Prepared dist-native without public APK downloads or a browser service worker.');
