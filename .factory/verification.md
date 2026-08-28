# Independent product verification — FAIL

Verified on 2026-08-28.

- Candidate: `d2afd5401025e05efd29e4afed6d8e4b9d265c0a`
- Branch state before QA: clean; `HEAD` and `origin/main` were the candidate
- Live URL: `https://health-data-bridge.sociobot.in/`
- Work order: `health-data-bridge-verify-1`
- Result: **FAIL — do not release this candidate**

The former static-deployment problem is resolved. The live HTML, JavaScript,
and CSS are byte-for-byte identical to a fresh candidate build. Independent
testing nevertheless found release-blocking Android, sandbox, purchase,
accessibility, and data-integrity defects.

## Mandatory gates

### Claims-first gate

`.factory/claims.json` exists. I ran every listed command separately after
`npm ci`, before the rest of the repository audit. Each test ran against the
product's `/demo` or specified bridge/repository sandbox in both configured
Playwright projects.

| Claim | Exact command | Result |
| --- | --- | --- |
| `duplicate-safe` | `npm test -- --grep @claim:duplicate-safe` | PASS, 2/2 |
| `csv-export` | `npm test -- --grep @claim:csv-export` | PASS, 2/2 |
| `json-export` | `npm test -- --grep @claim:json-export` | PASS, 2/2 |
| `local-only` | `npm test -- --grep @claim:local-only` | PASS, 2/2 |
| `offline-reload` | `npm test -- --grep @claim:offline-reload` | PASS, 2/2 |
| `encrypted-storage` | `npm test -- --grep @claim:encrypted-storage` | PASS, 2/2 |
| `paid-custom-fields` | `npm test -- --grep @claim:paid-custom-fields` | PASS, 2/2 |
| `local-file-import` | `npm test -- --grep @claim:local-file-import` | PASS, 2/2 |
| `narrow-health-permissions` | `npm test -- --grep @claim:narrow-health-permissions` | PASS, 2/2 |

The passing claim suite is not sufficient for acceptance. It misses the
same-batch duplicate case, quoted CSV round trips, real purchase verification,
and demo preference isolation described below.

The claims inventory is also incomplete. Examples of live claim-like copy
without a corresponding claim entry and dedicated test are the quantitative
“Four minutes, four stations”, the purchasable “$9 one time” tier, and the
demo banner's “nothing is saved”. The last two are contradicted by live tests.

### Cold first-read gate

PASS on desktop 1440×900 and mobile 390×844.

- What it does: “Map Health Connect data to your log.”
- Who it is for: Android loggers who need activity and weight records without
  sending their history to another service.
- First click: “Try it with sample data”, with “Next, preview 12 records and
  their field map” beside it.
- The primary action is visible without scrolling on both viewports.
- Cold response was HTTP 200; the title was
  `Health Data Bridge — map health records locally`; no console or page error
  occurred.

## Release-blocking findings

### Critical — no usable Android artifact or live Health Connect path

The acceptance artifact is Android, but neither the candidate nor the live
landing page contains an APK/AAB or Android download link. Repository and git
tree searches found zero `*.apk` and `*.aab` files; the live page has zero APK
links. The web “Read Health Connect” action reports:

`"HealthConnectBridge" plugin is not implemented on web Choose a local export instead.`

Therefore a user cannot perform the core Health Connect job from the shipped
URL. `npm run cap:sync` passes and a native project exists, but
`android/gradlew assembleDebug` cannot run in this verification image because
there is no Java runtime or Android SDK (`JAVA_HOME is not set and no 'java'
command could be found`). There is no previously built artifact to test on a
device. The static manifest test is not a substitute for an install, native
permission dialog, one-month read, Android export, or repeat-import test.

### High — demo mode reads and overwrites real preferences

With a cached Plus verdict and real field preference `weight=real.mass`,
opening `/demo` displayed `real.mass`. Changing it to `demo.mass` and selecting
“Save field names” wrote the non-demo key `hdb:custom-fields`; selecting “Start
for real” then displayed `demo.mass` in the real bridge. “Reset demo” only
clears `demo:bridge-state`, not this key.

