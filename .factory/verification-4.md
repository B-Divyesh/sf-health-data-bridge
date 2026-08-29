# Independent product verification 4 — Health Data Bridge

## Verdict

**FAIL — do not accept or release candidate
`cd13ad7cee7c6a9b59559f1c84e2bf2d633eeedc`.**

The earlier deployment mismatch is resolved: the live HTML, JavaScript, CSS,
service worker, and downloadable APK are byte-for-byte identical to this
candidate's checked-in production inputs/output. The candidate still fails the
real Android job and test contract. Live date filtering drops valid records at
local-day boundaries outside UTC, and the compiled instrumentation suite still
contains a template assertion that is guaranteed to fail against the real app
package.

- Tested commit: `cd13ad7cee7c6a9b59559f1c84e2bf2d633eeedc`
- Tested URL: `https://health-data-bridge.sociobot.in/`
- Verification date: 2026-08-29 UTC
- Browser: Playwright Chromium 1.58.2
- Viewports: 1440×900 desktop and 390×844 mobile

## Mandatory first-read gate

PASS. In a fresh context, before any interaction, both desktop and mobile show:

- What it does: “Map Health Connect data to your log.”
- Who it is for: Android loggers who need activity and weight records without
  sending their history to another service.
- What to do first: “Try it with sample data,” followed by “Next, preview 12
  records and their field map.”
- One-click demo: the action opens `/demo` with 12 realistic records already
  loaded.

Evidence:

- `.factory/qa-evidence/first-read-desktop.png`
- `.factory/qa-evidence/first-read-mobile.png`
- HTTP 200, one visible h1, and no console/page errors in either context.

## Claim-first results

`.factory/claims.json` exists and contains 21 unique entries. After the required
`npm ci`, every exact `test` command was run separately against the demo entry
point. The combined independent rerun was `npm test -- --grep '@claim:'` and
passed all 42 configured desktop/mobile test instances in 1.2 minutes.

| Claim | Exact command | Result |
|---|---|---|
| `duplicate-safe` | `npm test -- --grep @claim:duplicate-safe` | PASS, 2/2 |
| `batch-duplicate-safe` | `npm test -- --grep @claim:batch-duplicate-safe` | PASS, 2/2 |
| `date-range-map` | `npm test -- --grep @claim:date-range-map` | PASS, 2/2; boundary coverage is defective (finding below) |
| `csv-export` | `npm test -- --grep @claim:csv-export` | PASS, 2/2 |
| `json-export` | `npm test -- --grep @claim:json-export` | PASS, 2/2 |
| `local-only` | `npm test -- --grep @claim:local-only` | PASS, 2/2 |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS, 2/2 |
| `encrypted-storage` | `npm test -- --grep @claim:encrypted-storage` | PASS, 2/2 |
| `paid-custom-fields` | `npm test -- --grep @claim:paid-custom-fields` | PASS, 2/2 |
| `demo-isolation` | `npm test -- --grep @claim:demo-isolation` | PASS, 2/2 |
| `four-station-flow` | `npm test -- --grep @claim:four-station-flow` | PASS, 2/2 |
| `local-file-import` | `npm test -- --grep @claim:local-file-import` | PASS, 2/2 |
| `narrow-health-permissions` | `npm test -- --grep @claim:narrow-health-permissions` | PASS, 2/2 |
| `android-native-package` | `npm test -- --grep @claim:android-native-package` | PASS, 2/2 |
| `free-core-flow` | `npm test -- --grep @claim:free-core-flow` | PASS, 2/2 |
| `no-account-cloud-history` | `npm test -- --grep @claim:no-account-cloud-history` | PASS, 2/2 |
| `no-provider-sharing` | `npm test -- --grep @claim:no-provider-sharing` | PASS, 2/2 |
| `sales-paused` | `npm test -- --grep @claim:sales-paused` | PASS, 2/2 |
| `apk-checksum` | `npm test -- --grep @claim:apk-checksum` | PASS, 2/2 |
| `no-medical-calculator` | `npm test -- --grep @claim:no-medical-calculator` | PASS, 2/2 |
| `no-apple-health-import` | `npm test -- --grep @claim:no-apple-health-import` | PASS, 2/2 |

The claim-tag inventory test also passed. Its implementation compares the
manifest with tags in test source; it does not independently enumerate rendered
marketing copy. Manual copy review found the important visitor claims represented
in the manifest.

## Release-blocking findings

### High — local calendar date filtering drops valid Health Connect records

`src/main.ts:184` filters with `record.startTime.slice(0, 10)` and compares that
UTC date string to the user's local date inputs. Native records are emitted as
UTC instants by `HealthConnectBridgePlugin.kt`. This is wrong around midnight
for every non-UTC timezone.

Fresh live reproductions:

- `America/Los_Angeles`: `2026-08-27T06:30:00Z` displays locally as 26 August
  23:30. Selecting 26 August produces “0 records” and disables preview.
- `Asia/Kolkata`: `2026-08-21T19:00:00Z` displays locally as 22 August 00:30.
  Selecting 22 August likewise produces “0 records” and disables preview.

