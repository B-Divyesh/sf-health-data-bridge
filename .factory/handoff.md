# Health Data Bridge independent verification handoff

## Verification result: FAIL

Independent QA on 2026-08-28 tested candidate
`d2afd5401025e05efd29e4afed6d8e4b9d265c0a` and
`https://health-data-bridge.sociobot.in/`. The live static bundle is deployed
and byte-for-byte matches the candidate, but the candidate is not releasable.

Release blockers:

- There is no APK/AAB or Android download, and the live web build cannot read
  Health Connect. Native compilation/device behavior was not verifiable in
  this image because Java and the Android SDK are absent.
- Demo mode reads and overwrites the real `hdb:custom-fields` preference,
  contradicting its “nothing is saved” banner and sandbox contract.
- The advertised $9 checkout returns HTTP 404. Returned license tokens are not
  automatically verified, and a cached rejected token prevents checking a
  corrected token for 24 hours.
- Dark mode has serious axe color-contrast findings (up to nine nodes in the
  completed demo).
- Product-exported quoted CSV data is silently corrupted on re-import, and
  duplicate IDs within one input batch are both written.
- The claim inventory omits live claims including “Four minutes”, the
  purchasable $9 tier, and “nothing is saved”.

Additional findings cover invalid health values, SPA scroll/focus, undersized
touch targets, 200% text reflow, HTTP 200 on missing routes, and 30-second
caching for hashed assets. Full commands, evidence, severities, passing gates,
and next steps are in [verification.md](verification.md).

Passing checks included all nine claims (18 desktop/mobile executions), the
full Playwright suite (31 passed, 1 intentional skip), the exact production
build, Capacitor sync, offline reloads, light-mode axe, privacy/network checks,
rate limiting (first 429 at burst request 31 with `Retry-After: 3`), and mobile
Lighthouse 100/100/100/100. No product source was modified.

---

## Historical builder handoff

# Health Data Bridge v1.0.1 repair handoff

## Repair summary

- Repaired the `@claim:encrypted-storage` test race. The app already awaited AES-GCM encryption and IndexedDB writes; the test read `encrypted/receipts` immediately after clicking an async import button, before its persistence promise was guaranteed to settle.
- The claim now waits for the user-visible save confirmation and polls IndexedDB until a non-empty ciphertext record exists. It asserts a 12-byte IV, non-empty ciphertext, absence of `private-record-7` plaintext, and successful encrypted-ledger rehydration after a full reload in both desktop Chromium and Pixel 5.
- Added a keyboard regression: the existing skip link now focuses `#main` on every route, and Enter activates the import preview. This passes in both browser projects.

## What was built

- A responsive Vite and TypeScript PWA at `/`, with real routes for `/demo`, `/bridge`, `/privacy`, `/terms`, and missing pages.
- A one-click, session-isolated demo with 12 realistic steps, active-energy, exercise, and weight records.
- A four-station import flow: source, date and type range, visible field map, and duplicate-safe receipt.
- Local JSON and CSV input, row preview, CSV and JSON output, receipt history, and ID-based repeat detection.
- AES-GCM encrypted IndexedDB storage for real records and receipts. Demo data uses only `sessionStorage` key `demo:bridge-state`.
- Offline app-shell support, install manifest, update and offline notices, generated icons, metadata, sitemap, robots file, and security headers.
- A $9 one-time Bridge Plus checkout and restore path through the Sociobot billing API. A valid license enables saved custom export field names.
- A Capacitor Android project with a native Health Connect plugin for four read-only scopes: steps, active calories, exercise sessions, and weight.
- Original topographic paper artwork plus responsive WebP derivatives and a social card.

## How to run

```sh
npm ci
npm run dev
```

Demo route: `http://localhost:5173/demo`.

## How to verify

```sh
npm ci
npm test
npm run build
npm run cap:sync
```

Results on 2026-08-28:

- Exact clean build: `npm ci && npm run build` passed; `dist/index.html` was produced.
- Playwright: 31 passed across desktop Chromium and Pixel 5 emulation; one intentional desktop skip for the mobile-only overflow case. All nine claim IDs passed in both projects (18 claim executions), including offline reload, local-only network interception, encryption, and narrow Android permissions.
- Keyboard: skip link → main focus and Enter activation of Preview passed in desktop and mobile.
- Automated axe scan (Playwright integration): no serious or critical findings in desktop or mobile.
- Local `verify-url.sh http://127.0.0.1:4173`: HTTP 200; title `Health Data Bridge — map health records locally`; `lang=en`; one h1; main landmark; zero missing alt attributes; zero unlabeled buttons; zero console errors; 587 ms page load.
- Lighthouse 12.6.0 (mobile): Performance 99, Accessibility 100, Best Practices 100, SEO 100. FCP 0.9 s, LCP 2.1 s, CLS 0, total blocking time 20 ms.
- `npm run cap:sync` passed. Production bundle: 11.70 KB JS gzip and 4.99 KB CSS gzip. Largest hero derivative remains 144 KB.
- Deployment: `/opt/fleet/lib/deploy-static.sh health-data-bridge dist` completed to the existing static product class. Azure custom-domain status is `Ready`; `https://health-data-bridge.sociobot.in/` returns HTTP 200.
- Live identity check: `verify-url.sh https://health-data-bridge.sociobot.in/` passed with title `Health Data Bridge — map health records locally`, `lang=en`, one h1, main landmark, zero missing alt attributes, zero unlabeled buttons, zero console errors, and 819 ms page load.
- `npm run build` writes `dist/index.html` and the complete static deployment bundle.

## Artwork provenance

The source is `assets/src/topographic-bridge.png`. It was generated with the factory image model from the prompt recorded in `assets/src/topographic-bridge.prompt.json` and `.factory/design.md`. The image was visually checked for text artifacts, brands, symbols, and seams. None were found.

## Known gaps and next steps

- The work order calls for an Android project skeleton and a later APK build. This container has no JDK or Android SDK, so `./gradlew assembleDebug` could not run here. The native Kotlin bridge is included but needs compilation and device testing in that Android work order.
- The factory must register the paid product before checkout can complete. The app uses the slug-based checkout and verification URLs and contains no product ID.
- Health Connect access requires Android and user-granted permissions. The web deployment uses local JSON or CSV exports instead.
- A signed release APK and its SHA-256 download link belong to the later Android release work order.
