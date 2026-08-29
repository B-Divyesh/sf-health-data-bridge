# Health Data Bridge

Map Health Connect activity and weight records to a private local log.

Health Data Bridge is for Android fitness and nutrition loggers. It reads narrow Health Connect scopes, lets you choose a date range and preview each field map, and writes an import receipt. Record IDs make a second import write zero duplicates. Records and receipts use device-bound encryption.

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

The Capacitor project lives in `android/`. Its native bridge requests read access only for steps, active calories, exercise sessions, and weight. The downloadable debug APK is for direct Android testing; a signed release is a separate distribution step.

```sh
npm run cap:sync
cd android
./gradlew assembleDebug
```

With an Android 14+ device or emulator that includes Health Connect, run
`npm run android:device-test`. The device test uses test-only write permission
to seed 2,001 step records, then exercises denied and granted read permission
against the production paging path. Test-only permissions are not present in
the app APK.

To publish a fresh debug APK from the current source, run `npm run android:publish`.
That command builds a native-only Capacitor bundle, verifies it does not package
the public APK download, copies the new artifact to `public/downloads/`, and
stamps the landing page with its SHA-256. Published verification compares every
APK payload entry, so independent debug-signing certificates do not create a
false mismatch. The deployed static output remains `dist/`; `dist-native/` is
a temporary Android-only build input.

## File formats

JSON input accepts an array or `{ "records": [...] }`. CSV input needs these columns:

```text
id,type,startTime,endTime,value,unit,source
```

Supported `type` values are `steps`, `activeEnergy`, `exercise`, and `weight`.

## Purchase

New Bridge Plus sales are paused because the product is not registered with the billing service. Existing license holders can restore saved custom export field names. Import, receipts, CSV, and JSON remain free.

## Privacy and scope

Health records stay on the device. Only a license token reaches Sociobot when the user buys or restores Bridge Plus. The app offers no medical advice, calorie targets, cloud backup, provider sharing, or Apple Health import.

See [Privacy](https://health-data-bridge.sociobot.in/privacy), [Terms](https://health-data-bridge.sociobot.in/terms), the [visual thesis](.factory/design.md), and the [verified claims](.factory/claims.json).

## License

MIT. See [LICENSE](LICENSE).