The normal UTC claim test passes but does not cover timezone boundaries. A
one-month Health Connect import can therefore omit legitimate activity or
weight records, violating the visible date-range claim and core job.

### High — the on-device instrumentation suite contains a guaranteed failure

`android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java:24`
asserts that the target context package is `com.getcapacitor.app`. The compiled
test APK explicitly targets `in.sociobot.healthdatabridge`; the app APK and the
new smoke test use that same real ID. Both test classes are present in
`app-debug-androidTest.apk`, so running the suite on a device will fail the
legacy test.

This directly contradicts the handoff statement that the instrumentation
assertion was corrected and prevents claiming that all integration tests pass.

### High — the real Android Health Connect job remains unverified on a device

The fresh APK, native bridge, four read-only permissions, provider query, and
2,001-record paging helper were independently compiled/inspected. There is no
attached Android device or Health Connect-capable emulator, so permission grant,
permission denial, provider unavailable/update-required, a real month read,
export, and repeat import could not be run end to end. The current instrumented
smoke tests only inspect package launchability and the provider status enum;
they do not exercise any of those core paths. Because this artifact's primary
job is native Health Connect import, browser sample behavior alone is not enough
for acceptance.

## Other findings

### Medium — published-APK byte verification is not reproducible in a clean clone

A fresh debug build produced SHA-256
`732532cd04537e01edc57dccab8d60e2872c83cab1e9acde9528bcbb7a157faa`;
the published/live APK is
`dfc01a340eff6fac40d4bfb617b1bb8b415b990b65088e0ad60a646e820b7ff3`.
`npm run android:verify -- --published` therefore exits 1 in a clean verifier
environment. All 463 ZIP entries are byte-identical and both APKs have valid v2
signatures; only the generated debug signing certificates differ. The check and
handoff's “clean byte-for-byte” promise depend on retaining the builder's
ephemeral debug keystore. Use a stable non-secret verification strategy for
payload identity, or provide the controlled signing identity at the release
boundary.

### Medium — the specified one-time purchase is unavailable

The product is honest that new Bridge Plus purchases are paused, and it exposes
no broken checkout link. However, the acceptance brief specifies one-time
monetization and the paid-unlock contract requires an exact price and buy path.
The live site provides neither; only existing license restoration works. This is
an explicit scope gap rather than a deceptive failure.

### Low — Twitter metadata is incomplete

The document has `twitter:card` but lacks `twitter:title`,
`twitter:description`, and `twitter:image`, contrary to the supplied
site-structure contract. Open Graph metadata and the 1200×630 social image are
present.

## Clean checkout and Android build evidence

- `npm ci`: PASS; 113 packages installed, zero vulnerabilities.
- `npm test`: PASS; 77 passed and one intentional desktop-only mobile-layout
  skip (78 configured instances).
- `npm run build`: PASS; TypeScript `--noEmit`, Vite production build, and
  finalization all passed; `dist/index.html` exists.
- No separate web lint command exists.
- Fresh Android toolchain used JDK 21, platform 36, and build-tools 35.0.0.
- `:app:assembleDebug`: PASS; fresh APK produced.
- Android debug and release JVM tests: PASS, two paging tests in each variant,
  including 2,001 records and repeated-token rejection.
- `:app:assembleDebugAndroidTest`: PASS; app test APK produced.
- `:app:lintDebug`: PASS (`BUILD SUCCESSFUL`).
- The combined `npm run android:build` hit a Gradle-daemon memory kill after
  app assembly/JVM tests; rerunning targeted tasks with one worker completed the
  app outputs and lint. No product source was changed.
- No device/emulator was available, so `connectedAndroidTest` was not run.

Published APK inspection:

- Package `in.sociobot.healthdatabridge`, version 1.0.4 (code 3), min SDK 26,
  target SDK 35, compile SDK 36.
- Launch activity: `in.sociobot.healthdatabridge.MainActivity`.
- Exactly four Health Connect data permissions: read steps, active calories,
  exercise, and weight; no health write scope.
- `allowBackup=false`, cleartext traffic disabled, Android 11–13 provider query
  present.
- Native `HealthConnectBridge` marker present; no nested APK and no browser
  service worker packaged.

## Deployment identity and headers

Fresh `npm run build` output and live resources match exactly:

| Resource | SHA-256 |
|---|---|
| `index.html` | `dd974a00bd701226cfd919d7bac25d2219b5b052ead202085073289f2dc75d2e` |
| `index-zcl0-amg.js` | `3c89b1868cf2cfd59b55c2d715a5933718f7e001282080771923974750323283` |
| `index-DIUfMUTi.css` | `4c94bb4a259a796406fcb0a39c8d9258d6a1af93c3c64b7d17159e7e9966b3a9` |
| `sw.js` | `9407980ccb73b34dd890f3ba64b7f3d030d2faba48cd2237ef5e80b6013ee68d` |
| published APK | `dfc01a340eff6fac40d4bfb617b1bb8b415b990b65088e0ad60a646e820b7ff3` |

