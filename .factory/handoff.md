# Health Data Bridge v1 handoff

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
npm test
npm run build
npm run cap:sync
```

Results on 2026-08-28:

- Playwright: 29 passed across desktop Chromium and Pixel 5 emulation; one intentional desktop skip for the mobile-only overflow case.
- All nine entries in `.factory/claims.json` passed in both configured browser projects where applicable.
- Automated accessibility scan: no serious or critical findings.
- `verify-url.sh`: HTTP 200, title and language present, one h1, main landmark present, zero missing alt attributes, zero unlabeled buttons, and zero console errors.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse metrics: FCP 0.9 s, LCP 2.1 s, CLS 0, total blocking time 0 ms.
- Production bundle: 11.69 KB JS gzip and 4.99 KB CSS gzip. Largest hero derivative is 144 KB.
- `npm run build` writes `dist/index.html` and the complete static deployment bundle.

## Artwork provenance

The source is `assets/src/topographic-bridge.png`. It was generated with the factory image model from the prompt recorded in `assets/src/topographic-bridge.prompt.json` and `.factory/design.md`. The image was visually checked for text artifacts, brands, symbols, and seams. None were found.

## Known gaps and next steps

- The work order calls for an Android project skeleton and a later APK build. This container has no JDK or Android SDK, so `./gradlew assembleDebug` could not run here. The native Kotlin bridge is included but needs compilation and device testing in that Android work order.
- The factory must register the paid product before checkout can complete. The app uses the slug-based checkout and verification URLs and contains no product ID.
- Health Connect access requires Android and user-granted permissions. The web deployment uses local JSON or CSV exports instead.
- A signed release APK and its SHA-256 download link belong to the later Android release work order.
