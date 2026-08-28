# Health Data Bridge

Map Health Connect activity and weight records to a private local log.

Health Data Bridge is for Android fitness and nutrition loggers. It reads narrow Health Connect scopes, previews each field map, and writes an import receipt. Record IDs make a second import write zero duplicates. Records and receipts use device-bound encryption.

The web build also opens Health Connect JSON or CSV exports. It exports the local log as CSV. JSON exports include records and receipts. The installed PWA works offline after the first visit.

## Try the sandbox

Open [the sample-data demo](https://health-data-bridge.sociobot.in/demo). It includes 12 activity and weight records. Demo changes use session storage under `demo:bridge-state`. They never enter the real local database.

## Run and verify

Requirements: Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
```

The exact production build command is `npm run build`. Static output lands in `dist/`, with `dist/index.html` at its root.

## Android project

The Capacitor project lives in `android/`. Its native bridge requests read access only for steps, active calories, exercise sessions, and weight. A later Android work order can build and sign the APK.

```sh
npm run cap:sync
cd android
./gradlew assembleDebug
```

## File formats

JSON input accepts an array or `{ "records": [...] }`. CSV input needs these columns:

```text
id,type,startTime,endTime,value,unit,source
```

Supported `type` values are `steps`, `activeEnergy`, `exercise`, and `weight`.

## Purchase

Bridge Plus costs $9 once. It saves custom export field names. Import, receipts, CSV, and JSON remain free. Checkout and license verification use the Sociobot billing API; no product ID is hardcoded.

## Privacy and scope

Health records stay on the device. Only a license token reaches Sociobot when the user buys or restores Bridge Plus. The app offers no medical advice, calorie targets, cloud backup, provider sharing, or Apple Health import.

See [Privacy](https://health-data-bridge.sociobot.in/privacy), [Terms](https://health-data-bridge.sociobot.in/terms), the [visual thesis](.factory/design.md), and the [verified claims](.factory/claims.json).

## License

MIT. See [LICENSE](LICENSE).
