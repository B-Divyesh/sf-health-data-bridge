# Health Data Bridge — verification handoff

## Result

**FAIL — do not accept the live product.**

The implementation reviewed is `c279bbc25ed4df3867aa623f2f8f69c424495046`.
The live site is still the prior v1.0.4 artifact, so it does not contain this
candidate's local-date, Android-test, or Twitter-metadata changes. The live
date filter still drops a valid record at a local midnight boundary. The core
installed Android Health Connect path has not been run on a device/emulator.

There are seven findings and zero untested registered claims. See
`.factory/verification-5.md` for fresh evidence, prior-finding disposition,
and required next steps.

## What passed

- Fresh desktop and phone first-read checks; the sample demo is one click.
- Demo loads 12 records, shows a persistent sample label, produces a 12-new/
  0-repeat receipt, resets, and leaves a real ledger unchanged.
- All 21 exact claim commands passed; combined claim run passed 42 tests.
- `npm test` passed: 79 passed, 1 intentional skip.
- `npm run build` passed and produced `dist/`.
- Clean native build, Android JVM tests, Android test APK assembly, lint, and
  `android:verify --native` passed with JDK 21/API 36/build-tools 35.
- Live offline demo reload, internal links, legal pages, headers, 404 design,
  keyboard route focus, and axe scans passed.

## Known gaps

- `npm run android:verify -- --published` fails after a fresh native build.
- New one-time Bridge Plus purchases are paused.
- The live deployment does not match `c279bbc`.
- No Health-Connect-capable Android device/emulator was available.

## Reproduce

```sh
npm ci
npm test -- --grep '@claim:'
npm test
npm run build
npm run cap:sync
```

With JDK 21 and Android platform 36/build-tools 35:

```sh
cd android
./gradlew --no-daemon --max-workers=1 \
  :app:assembleDebug test :app:assembleDebugAndroidTest :app:lintDebug
```

Demo: `https://health-data-bridge.sociobot.in/demo`.
