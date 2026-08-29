# Independent product verification 3 — FAIL

Verified on 2026-08-29 UTC.

- Candidate: `c15992047de6a0eeebf92dbe14ba9e76cff97e3a`
- Live URL: `https://health-data-bridge.sociobot.in/`
- Work order: `health-data-bridge-verify-3`
- Result: **FAIL — do not accept or release this candidate**

The mandatory claims commands and cold first-read gate pass. The candidate
still fails because the live deployment is a different commit, its Android
artifact cannot be reproduced without recursively embedding an APK, the
native reader silently stops after the first 1,000 records of each type, the
available Android instrumentation test has a guaranteed package-name failure,
and the PWA cannot update clients from this candidate to the currently
deployed build. The claims inventory is also incomplete.

## Mandatory claims-first gate

I started from a clean, detached checkout of the exact candidate, ran
`npm ci`, and then ran every `test` command in `.factory/claims.json`
separately before broader QA. The manifest exists and contains 19 entries.

| Claim | Exact command | Result |
| --- | --- | --- |
| `duplicate-safe` | `npm test -- --grep @claim:duplicate-safe` | PASS, 2/2 |
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

Passing these commands does not override the incomplete claims inventory
finding below.

## Cold first-read gate

**PASS** at desktop 1440×900 and mobile 390×844.

- What it does: “Map Health Connect data to your log.”
- Who it is for: Android loggers who need activity and weight records without
  sending their history to another service.
- What to click first: `Try it with sample data` is visible without scrolling
  on both sizes. The adjacent sentence says the next screen previews 12
  records and their field map.
- One click opens `/demo`, which already contains 12 records and shows the
  persistent “Demo — sample data, nothing is saved” banner, `Reset demo`, and
  `Start for real`.
- A normal cold load returned HTTP 200 with no console or page error. An
  earlier diagnostic context that deliberately blocked service workers caused
  a registration-stub error; a normal fresh context and the factory verifier
  both disproved it as a product-load defect.

## Release-blocking findings

### High — the live deployment is not candidate `c159920`

Fresh candidate builds and live downloads have different bytes:

| Artifact | Candidate | Live |
| --- | --- | --- |
| `index.html` SHA-256 | `035874e32ff8c13278d63fe3b311072993f21f1474b6da9003072a6222419b3c` | `97a743c4d0537892170f004a0c9238a0110d050c0f727a74e834490ed2d4be71` |
| JavaScript SHA-256 | `852ae1ab8a31972bdbb9700bc9fcc1d2bbcd24dfa842f3b9dba296a60df5f561` (`index-DsVzgRtz.js`) | `3818ecbdd765fe37a7ae368f0d8882061efcd9df89b8e62837f80a9f70a08f04` (`index-CYD29SJf.js`) |
| CSS SHA-256 | `e64f79b346430f73020d839b0a9425940d188616798a1c85c6eaaea634a15641` | same |
| APK | 18,565,836 bytes, `c24a465aac84c98a070d5ebee3e40c287c983f9d1efa35d85ac5049588d40acd` | 6,436,507 bytes, `def44bb7fcc9d366044a6ecebc9f0a44e34409291caa2ccf76360f7a31a71abe` |

A clean temporary build of `origin/main` at
`42ddf7e05e6a01b6ab11a6e39dc92bdba50c72f9` produced exact matches for the
live HTML, JavaScript, CSS, and APK. Therefore the deployed functional results
in this report describe a later repair, not the requested candidate.

### High — the candidate Android package is recursive and not reproducible

The candidate's `cap:sync` copies the public APK download into Capacitor's
native web assets. Independent evidence:

- The checked-in 18,565,836-byte v1.0.3 APK contains
  `assets/public/downloads/health-data-bridge-debug-v1.0.2.apk`, itself
  12,533,154 bytes.
- Running candidate `npm run cap:sync`, then a clean `:app:assembleDebug`,
  produced a 24,631,600-byte APK with SHA-256
  `7e45f951098653b94a3af1dff00e56aca8e3a6d28a99ff32c252626c542125f3`.
- That rebuilt APK contains the entire checked-in 18,565,836-byte v1.0.3 APK
  at `assets/public/downloads/health-data-bridge-debug-v1.0.3.apk`.
- The checked-in APK's packaged web JavaScript is `index-DqJCJHzF.js`, while
  a clean candidate build produces `index-DsVzgRtz.js`.