`/`, `/demo`, `/bridge`, `/privacy`, and `/terms` return 200. An unknown path
returns the designed 404 with a way home. Hashed assets use one-year immutable
caching; HTML, service worker, manifest, and APK revalidate after 30 seconds.
Live responses include HSTS, CSP with `frame-ancestors 'none'`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, and
`Permissions-Policy`.

## Browser product exercise

PASS for the web/PWA surface, except for the timezone defect above:

- Demo banner is persistent and states “sample data, nothing is saved,” with
  Reset and Start for real.
- A two-day range yields 5 records; a reversed range announces exactly how to
  recover.
- First 12-record import reports 12 new / 0 skipped; repeat reports 0 new / 12
  skipped.
- CSV has the expected header and 12 data rows; JSON has 12 records and two
  receipts.
- Demo writes only `demo:bridge-state` in session storage and creates no real
  encrypted ledger.
- A real 31-day import completed in approximately 2.4 seconds, including a
  zero-step boundary value; a waited repeat reported 0 new / 31 skipped.
- Real records persist across reload in an AES-GCM envelope with no plaintext
  record IDs.
- Malformed JSON, negative values, wrong units, invalid dates, backwards
  intervals, and missing CSV columns all produce an alert plus “Choose another
  file.”
- Browser use of “Read Health Connect” explains that the plugin is unavailable
  and directs the user to a local export.

Evidence: `.factory/qa-evidence/live-demo-completed-mobile.png`.

## Privacy, endpoint allowance, and authentication

- The complete live demo/import/export/offline flow requested only
  `https://health-data-bridge.sociobot.in`; no analytics, trackers, external
  fonts, or record uploads occurred.
- License restoration issued one GET to
  `https://api.sociobot.in/api/v1/products/health-data-bridge/verify` with only
  the entered license token and no request body. The invalid-token state gave a
  clear recovery message.
- From one client, license verification returned 200 for requests 1–30 and 429
  for requests 31–35. The 429 response included `Retry-After: 2` and
  `X-RateLimit-After: 2`. Observed allowance: **30 requests per window**.
- There is no product sign-in, so the Microsoft Entra authority requirement is
  not applicable.

## Accessibility, mobile, and motion

- Factory `verify-url.sh` passed locally (600 ms) and live (1,182 ms): correct
  title/lang, one h1/main, alt text, named buttons, and zero load errors.
- Independent live axe runs on `/`, `/demo`, `/bridge`, `/privacy`, and
  `/terms`, at desktop/mobile and light/dark, found zero serious/critical
  violations and zero console/page errors.
- The live 404 returns 404, has `lang=en`, one h1/main, a return link, and zero
  serious/critical axe findings. Chromium logs the expected failed-document
  resource message for the intentional 404.
- Keyboard: first Tab focuses the skip link; Enter moves focus to `main`; Enter
  on Preview exposes the receipt action. Focus is a visible 3 px clay outline
  with 4 px offset.
- All 21 visible demo controls measured at least 44 px high at 390 px. There is
  no horizontal overflow at normal size or simulated 200% text.
- With reduced motion, transition and animation duration are 0.01 ms and scroll
  behavior is automatic.

Screenshots and URL-verifier JSON are under `.factory/qa-evidence/`.

## PWA and performance

- Live worker controls `/demo`; cache name is
  `hdb-v1.0.4-dd974a00bd701226`.
- After one online visit, offline reload returns 200, retains the 12-record
  sample, and displays the offline status. The local cross-version worker test
  proves the old shell cache is removed on update.
- Manifest has standalone display, a versioned `/bridge?v=1.0.4` start URL,
  192/512 icons, and a maskable icon.
- Initial JavaScript: 35,461 bytes raw / 12,600 bytes gzip.
- CSS: 18,469 bytes raw / 5,140 bytes gzip.
- Mobile hero: 46,856 bytes; largest hero source: 145,790 bytes; no font files.
- Lighthouse 12.8.2 mobile: performance 92, accessibility 100, best practices
  100, SEO 100; LCP 1,725 ms, FCP 981 ms, CLS 0, transferred 174,998 bytes.
  Lab INP was unavailable; TBT was 342 ms.

Evidence: `.factory/qa-evidence/lighthouse-mobile.json`.

## Required next steps

1. Convert Health Connect instants to the user's local calendar date (or filter
   consistently by the already-computed local UTC boundaries) and add claim
   tests in at least one positive and one negative UTC offset.
2. Delete or correct the legacy `ExampleInstrumentedTest`, then run the complete
   instrumentation suite on a Health Connect-capable Android device/emulator.
3. Exercise grant, denial, unavailable/update-required, paginated month import,
   export, persistence, and repeat-import behavior on that device.
4. Make published-APK verification independent of ephemeral debug signing, or
   perform it under a controlled release signing identity.
5. Register/restore the one-time purchase path with an exact price, or document
   approval to ship without monetization.
6. Add the missing Twitter title, description, and image metadata.
