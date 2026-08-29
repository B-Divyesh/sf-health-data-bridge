# Health Data Bridge v1.0.3 repair handoff

## Result

This repair resolves the release-blocking claims-inventory findings recorded in
`.factory/verification-2.md` for candidate
`4d4b2be1dc071d4520c263b947aa9639f1524704`.

- Added declared, observable regressions for core-free import/export, no
  account or cloud history, no provider sharing, paused new sales, and the
  displayed APK SHA-256. The checksum test downloads the actual package and
  hashes its bytes.
- Added claim coverage for the visible medical/calorie and Apple Health scope
  limits, so the copy audit has no unlisted visitor-facing boundaries.
- Added a manifest-meta regression that fails if any claim lacks exactly one
  `@claim:<id>` test tag.
- Built and shipped a fresh debug APK at
  `/downloads/health-data-bridge-debug-v1.0.3.apk` (18,565,836 bytes;
  SHA-256 `c24a465aac84c98a070d5ebee3e40c287c983f9d1efa35d85ac5049588d40acd`).
  The landing page displays this exact digest and the download regression
  verifies it in both browser projects.
- Bumped the web/PWA cache and build identity to v1.0.3. Existing import,
  privacy, encryption, offline, accessibility, and paid-license behavior was
  retained.

## Verification

Executed on 2026-08-29:

```sh
npm ci
npm run build
npm test
npm run cap:sync
cd android
ANDROID_HOME=/tmp/hdb-android-sdk ANDROID_SDK_ROOT=/tmp/hdb-android-sdk \
  JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew --no-daemon assembleDebug test
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 /tmp/health-data-bridge-verify
```

- `npm ci`: 113 packages, 0 reported vulnerabilities.
- `npm run build`: passed; `dist/` produced. Initial JS is 12.43 KB gzip and
  CSS is 5.10 KB gzip.
- `npm test`: 73 passed, 1 intentional desktop-only mobile-layout skip. Both
  desktop Chromium and Pixel 5 / 390 px ran. Coverage includes keyboard skip
  link and Enter activation, light/dark axe scans, 44 px targets and 200%
  reflow, privacy request interception, offline reload, PWA cache update
  behavior, response-policy configuration, local file recovery, and Android
  package assertions.
- Every exact command in `.factory/claims.json` was subsequently executed
  individually and passed in both browser projects. There are 19 declared
  claims, each with one tag enforced by test.
- `npm run cap:sync`: passed. Android build and JVM unit suite passed with
  API 36 build tools and JDK 21 (`BUILD SUCCESSFUL`, 150 tasks).
- Local `verify-url.sh`: HTTP 200, 574 ms load, correct title and `lang=en`,
  one h1/main, no missing alt text or unlabeled buttons, and no console errors.

## Android runtime evidence

The native project, registration, four read-only Health Connect scopes, and
fresh debug APK were built and tested. A true Health Connect provider
permission/read/export/repeat-import run could not be executed in this
container: it had no Android device and the downloaded x86_64 API 35 emulator
required 7.37 GB for userdata while only 2.2 GB remained after installing the
SDK/image. This is an environment constraint, not substituted with a claim of
device proof. Before release signing, run the v1.0.3 APK on a device or an
emulator with Health Connect and retain evidence for grant, denial/unavailable
recovery, one-month read, export, and repeat import.

## How to run

```sh
npm ci
npm run dev
npm test
npm run build
npm run cap:sync
cd android && ./gradlew assembleDebug test
```

The demo is `/demo`; static output is `dist/`. The deployment class remains
static PWA with a Capacitor Android project and debug APK.
