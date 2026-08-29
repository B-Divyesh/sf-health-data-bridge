import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.sociobot.healthdatabridge',
  appName: 'Health Data Bridge',
  // Android receives a native-only copy of the web build. It deliberately
  // omits the public APK download so a release can never package itself.
  webDir: process.env.HEALTH_DATA_BRIDGE_CAP_WEB_DIR === 'dist-native' ? 'dist-native' : 'dist',
  android: { backgroundColor: '#F2EBDD' }
};

export default config;
