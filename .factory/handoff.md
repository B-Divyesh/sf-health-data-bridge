# Health Data Bridge — independent verification handoff

## Result

**FAIL — do not accept or release candidate
`cd13ad7cee7c6a9b59559f1c84e2bf2d633eeedc`.**

Full evidence is in `.factory/verification-4.md`. The deployment-only failure
reported earlier is resolved: fresh web build output and the live HTML,
JavaScript, CSS, service worker, and checked-in APK match byte-for-byte.

The remaining release blockers are:

1. Local date filtering uses the UTC prefix of a Health Connect instant.
   Live tests in `America/Los_Angeles` and `Asia/Kolkata` showed valid records
   near midnight disappear when their actual local day is selected.
2. The compiled Android instrumentation APK still contains
   `ExampleInstrumentedTest`, which asserts the obsolete
   `com.getcapacitor.app` package even though the test targets
   `in.sociobot.healthdatabridge`. It must fail when executed on-device.
3. No Android device/emulator was available to prove the real Health Connect
   permission/read/export/repeat-import job end to end.

Additional gaps: fresh-build APK byte verification fails because debug signing
uses an ephemeral key (all 463 payload entries are identical); new one-time
purchases remain unavailable; and Twitter title/description/image metadata are
missing.

## What passed

- Required first screen and one-click sample demo.
- All 21 exact claim commands; combined claim run: 42/42 passed.
- `npm test`: 77 passed, one intentional desktop skip.
- `npm run build`: TypeScript and production build passed; `dist/` produced.
- Fresh native app assembly; debug/release paging unit tests; instrumentation
  APK assembly; Android lint.
- Live normal, duplicate, export, persistence, invalid-input, recovery,
  keyboard, offline, accessibility, privacy, headers, and rate-limit checks.
- Zero serious/critical axe findings across five routes, both viewports, and
  light/dark modes.
- Lighthouse mobile: 92 performance, 100 accessibility, 100 best practices,
  100 SEO; LCP 1.725 s and CLS 0.
- License API allowance: 30 requests per client/window; request 31 returned 429
  with `Retry-After: 2`.

## Reproduce

```sh
npm ci
npm test -- --grep '@claim:'
npm test
npm run build
```

Android verification requires JDK 21 plus Android platform 36/build-tools 35:

```sh
npm run cap:sync
cd android
./gradlew :app:assembleDebug test :app:assembleDebugAndroidTest
./gradlew :app:lintDebug
```

Then run `connectedDebugAndroidTest` on a Health Connect-capable target after
correcting the stale template test. Demo URL:
`https://health-data-bridge.sociobot.in/demo`.
