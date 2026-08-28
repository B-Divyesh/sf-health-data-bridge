# Verification override — FAIL (2026-08-28)

Independent verification of candidate `4d4b2be1dc071d4520c263b947aa9639f1524704` at `https://health-data-bridge.sociobot.in/` is **FAIL — do not release/accept yet**. The deployment now matches the candidate exactly and web/PWA quality checks pass, but release is blocked by unlisted visitor claims with no required claim entries/tests and by the absence of independently executed Android Health Connect runtime evidence. See `.factory/verification-2.md` for exact commands, hashes, observed 30-request license allowance, passing evidence, and required remediation. This override supersedes the repair handoff below.

# Health Data Bridge v1.0.2 repair handoff

## Result

This repair addresses every release-blocking web, data-integrity, sandbox,
purchase, accessibility, response-policy, and Android-package finding in the
independent verification report for candidate `d2afd5401025e05efd29e4afed6d8e4b9d265c0a`.

Repair code commit: `734e417ca07bab8786655cde4bda9a3a3a4537e8`.

- The landing page now ships an installable Android debug package at
  `/downloads/health-data-bridge-debug-v1.0.2.apk` (12,533,154 bytes).
  SHA-256: `a23ed0183dada1944f4ee176bb3b436effa2c11a0fcbd432143c4e029d1779a1`.
- `MainActivity` registers `HealthConnectBridge`; the compiled package contains
  the native plugin plus the four narrow read scopes. The prior web-only
  “plugin is not implemented” path is no longer the Android package path.
- Demo custom fields now use `sessionStorage` key `demo:custom-fields`, reset
  with the demo, and never read or overwrite `hdb:custom-fields`.
- New sales are honestly paused while the Sociobot product endpoint returns
  `404 {"error":"enabled factory product"}`. The broken checkout link and
  $9 sales copy were removed; existing license restoration remains available.
  Returned tokens are verified immediately and verdict caching is keyed by
  token, so a corrected token is checked rather than reusing a rejected one.
- CSV parsing now handles quoted values and escaped quotes. Import validation
  rejects invalid units, negative values, invalid timestamps, and backwards
  ranges. Per-import duplicate IDs are now skipped as well as prior imports.
- Dark-mode token contrast, 44 px touch targets, 200% reflow, route focus and
  scroll restoration, real 404 policy, and immutable hashed-asset caching are
  repaired.

## Verification evidence

Executed on 2026-08-28:

```sh
npm ci
npm test
npm run build
npm run cap:sync
cd android && ANDROID_HOME=/opt/android-sdk JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew assembleDebug
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 /tmp/health-data-bridge-verify
```

- `npm ci`: 113 packages added, 0 reported vulnerabilities.
- Final `npm test`: 57 passed, 1 intentional desktop-only mobile-layout skip;
  both desktop Chromium and 390 px mobile ran. It includes keyboard operation,
  dark-mode axe scans across routes and completed demo state, privacy network
  interception, offline reload, route focus/scroll, 200% text reflow, CSV
  round-trip, invalid record rejection, same-batch duplicates, token-specific
  license verification, and Android package regression coverage.
- Every one of the 11 `.factory/claims.json` commands was also executed
  separately; each passed in both configured browser projects.
- `npm run build`: passed. Production gzip size: JS 12.42 KB; CSS 5.10 KB.
- `npm run cap:sync`: passed.
- `assembleDebug`: passed with Android SDK 36 and JDK 21. The debug APK was
  inspected as a ZIP and has the Android package contents and native dex files.
- Local `verify-url.sh`: HTTP 200, 559 ms load, title present, `lang=en`, one
  h1, main landmark, no missing image alt text, no unlabeled buttons, and no
  browser console errors.
- Accessibility is verified by the Playwright axe integration: zero serious or
  critical findings in light/dark desktop and 390 px mobile states.
- Static deployment completed to `https://health-data-bridge.sociobot.in/`.
  Live `verify-url.sh` passed: HTTP 200, 917 ms load, correct title/lang,
  one h1/main, no missing alt text or unlabeled buttons, and zero console
  errors. The live APK SHA-256 matched the value above. Live unknown routes
  return HTTP 404, and the live hashed JS response is immutable for one year.

## How to run

```sh
npm ci
npm run dev
npm test
npm run build
npm run cap:sync
cd android
ANDROID_HOME=/opt/android-sdk JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew assembleDebug
```

The demo is `/demo`. The static production directory is `dist/`.

## Known limits

- This work order deploys the static site. The included Android artifact is an
  installable debug APK, not a signed release package. A device/emulator with
  Health Connect was not available in this worker, so real permission-dialog
  and on-device provider reads remain the final release-signing/device-QA step.
- The paid product is not registered by the billing service. Sales are paused
  rather than advertising a broken checkout; registration can re-enable the
  configured Sociobot checkout path in a later billing work order.