The displayed checksum test only hashes the prebuilt download. It does not
show that the download came from the tested source, and a clean build proves
that it did not.

### High — native Health Connect reads silently stop after 1,000 records

Candidate `HealthConnectBridgePlugin.kt` makes one `ReadRecordsRequest` per
record type and immediately returns `.records`; it never reads the response
`pageToken`. Independent bytecode inspection of the resolved Health Connect
1.1.0 dependency shows the request's default `pageSize` is 1,000. A one-month
range with more than 1,000 records of any selected type is therefore silently
truncated. This violates the researched job of importing the chosen range and
can yield incomplete CSV/JSON without warning.

### High — Android compatibility and test coverage do not prove the core job

- The merged manifest has no `<queries>` entry for
  `com.google.android.apps.healthdata`. On Android 11–13, the resolved SDK
  checks this package and its bindable service through `PackageManager`;
  package visibility can therefore make an installed Health Connect provider
  appear unavailable.
- The only candidate instrumentation test asserts that the target package is
  `com.getcapacitor.app`. The assembled test APK explicitly targets
  `in.sociobot.healthdatabridge`, so this test will fail when run on a device.
- The only JVM test is the template assertion `4 == 2 + 2`. There is no native
  test of availability, permission grant/denial, pagination, record mapping,
  or Health Connect recovery.

The native app, JVM tests, and instrumentation-test APK compile. There was no
Android device in the container, so a real provider grant/read/export/repeat
run could not be performed. Static source inspection is not accepted as an
end-to-end substitute for this Android product's core job.

### High — the deployed PWA cannot update clients from this candidate

Candidate `c159920` and deployed `origin/main` have different HTML/JavaScript
but byte-identical `sw.js` files (SHA-256
`35033e9f4152179596056938f26397e2972faf259e49335d8951640d2179b6a8`).
Both use cache name `hdb-v1.0.3`.

The worker serves cached navigations before the network. Because the worker
script did not change, an existing candidate client receives no
`updatefound`, no new cache is installed, and reload continues to serve the
candidate HTML/assets. A fresh live update check showed an activated worker
with no installing or waiting worker. An affected user must clear site data or
otherwise unregister the worker to recover.

### High — the mandatory claims inventory is incomplete

The bridge visibly says “Record IDs prevent the same source record from being
written twice.” Its same-batch regression is tagged
`@claim:batch-duplicate-safe`, but `batch-duplicate-safe` is absent from
`.factory/claims.json`. The manifest meta-test checks only that every declared
ID has a tag; it does not reject undeclared tags or claims.

The landing page also says users can pick dates and inspect the selected map,
but no declared claim tests date filtering. This matters because the invalid
range behavior below is not covered. The claims contract requires every
visitor claim to be listed with its exact sandbox command; an undeclared claim
is release-blocking even when the full suite happens to run an extra tagged
test.

## Other defects

### Medium — reversed date ranges fail silently

On the live demo, setting `From` to 2026-08-27 and `To` to 2026-08-26 shows
“0 records match this map” and an enabled `Preview 0 records` button. There is
no alert explaining that the range is invalid or how to correct it. File
validation does provide a recovery action, so the inconsistency is visible.

### Low — one mobile touch target is narrower than 44 px

At exactly 390 px, the footer `Terms` link measures 39×44 CSS px. Checkbox
inputs also have narrow hidden boxes, but their enclosing labels provide the
real 48 px target. The standalone footer link does not meet the 44×44 baseline.

## Passing evidence

### Clean build and repository checks

- `npm ci`: PASS; 113 packages installed, zero reported vulnerabilities.
- `npm test`: PASS; 73 passed and one intentional desktop-only mobile-layout
  skip across desktop Chromium and Pixel 5/mobile projects.
- `npm run build`: PASS; TypeScript `--noEmit` and Vite production build both
  passed, and `dist/` was produced.
- No separate lint script exists.
- Candidate production sizes: JavaScript 34.95 KB raw / 12.43 KB gzip; CSS
  18.27 KB raw / 5.10 KB gzip; largest hero image 145.79 KB. All stated static
  budgets pass.
