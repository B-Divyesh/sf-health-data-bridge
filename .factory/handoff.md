# Health Data Bridge independent verification handoff

## Result

**FAIL — candidate `c15992047de6a0eeebf92dbe14ba9e76cff97e3a` is not
accepted.** Verified on 2026-08-29 against
`https://health-data-bridge.sociobot.in/` under work order
`health-data-bridge-verify-3`.

The mandatory cold first-read/demo gate passed, and all 19 exact commands in
`.factory/claims.json` passed in both browser projects. The full browser suite
passed with 73 tests and one intentional desktop skip. The production web
build, Capacitor sync, Android debug build, JVM test variants, and Android test
APK assembly also completed.

Acceptance is blocked by fresh independent evidence:

- Live HTML, JavaScript, and APK bytes match current `origin/main` at
  `42ddf7e`, not candidate `c159920`.
- Candidate Android builds recursively package the downloadable APK. The
  checked APK is 18.6 MB and contains the old v1.0.2 APK; a clean rebuild is
  24.6 MB and contains the checked v1.0.3 APK.
- The native reader ignores Health Connect pagination after the first 1,000
  records of each type.
- Android 11–13 provider visibility is missing, and the only instrumentation
  test asserts the wrong package name.
- Candidate and live use byte-identical `sw.js` files and cache name
  `hdb-v1.0.3` despite different application bytes, so existing candidate PWA
  clients cannot receive the deployed update.
- A visible duplicate-safety claim has an undeclared
  `@claim:batch-duplicate-safe` test tag; date filtering is also claimed but
  not declared/tested as a claim. Reversed date ranges fail silently.
- The 390 px footer `Terms` link is 39×44 px, short of the 44×44 target.

Full commands, hashes, rate-limit results, performance numbers, passing
evidence, and required repairs are in `.factory/verification-3.md`.

## Verification summary

```sh
git checkout --detach c15992047de6a0eeebf92dbe14ba9e76cff97e3a
npm ci
# Every exact .factory/claims.json command, separately
npm test
npm run build
npm run cap:sync
cd android
ANDROID_HOME=/tmp/hdb-android-sdk \
ANDROID_SDK_ROOT=/tmp/hdb-android-sdk \
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
  ./gradlew --no-daemon :app:clean :app:assembleDebug
ANDROID_HOME=/tmp/hdb-android-sdk \
ANDROID_SDK_ROOT=/tmp/hdb-android-sdk \
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
  ./gradlew --no-daemon --max-workers=1 \
  :app:testDebugUnitTest :app:testReleaseUnitTest :app:assembleDebugAndroidTest
```

Additional live checks covered Playwright request/response logs, normal and
invalid flows, keyboard-only use, 390 px and 200% reflow, reduced motion,
light/dark axe scans, service-worker update/offline reload, response headers,
link crawl, Lighthouse mobile, asset/deployment hashes, APK inspection, and 40
rapid license-verification requests. The API returned 429 from request 31 with
`Retry-After: 4`.

## Passing current live behavior

The live deployment—although not the candidate—currently imports 12 sample
records, skips all 12 on repeat, exports correct CSV/JSON, makes no off-origin
request during the health-data flow, reloads `/demo` offline, and has zero
serious/critical axe findings. Lighthouse mobile scored 100 in all four
categories. These results do not establish candidate deployment identity or a
working native Health Connect device flow.

## Remaining work

Follow the six required next steps in `.factory/verification-3.md`, then run a
new independent verification against the exact deployed commit. A physical or
emulated Android device with Health Connect is still required for permission,
provider, one-month/multipage import, export, and repeat-import evidence.

No product code was modified during this verification.
