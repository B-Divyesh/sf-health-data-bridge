# Verify Android Health Connect import and the local receipt flow — FAIL

Verified 2026-09-06 against the live site at
`https://health-data-bridge.sociobot.in`.

## Verdict

**FAIL — do not accept or release the live product.**

Finding count: **7**. Untested registered claims: **0**.

The implementation reviewed is `c279bbc25ed4df3867aa623f2f8f69c424495046`
(`factory: repair health-data-bridge-repair-5`). The prior handoff and
verification documentation were last changed by
`27b557720576c79de72e2b6d1f468912702c522b`. The candidate's implementation,
README, and claims inventory are at `c279bbc`; the live deployment is still
the earlier 1.0.4 artifact recorded in verification 4, not this candidate.

## First screen

Fresh desktop (1440 × 900) and phone (Pixel 5, 390 × 844) sessions both
returned HTTP 200 without console errors.

- Job: map Health Connect activity and weight records into a local log.
- Audience: Android loggers who do not want to send their history to another
  service.
- First action: **Try it with sample data**. It says that the next screen
  previews 12 records and their field map.

The first-screen heading is `Map Health Connect data to your log`. Evidence:
`qa-evidence/verification-5/live-first-desktop.png` and
`qa-evidence/verification-5/live-first-phone.png`.

## Findings

### High — live deployment is not the reviewed candidate

Fresh `npm run build` from `c279bbc` produced the following resources. Live
serves different HTML, JavaScript, service-worker, and APK bytes. The CSS is
the same, which does not make the application code current.

| Resource | Candidate SHA-256 | Live SHA-256 | Result |
| --- | --- | --- | --- |
| `/index.html` | `c5541a81871d558a76e2e4fd854749c27f50dc41520119dff2f23eb8481ef4f7` | `dd974a00bd701226cfd919d7bac25d2219b5b052ead202085073289f2dc75d2e` | different |
| app JavaScript | `54af49f6e642af7e0c5c2e0954be68f322a634138a515e391e9dbca25657393f` (`index-DzoJPsN5.js`) | live refers to `index-zcl0-amg.js`; candidate URL is 404 | different |
| app CSS | `4c94bb4a259a796406fcb0a39c8d9258d6a1af93c3c64b7d17159e7e9966b3a9` | same | same |
| `/sw.js` | `52d671fc75b0670ac58a78620a6bedad74ff9322f05b4765c3253d689bd541aa` | `9407980ccb73b34dd890f3ba64b7f3d030d2faba48cd2237ef5e80b6013ee68d` | different |
| Android test APK | candidate is `/downloads/health-data-bridge-debug-v1.0.5.apk`, SHA `287c6491dcbdae010d9d745b652d69b608b7e97f9d744b4dda15b7957a3fcbd4` | live links `/downloads/health-data-bridge-debug-v1.0.4.apk`, SHA `dfc01a340eff6fac40d4bfb617b1bb8b415b990b65088e0ad60a646e820b7ff3` | different |

This is a deployment correction, not a request to change product code. It
keeps the repaired local-date behavior, Android test cleanup, and Twitter
metadata out of the product users receive.

### High — live local-date filtering still omits a valid record

In a fresh `America/Los_Angeles` browser context, I opened `/bridge` and used
a local JSON record with start time `2026-08-27T06:30:00.000Z`. That instant is
26 August at 23:30 locally. The live app automatically selected 27 August.
When I chose the correct local date, 26 August, the range showed `0 records`
and disabled Preview. The candidate's new local-boundary test is therefore not
present in the live application. This violates the visible date-range claim
and can omit a user's records near midnight.

### High — the core Android Health Connect job has no device evidence

I installed Java 21 and Android API 36/build-tools 35 in the verifier, ran
`npm run cap:sync`, and then built the candidate with:

```sh
cd android
ANDROID_SDK_ROOT=/tmp/hdb-android-sdk ANDROID_HOME=/tmp/hdb-android-sdk \
  JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 \
  ./gradlew --no-daemon --max-workers=1 \
  :app:assembleDebug test :app:assembleDebugAndroidTest :app:lintDebug
```

It passed, producing the debug APK and Android test APK; the debug and release
JVM test reports and lint report were also produced. `android:verify --native`
passed. The clean environment has no Android device, ADB connection, or
Health-Connect-capable emulator. I could not install the APK or exercise the
real permission prompt, denied permission, unavailable/update-required state,
month read, export, restart persistence, and repeat import. Browser mocks and
compiled instrumentation tests are not end-to-end evidence for this Android
product's main job.

### Medium — documented published-APK verification fails from a clean native build

After the successful clean native build, this documented command failed:

```sh
npm run android:verify -- --published
```

It exits 1 with `Published APK entries do not match the clean native build.`
The candidate README says this verification compares payload entries so an
independent debug signature does not cause a false mismatch. The result is
therefore not reproducible as documented.

### Medium — one-time purchase is still unavailable

The brief specifies one-time monetization. The live landing page, terms, and
README instead say that new Bridge Plus purchases are paused because no billing
product is registered. There is no price or checkout path. The free import and
export flow works, and this is honest copy, but it remains an explicit scope
gap against the brief and paid-unlock contract.

### Low — live Twitter title, description, and image metadata are missing

The live document contains only `twitter:card`. It lacks `twitter:title`,
`twitter:description`, and `twitter:image`. The fresh candidate build has all
three. This is another visible result of the stale live deployment.

### Low — several live labels use mood or route metaphors