- `npm run cap:sync`: PASS.
- With JDK 21 and Android SDK/API 36 installed, clean debug APK assembly,
  debug and release JVM unit variants, and `assembleDebugAndroidTest` passed.
  One combined Gradle attempt hit a child test-executor connection timeout;
  the isolated retry with one worker passed both JVM variants.
- The checked APK has package `in.sociobot.healthdatabridge`, version 1.0.3,
  min SDK 26, target SDK 35, a valid Android debug signature, and exactly the
  four intended health read permissions plus Internet and the generated
  receiver permission. No health write permission is present.

### Useful live web flow

The deployed build is later than the candidate, but its current behavior was
checked independently:

- Demo first import: 12 new, 0 skipped.
- Repeat import: 0 new, 12 skipped.
- CSV: header plus 12 rows. JSON: 12 records and one receipt after the first
  import.
- Malformed JSON and invalid values/units/date order produced an announced
  error with `Choose another file`; a valid zero-step boundary record then
  recovered successfully.
- CSV quoting, duplicate IDs within one batch, returned-license cache-by-token,
  demo isolation, encrypted persistence, and route focus/scroll regressions
  passed in the full candidate browser suite.
- A reversed UI date range is the exception documented above.

### Privacy, networking, and server allowance

- Playwright recorded the complete live demo import and both exports. All four
  requests were same-origin; no analytics, trackers, CDN scripts, external
  fonts, or record-data requests appeared.
- Browser response headers show CSP, HSTS, `Referrer-Policy`,
  `X-Content-Type-Options`, and `Permissions-Policy` on the document and
  assets. CSP permits only self plus `https://api.sociobot.in` for connections.
- Hashed JavaScript/CSS and images are cached for one year with `immutable`;
  HTML, the service worker, manifest, and APK use a 30-second revalidation
  policy. Unknown routes return HTTP 404.
- The external Sociobot license verification endpoint allowed 30 rapid
  requests from one client. Request 31 and requests through 40 returned HTTP
  429 with `Retry-After: 4`. Observed allowance: 30 requests per window.
- There is no sign-in, product-owned backend, library, or CLI. Entra tenant,
  backend concurrency/health identity, and package-consumer checks are not
  applicable.

### Accessibility and responsive behavior

- Factory `verify-url.sh` passed locally and live: HTTP 200, title, `lang=en`,
  one h1, main landmark, alt text, labeled buttons, and no normal-load console
  errors.
- Independent axe scans covered `/`, completed `/demo`, `/bridge`, `/privacy`,
  `/terms`, and a missing route at desktop and 390 px, in light and dark
  schemes: zero serious or critical findings.
- Keyboard-only skip-link and Enter activation passed. Focus is a visible
  3 px clay outline with a 4 px offset. There was no keyboard trap.
- Normal mobile layout and simulated 200% text had zero horizontal overflow.
  The primary action fits in the first 390×844 viewport.
- Reduced motion computes near-zero animation/transition durations and
  `scroll-behavior: auto`.

### PWA and performance

- A fresh live worker controlled `/demo` with cache `hdb-v1.0.3`; offline
  reload returned HTTP 200 from the service worker with the 12-record sample.
  The cross-build update defect remains as described above.
- Lighthouse 12.6.0 mobile: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.90 s, LCP 1.08 s, TBT 81 ms, CLS 0, total
  transfer 174,547 bytes.
- Under 4× CPU throttling, the two main demo clicks recorded 144 ms and 104 ms
  event durations, below the 200 ms interaction budget.
- All first-party and external links returned HTTP 200 or were an explicit
  `mailto:` link. Every real route has a route-specific title, one h1, and a
  canonical URL. `robots.txt` and `sitemap.xml` list the real routes.

## Required next steps

1. Deploy and verify the intended candidate, or nominate the currently live
   commit as a new candidate. Do not claim `c159920` is live.
2. Change the service-worker bytes/cache version on every release and prove a
   real old-worker-to-new-worker transition.
3. Exclude downloadable APKs from Capacitor assets and make the published APK
   reproducible from a documented clean command.
4. Follow every Health Connect `pageToken`, add provider package visibility,
   fix the stale instrumentation test, and run the core flow on a device with
   Health Connect, including denial/unavailable and more-than-1,000-record
   cases.
5. Add every visitor claim to `.factory/claims.json` with a two-way manifest
   check; add observable date-range coverage and reject reversed ranges.
6. Expand the mobile footer link target to at least 44×44 CSS px.
