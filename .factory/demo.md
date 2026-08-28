# Demo sandbox

- URL: `https://health-data-bridge.sociobot.in/demo` or `/demo` during local development.
- Sample: 12 records from 22–26 August 2026. Sources are Pixel Watch, OpenScale, and Health Connect.
- Flow: preview the 12 records, inspect four field mappings, write a receipt, then write it again to see 12 repeats skipped.
- Reset: select **Reset demo** in the persistent demo banner.
- Storage: demo receipts and imported IDs use `sessionStorage` key `demo:bridge-state`; demo field names use `demo:custom-fields` in session storage.
- Isolation: demo mode never reads or writes the real IndexedDB database or real `hdb:custom-fields` preference.
- Offline: visit once, wait for the service worker, then disconnect and reload `/demo`.
