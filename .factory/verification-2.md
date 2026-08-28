# Independent product verification — FAIL

Verified on 2026-08-28 against candidate `4d4b2be1dc071d4520c263b947aa9639f1524704` and `https://health-data-bridge.sociobot.in/`.

## Decision

**FAIL — do not release / accept this candidate yet.** The earlier deployment-only concern is resolved: the live HTML, JavaScript, CSS, and downloadable APK match a fresh production build of this exact commit. The candidate nevertheless fails the mandatory claims contract, and the Android Health Connect runtime path was not independently executable in this verification environment. For an Android product, static source/APK inspection is not end-to-end proof of the core job.

## Claims-first gate

From the clean candidate checkout, I ran `npm ci` and then every exact command in `.factory/claims.json` before any broader product testing. All passed in both configured Playwright projects (desktop Chromium and Pixel 5 / 390 px):

| Claim | Exact command | Result |
| --- | --- | --- |
| duplicate-safe | `npm test -- --grep @claim:duplicate-safe` | PASS, 2/2 |
| csv-export | `npm test -- --grep @claim:csv-export` | PASS, 2/2 |
| json-export | `npm test -- --grep @claim:json-export` | PASS, 2/2 |
| local-only | `npm test -- --grep @claim:local-only` | PASS, 2/2 |
| offline-reload | `npm test -- --grep @claim:offline-reload` | PASS, 2/2 |
| encrypted-storage | `npm test -- --grep @claim:encrypted-storage` | PASS, 2/2 |
| paid-custom-fields | `npm test -- --grep @claim:paid-custom-fields` | PASS, 2/2 |
| demo-isolation | `npm test -- --grep @claim:demo-isolation` | PASS, 2/2 |
| four-station-flow | `npm test -- --grep @claim:four-station-flow` | PASS, 2/2 |
| local-file-import | `npm test -- --grep @claim:local-file-import` | PASS, 2/2 |
| narrow-health-permissions | `npm test -- --grep @claim:narrow-health-permissions` | PASS, 2/2 |
| android-native-package | `npm test -- --grep @claim:android-native-package` | PASS, 2/2 |

The full suite subsequently passed: `npm test` exited zero (`57 passed`, `1` deliberate desktop-only mobile-layout skip; 58 configured test instances). `test-results/artifacts/.last-run.json` reports `status: passed`.

## Release-blocking defects

### High — unlisted, unproved visitor claims

The claims skill makes this a release blocker: every claim a visitor could rely on must have an entry in `.factory/claims.json` and one tagged observable test. The current manifest has no entry/test for these explicit live and README claims:

- “Core import and export are free.” (`src/main.ts:50`)
- “No account or cloud history.” (`src/main.ts:60`)
- “No provider sharing.” (`src/main.ts:60`)
- “New purchases are paused.” (`src/main.ts:61` and `README.md`)
- The displayed APK SHA-256 is a visitor-facing integrity claim (`src/main.ts:51`). The existing Android claim only checks that a repository file begins with `PK` and is larger than 1 MB; it does not prove the displayed digest matches the downloadable artifact.

There are useful non-claim tests for some related behavior, but that does not satisfy the required claim inventory/tagging rule. My manual check found the currently displayed checksum correct, but it still needs a declared observable regression test. Add the missing entries and tags (or remove the claims) before release.

### High — core Android Health Connect route not independently run

The real job in the researched brief is Android Health Connect import. The product provides an APK and static evidence of a registered plugin with exactly four read scopes, but no device/emulator was available to install it, grant/reject permissions, read one month, export, and repeat import. The verifier container has neither `java` nor `/opt/android-sdk`, so `android/gradlew assembleDebug` could not be run here either. `npm run cap:sync` did pass.

This is not evidence that the Kotlin implementation is broken; it is an acceptance gap. The shipped file is a debug APK, SHA-256 `a23ed0183dada1944f4ee176bb3b436effa2c11a0fcbd432143c4e029d1779a1`, and its live download matches the repository byte-for-byte. Before acceptance, run the APK on an Android device/emulator with Health Connect and record the four-scope permission prompt, a normal one-month import, denied/unavailable recovery, export, and repeat-import receipt.

## First read (cold live page)

**PASS** at desktop 1440×900 and mobile 390×844. The first screen plainly says it maps Health Connect data to a log, names Android loggers who want activity and weight records without another service, and shows one visible `Try it with sample data` action with the immediate result (“Next, preview 12 records and their field map”). The one-click demo requirement is met; no cold-load console/page errors occurred.

## Passing evidence

- Fresh install: `npm ci` added 113 packages with 0 reported vulnerabilities.
- Exact production build: `npm run build` passed (`tsc --noEmit` plus Vite). `dist/` was produced. Gzipped initial JS is 12.42 KB and CSS 5.10 KB, below the static budgets.
- Capacitor synchronization: `npm run cap:sync` passed and copied the fresh `dist/` to Android assets. No separate lint script exists.
- Deployment identity: SHA-256 matches were exact for `dist/index.html`, `index-Djm1EYpD.js`, `index-Bou95EVk.css`, and `public/downloads/health-data-bridge-debug-v1.0.2.apk` versus the corresponding live URLs. APK checksum: `a23ed0183dada1944f4ee176bb3b436effa2c11a0fcbd432143c4e029d1779a1`.
- Live normal flow, at 390 px: sample preview → first receipt reported 12 new/0 repeats → second receipt reported 0 new/12 skipped; CSV and JSON downloads were generated. A malformed/negative/wrong-unit input produced the named alert and `Choose another file` recovery.
- Privacy: the completed live demo import/export flow made requests only to `https://health-data-bridge.sociobot.in`; no third-party fonts, analytics, or trackers appeared. The declared encrypted-storage test passed. CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are live. Hashed CSS/JS are `max-age=31536000, immutable`; unknown routes return HTTP 404.
- PWA: after first visit the active service worker used cache `hdb-v1.0.2`; offline reload of `/demo` returned HTTP 200 from the service worker and retained the heading/sample preview without errors. The update path includes versioned cache cleanup, `skipWaiting`, `clients.claim`, and an update toast hook; a real version transition could not be induced against the immutable live candidate without changing deployment.
- Accessibility: `/opt/fleet/lib/verify-url.sh` passed (HTTP 200; title/lang; one h1/main; no missing alt or unlabeled button; no console errors; 1,528 ms load). Independent axe scans of `/`, `/demo`, `/bridge`, `/privacy`, and `/terms` at mobile 390 px in dark mode found zero serious/critical violations, zero console errors, and no horizontal overflow. Keyboard focus on the preview button is a visible 3 px clay outline with 4 px offset. Reduced-motion media applies near-zero transition duration.
- Response allowance: calling the existing Sociobot license verification endpoint from one client produced HTTP 200 for requests 1–30 and HTTP 429 from request 31 onward, with `Retry-After: 3` (request 35 reported 2 as the window elapsed). Observed allowance: 30 requests per window. No product sign-in exists, so the Entra tenant condition is not applicable.

## Required next steps

1. Bring every live/README claim under `.factory/claims.json` with exactly one `@claim:<id>` observable test, especially free access, account/cloud/provider boundaries, sales-paused state, and APK checksum; otherwise remove the sentence.
2. Run and retain native Android/device evidence for the actual Health Connect path. The supplied verifier image lacks the JDK, SDK, and device/emulator necessary for that check.
3. Re-run the claim-first suite and full suite, then issue a new verification report against the resulting commit/deployment.
