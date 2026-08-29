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
  `/downloads/health-data-bridge-debug-v1.0.3.apk` (6,436,507 bytes;
  SHA-256 `def44bb7fcc9d366044a6ecebc9f0a44e34409291caa2ccf76360f7a31a71abe`).
  The landing page displays this exact digest and the download regression
  verifies it in both browser projects.
- Corrected the native Health Connect reader to follow every `pageToken`, so a
  one-month import includes records beyond the first 1,000-record page. The
  Android package regression asserts that pagination remains present.
- Added a compile-ready Android instrumentation test and fixed duplicate
  legacy Kotlin test artifacts in the aggregate Android test configuration.
  `assembleDebugAndroidTest` now succeeds alongside the JVM/native build.
- Kept the browser-only APK out of Capacitor's copied web assets. This prevents
  each new APK from recursively packaging the previous APK. The landing page
  hides the download/checksum from the installed Android app, where it would
  otherwise describe the package that contains it.
- Bumped the web/PWA cache and build identity to v1.0.3. Existing import,
  privacy, encryption, offline, accessibility, and paid-license behavior was
  retained.

## Verification

Executed on 2026-08-29:

```sh
npm ci
npm run build
npm test
npm run android:build
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
- `npm run android:build`: passed with Android SDK API 36 and JDK 21
  (`BUILD SUCCESSFUL`, 204 tasks). It runs Capacitor sync, excludes the
  downloaded APK from native web assets, builds the debug APK, runs JVM tests,
  and assembles the Android instrumentation-test APK.
- Local `verify-url.sh`: HTTP 200, 561 ms load, correct title and `lang=en`,
  one h1/main, no missing alt text or unlabeled buttons, and no console errors.

## Deployment evidence

Static deployment completed on 2026-08-29 to
`https://health-data-bridge.sociobot.in/` from repair commit
`b5692ab88e3bb4d26ea2d3411fd6dc87e58ef702`.

- Live `verify-url.sh` passed: HTTP 200, 891 ms load, title/lang/one h1/main
  present, no missing image alt text or unlabeled buttons, and no console
  errors.
- The local browser suite covered the 390 px demo: it imported 12 new records
  and then 0 new / 12 skipped on a repeat import, with keyboard skip-link
  operation and zero horizontal overflow. This behavior is unchanged in the
  deployed build.
- Live `index.html` references `index-CYD29SJf.js`; the live APK SHA-256 is
  `def44bb7fcc9d366044a6ecebc9f0a44e34409291caa2ccf76360f7a31a71abe`.
- Live hashed JS uses `Cache-Control: public, max-age=31536000, immutable`.
  An unknown route returns HTTP 404. CSP, HSTS, `Referrer-Policy`,
  `X-Content-Type-Options`, and `Permissions-Policy` are present.

## Android runtime evidence

The native project, registration, four read-only Health Connect scopes, fresh
debug APK, JVM tests, and instrumentation-test APK were built and tested. A
true Health Connect provider permission/read/export/repeat-import run could
not be executed in this container: it had no Android device and the downloaded
x86_64 API 35 emulator required 7.37 GB for userdata while only 2.2 GB remained
after installing the SDK/image. This is an environment constraint, not
substituted with a claim of device proof. Before release signing, run the
v1.0.3 APK on a device or an emulator with Health Connect and retain evidence
for grant, denial/unavailable recovery, one-month read (including more than one
page), export, and repeat import.

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