This violates the required separate demo namespace and the persistent banner
“Demo — sample data, nothing is saved”. Demo receipt data itself was correctly
isolated to `sessionStorage` and did not create IndexedDB/localStorage entries.

### High — the advertised purchase cannot complete

The live “Buy Bridge Plus” target returned HTTP 404 with:

`{"error":"enabled factory product","status":404}`

The product advertises a purchasable $9 one-time tier, so this is a broken
end-to-end paid flow, not a harmless deployment note.

There are two additional unlock-flow defects:

- Loading `/?license=qa-return-token` stored and stripped the token but made
  zero verification requests, created no cached verdict, and left Plus locked.
- After a rejected pasted token, entering a different token within 24 hours
  reused the first token's cached false verdict. A controlled valid response
  for the second token was never requested (`verifyRequests: 1` across both
  submissions), and the originally rejected token remained stored.

### High — CSV export/import round trip silently corrupts a field

A valid JSON record whose source was `Pixel, Watch` exported correctly as
`"Pixel, Watch"`. Re-importing that product-generated CSV displayed the source
as `"Pixel`. The parser splits each line on every comma and does not implement
CSV quoting. The app gives no warning, so a user can corrupt an exported local
log by opening it again.

### High — duplicate IDs inside one import are both written

A two-record input containing the same ID twice produced a JSON export with
both rows (`recordIds: ["same-id", "same-id"]`, values 100 and 200). Duplicate
filtering compares every candidate only with the pre-import ledger, not with
other candidates in the same batch. This contradicts the visible statement
“Record IDs prevent the same source record from being written twice.” The
declared duplicate claim only tests repeating an entire completed import and
does not cover this case.

### High — dark mode has serious axe violations

Playwright axe scans covered `/`, `/demo`, `/bridge`, `/privacy`, `/terms`, and
a missing route at desktop and 390 px in light and dark schemes. Light mode had
no serious/critical findings. Dark mode produced serious `color-contrast`
findings:

- Landing: 5 affected nodes.
- Empty real bridge: 4 affected nodes.
- Completed demo: 9 affected nodes.
- Examples: demo banner body and selected type/secondary controls are 4.35:1
  where 4.5:1 is required; demo links are 2.86:1.

This directly fails the required contrast and zero-serious/critical axe gate.

## Other defects

### Medium — invalid health values are accepted without warning

The file importer accepted and previewed a `steps` record with value `-99` and
unit `kg` as `activity.steps -99 kg`. Validation checks only ID, known type,
finite number, and non-empty timestamps. It does not validate allowed units,
non-negative quantities, timestamp syntax/order, or type/unit agreement. This
can write nonsensical health-log rows.

### Medium — SPA route changes strand focus off screen and lose scroll state

After scrolling the landing footer into view and selecting Privacy, the new
privacy h1 received focus but remained above the viewport. At 390 px the route
landed at `scrollY=789` with the h1 at `top=-581px`. Back returned to the
landing page at `scrollY=789`, not the prior `3501`. Desktop reproduced the
same defect. The router preserves/clamps scroll while using
`focus({preventScroll:true})`; it neither shows the new page start nor restores
the prior position.

### Medium — touch targets and 200% text reflow miss the baseline

Measured clickable boxes below 44 px include demo “Reset demo” (92×30), “Start
for real” (87×21), and footer links (about 20 px tall). With text size doubled
at 390 px, the landing page overflowed horizontally by 16 px and the demo by
22 px, with the inline sample link/date inputs clipped.

### Low — unknown routes return HTTP 200

`/definitely-missing-qa-page` renders the designed not-found view but returns
HTTP 200 rather than 404. This weakens correct crawler and cache behavior.

### Low — hashed assets are not cached immutably

The root, hashed JS/CSS, and service worker all return
`Cache-Control: public, must-revalidate, max-age=30`. Hashed assets should use a
long-lived immutable policy. The service worker itself appropriately has a
short lifetime.

## Passing evidence

### Reproducibility and build