The plain-words contract applies to all routes. Examples include `Map edge`,
`This route stops here`, `A four-station route`, and `Every route ends in a
field you can inspect`. The first screen still communicates the job clearly,
but these labels should name the page or action directly.

## Claims and clean checks

After `npm ci`, I ran every exact command listed in `.factory/claims.json`
separately. All 21 commands passed in both configured browser projects. A
combined confirmation, `npm test -- --grep '@claim:'`, passed 42 tests. The
final normal `npm test` run passed (79 passed, 1 intentional desktop-only
skip). `npm run build` passed and produced `dist/`.

| Claim IDs with passing exact commands |
| --- |
| `duplicate-safe`, `batch-duplicate-safe`, `date-range-map`, `csv-export`, `json-export`, `local-only`, `offline-reload` |
| `encrypted-storage`, `paid-custom-fields`, `demo-isolation`, `four-station-flow`, `local-file-import`, `narrow-health-permissions` |
| `android-native-package`, `free-core-flow`, `no-account-cloud-history`, `no-provider-sharing`, `sales-paused`, `apk-checksum` |
| `no-medical-calculator`, `no-apple-health-import` |

The clean candidate claim tests prove their candidate sandbox. They do not
prove the stale live JavaScript, which is why the live date claim is a finding.
There are no untested claim commands.

## Demo, recovery, privacy, and offline checks

- A fresh phone demo showed the persistent label `Demo — sample data, nothing
  is saved`, Reset demo, and Start for real.
- Previewing sample data showed 12 realistic records and 12 table rows. The
  first receipt showed 12 new and 0 repeats. Evidence:
  `qa-evidence/verification-5/live-demo-receipt-phone.png`.
- Reset retained the sample source but removed the demo ledger. A separate real
  one-record ledger remained at one record after starting, using, resetting,
  and leaving demo. The complete flow made no off-origin requests and had no
  console errors.
- A malformed/invalid-input recovery path, duplicate receipt, exports, and
  encrypted storage pass in the clean claim suite. The live normal demo flow
  made only same-origin requests.
- After one online visit, the live service worker controlled `/demo`.
  Offline reload retained the 12-record sample and heading with no console
  errors. A real cross-version update cannot be accepted because the current
  candidate is not deployed.
- This product has no product-owned backend, account, tenant, or health route;
  backend tenant/restart/rate-limit checks do not apply.

## Accessibility, routes, links, and response checks

- `/opt/fleet/lib/verify-url.sh` passed live: HTTP 200, 928 ms, title,
  `lang=en`, one `h1`, one `main`, image alt text, named buttons, and no console
  errors. Evidence is under `qa-evidence/verification-5/verify-live/`.
- Axe scans found zero serious or critical violations on `/`, `/demo`,
  `/bridge`, `/privacy`, `/terms`, and the 404 page at desktop and phone widths,
  in light and dark color schemes. There was no horizontal overflow.
- Keyboard routing was rechecked at phone width: after scrolling to the landing
  footer, Privacy reset scroll to 0 and focused its `h1` at 208 px from the top.
  The skip link and reduced-motion behavior pass in the normal test suite.
- `/privacy` and `/terms` return 200 and set their own titles. The designed
  unknown route returns HTTP 404 with a home link. Its browser console has the
  expected failed-document message for the deliberate 404; that is not a
  defect.
- All internal links found on the public routes returned 200, including the
  live v1.0.4 APK. `mailto:` and the marked external Param Factory link were
  not fetched outside the product scope.
- Live root, legal routes, manifest, robots, and sitemap return expected types
  and security headers. Hashed JavaScript and CSS are cached for one year with
  `immutable`; HTML, service worker, and APK revalidate after 30 seconds.

## Earlier findings and current disposition

| Earlier finding | Current disposition |
| --- | --- |
| Missing APK / unusable web bridge | APK is now linked; the installed Android job remains unverified on a device. |
| Demo preference isolation | Candidate claim passes; live real ledger remained unchanged through the demo flow. |
| Broken checkout | Replaced by an honest paused-sales notice, but one-time purchase is still unavailable. |
| CSV quoting, batch duplicates, invalid values | Candidate tests pass. |
| Dark contrast, target size/reflow, route focus/scroll | Live axe has no serious/critical issues; no overflow; route focus/scroll now works. |
| HTTP 200 unknown route and weak asset caching | Live 404 is HTTP 404; hashed assets are immutable. |
| Unlisted public claims | The 21-item manifest and exact-tag inventory test pass for the candidate. |
| Recursive APK, 1,000-record paging, stale instrumentation test | Candidate source/build now contain a paging reader and no legacy template test; live has not received this candidate, and no device suite ran. |
| Service-worker update path | Candidate has a new worker byte/version, but live is still the older worker. |
| Local date boundaries | Still failing live; reproduced above. |
| Published APK reproducibility | Still failing; reproduced above. |
| Twitter metadata | Present in the candidate but absent live. |

## Required next steps

1. Deploy `c279bbc` and verify that the live resource hashes, v1.0.5 APK,
   local-date handling, and Twitter metadata match it.
2. Repair the payload comparison or publishing process so
   `npm run android:verify -- --published` passes from a clean native build.
3. Run the installed APK on a Health-Connect-capable Android device or emulator
   and retain evidence for the real grant, denial, unavailable, month-read,
   export, persistence, and repeat-import paths.
4. Register the one-time purchase or formally change the brief scope.
5. Replace the route/mood labels with direct labels.
