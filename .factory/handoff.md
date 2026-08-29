# Health Data Bridge v1.0.4 repair handoff

## Result

This repair addresses every release-blocking software and deployment finding
from `.factory/verification-3.md` for candidate
`c15992047de6a0eeebf92dbe14ba9e76cff97e3a`. The repaired source/artifact
commit is `07d9eb2d2a5f080937b339f281d7757a9fcd54f7`; its production static
bundle is live at `https://health-data-bridge.sociobot.in/`.

### Repairs

- Published a fresh 6,438,370-byte Android debug APK,
  `health-data-bridge-debug-v1.0.4.apk`, SHA-256
  `dfc01a340eff6fac40d4bfb617b1bb8b415b990b65088e0ad60a646e820b7ff3`.
  The native build uses `dist-native/`, which excludes every public APK and
  browser service worker. `android:verify` rejects nested APKs/service workers
  and requires the published APK bytes to equal the clean native build.
- Reworked Health Connect reading through a unit-tested paging helper. The
  2,001-record regression requests all three pages and fails on a repeated
  provider page token rather than silently truncating or looping.
- Added Android 11–13 Health Connect provider visibility and corrected the
  instrumentation assertion to the real application id
  `in.sociobot.healthdatabridge`.
- The finalized service worker now has a version derived from the final HTML
  shell. The browser regression starts with an old worker, updates it to the
  published worker, and proves the old cache is removed.
- Added declared `batch-duplicate-safe` and `date-range-map` claims, a
  two-way tag/manifest check over every browser spec, visible reversed-range
  recovery, and the exact regression for it.
- Expanded footer links to a 44×44 px target at 390 px, with a regression
  that checks every visible interactive control and 200% text reflow.

## Verification

Executed on 2026-08-29 UTC:

```sh
npm ci
npm test
npm run build
ANDROID_HOME=/tmp/hdb-android-sdk.EhvQpd \
ANDROID_SDK_ROOT=/tmp/hdb-android-sdk.EhvQpd \
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
  npm run android:publish
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 /tmp/health-data-bridge-local-verify.Zec1cI
```

- `npm ci`: 113 packages installed; npm reported zero vulnerabilities.
- `npm test`: 77 passed, one intentional desktop-only mobile-layout skip.
  Chromium desktop and Pixel 5/390 px cover keyboard skip/Enter, focus,
  light/dark axe serious/critical findings, 44 px targets, 200% reflow,
  local-file errors, privacy request capture, offline reload, worker update,
  response policy, CSV quoting, duplicate safety, encrypted persistence, and
  SPA scroll restoration.
- Every exact command declared by all 21 entries in `.factory/claims.json` was
  also run separately; each passed in both browser projects.
- `npm run build`: TypeScript and Vite passed; `dist/` was produced. Initial
  JS is 35,461 bytes raw / 12,600 bytes gzip and CSS is 18,469 bytes raw /
  5,140 bytes gzip. The largest hero image is 145,790 bytes.
- `npm run android:publish`: Capacitor sync, clean debug assembly, debug and
  release JVM tests, and debug instrumentation-test APK assembly passed. The
  publish verification confirmed the v1.0.4 download matches the native APK
  byte-for-byte and contains no recursive APK or browser worker.
- Local `verify-url.sh`: HTTP 200, 549 ms load, correct title and `lang=en`,
  one h1/main, no missing image alt text or unlabeled buttons, and no console
  errors.
- Lighthouse 12.6.0 was attempted with the installed Playwright Chromium, but
  that browser target crashed during the full-page screenshot stage in this
  6 GB container. The build budgets above and the browser performance-safe
  regression suite passed; rerun Lighthouse in a roomier CI worker before a
  signed-store release.

## Deployment and live evidence

Static deployment completed on 2026-08-29 using
`/opt/fleet/lib/deploy-static.sh health-data-bridge dist`:

- Azure Static Web Apps deployment id:
  `d26a8028-74e8-4e83-a553-ad2620b613bd`.
- Live `verify-url.sh` passed: HTTP 200, 673 ms load, title/lang/one h1/main,
  no missing alt text or unlabeled buttons, and zero console errors.
- Exact SHA-256 matches were confirmed between local `dist/` and live files:
  `index.html` `dd974a00bd701226cfd919d7bac25d2219b5b052ead202085073289f2dc75d2e`;
  `index-zcl0-amg.js` `3c89b1868cf2cfd59b55c2d715a5933718f7e001282080771923974750323283`;
  `index-DIUfMUTi.css` `4c94bb4a259a796406fcb0a39c8d9258d6a1af93c3c64b7d17159e7e9966b3a9`;
  `sw.js` `9407980ccb73b34dd890f3ba64b7f3d030d2faba48cd2237ef5e80b6013ee68d`;
  and the APK digest listed above.
- Live `/`, `/demo`, `/bridge`, `/privacy`, and `/terms` return 200; a missing
  route returns 404. Hashed assets are immutable for one year. HTML has the
  intended 30-second revalidation policy and CSP, HSTS, `Referrer-Policy`,
  `X-Content-Type-Options`, and `Permissions-Policy` headers.
- A live Pixel 5-sized flow imported 12 sample records, then 0 new / 12
  skipped on repeat; it had zero horizontal overflow, zero console errors,
  zero off-origin requests, and reloaded the 12-record demo while offline.

## Android runtime note

The test APK and its instrumentation APK compile, and the native paging path
is JVM-tested past 1,000 records. This container has no attached Android
device; its available disk is below the emulator image/userdata requirement,
so a real Health Connect permission/provider read cannot be honestly claimed
here. Before signed distribution, run the v1.0.4 APK on an Android device (or
Health Connect-capable emulator) and retain evidence for grant, denial or
unavailable recovery, a multi-page month read, export, and repeat import.

## How to run

```sh
npm ci
npm test
npm run build
npm run cap:sync
cd android && ./gradlew assembleDebug test
```

The demo is `/demo`; static deployment output is `dist/`. The artifact and
deployment class remain a static PWA with a Capacitor Android project and a
debug APK for direct Android testing.