- `npm ci`: PASS; 113 packages, zero reported vulnerabilities.
- `npm test`: PASS; 31 passed, 1 intentional desktop skip, 32 total.
- `npm run build`: PASS; includes `tsc --noEmit`; `dist/index.html` produced.
- No separate lint script exists.
- `npm run cap:sync`: PASS.
- Production gzip sizes: JS 11.70 KB; CSS 4.99 KB.
- Largest hero derivative: 145,790 bytes. Lighthouse total byte weight:
  173,658 bytes. Static budgets pass.

### Deployment identity

Candidate and live hashes match exactly:

- `index.html`: `05540b15fdd556c18ea719bed7387b1b0ca2aae03ad724577397865f4fc61d80`
- `index-CHl1WJsb.js`: `90ad725240efec5558a0305436ba212e7da8232850fcca4d3233ab4d754478fa`
- `index-DkcfLqav.css`: `1e4e180e20cd9591fc3d75421dfa03b4763d4468615db094e3c26e3b197f6844`

The factory `verify-url.sh` passed: HTTP 200, 643 ms load, `lang=en`, one h1,
one main landmark, zero missing alt attributes, zero unlabeled buttons, and
zero console errors.

### Useful flow and recovery

- First demo import: 12 new, 0 skipped.
- Second demo import: 0 new, 12 skipped.
- JSON after both: 12 records and 2 receipts.
- CSV claim output: expected header plus 12 data rows.
- Demo flow made no off-origin requests.
- Malformed JSON produced a named alert and “Choose another file” recovery.
- No horizontal overflow appeared at the normal 390 px text size.
- Desktop and mobile keyboard tests passed skip-link focus and Enter
  activation. Focus styling is present. Reduced-motion mode computed
  `scroll-behavior: auto` and 0.01 ms animation/transition durations.
- No console/page errors appeared across all audited routes and completed demo
  states in either color scheme.

### PWA/offline

After one online visit, the active service worker controlled the page and
cache `hdb-v1.0.0` contained the shell, all real routes, both generated hero
images, and hashed JS/CSS. Offline reload passed for `/demo`, `/bridge?v=1`,
`/privacy`, `/terms`, and an unseen missing route, with correct titles/h1s and
no console errors. An actual cross-version server update could not be injected
without modifying the deployed product; update behavior was inspected only.

### Performance

Lighthouse 12.6.0 mobile against the live landing page:

- Performance 100; Accessibility 100 in its default light scheme; Best
  Practices 100; SEO 100.
- FCP 1.09 s; LCP 1.75 s; TBT 56 ms; CLS 0.
- Event Timing on the two main demo clicks under 4× CPU throttling recorded
  136 ms and 80 ms interaction durations, within the 200 ms INP budget.

Lighthouse's default light run does not negate the separate dark-scheme axe
failures.

### Privacy, network, and response policy

- The normal demo import/export flow made only same-origin requests.
- No analytics, trackers, third-party fonts, or CDN scripts were observed.
- Real records and receipts were stored as AES-GCM ciphertext; the declared
  storage test also confirmed rehydration after reload.
- Live responses include HSTS, CSP, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy`. CSP allows only self plus the
  Sociobot API for connections.
- The license API returned origin-specific CORS and `Cache-Control: no-store`.
- Rate limit: a rapid verification burst returned 200 for requests 1–30, then
  429 on request 31 with `Retry-After: 3`.
- No sign-in exists, so the Entra tenant check is not applicable. There is no
  product-owned backend, library, or CLI.

## Required next steps

1. Produce and device-test a downloadable Android APK/AAB, including real
   Health Connect permissions, one-month read, export, offline persistence,
   and second-import behavior.
2. Give all demo preferences a demo namespace; reset them; prove demo cannot
   read or write real data.
3. Register/fix the Sociobot checkout, automatically verify returned licenses,
   and key cached verdicts by token.
4. Use a standards-compliant CSV parser and deduplicate within each batch;
   validate units, values, and timestamps.
5. Repair dark contrast, touch targets, 200% text reflow, and SPA scroll/focus.
6. Add claim entries and sandbox tests for every live claim, especially demo
   isolation, purchase/price, Android operation, and the four-minute statement.

