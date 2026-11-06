/**
 * Keeps the Meta SDK silent until the app says otherwise (1.0.1, 2026-11-05).
 *
 * The owner's rule is OFF unless the device region is US, CA or AU. Both
 * platforms' SDKs would otherwise start at launch for every person, before any
 * JS has run, and reach Meta's servers:
 *
 *  • Android: FacebookInitProvider runs sdkInitialize, which fetches the app's
 *    settings. Removed here; modules/ape-meta-init makes that call when allowed.
 *  • iOS: react-native-fbsdk-next's Expo adapter, FacebookAppDelegate, calls
 *    ApplicationDelegate on every launch, which initializes the SDK and fetches
 *    the server configuration. No Info.plist flag stops it. The Podfile drops
 *    the adapter from Expo autolinking; the React Native pod stays, and its
 *    Settings.initializeSDK starts the SDK when allowed. The adapter's only
 *    other job is Facebook Login URLs, which this app does not use.
 *
 * These apply with or without Meta values, so a build without them is silent
 * too. The same file pins the Android SDK version the library leaves as 18.+.
 */
const { withAndroidManifest, withPodfile, withProjectBuildGradle } = require('expo/config-plugins');

const INIT_PROVIDER = 'com.facebook.internal.FacebookInitProvider';
const FACEBOOK_SDK_VERSION = '18.3.0';
const EXCLUDE = "use_expo_modules!({ exclude: ['react-native-fbsdk-next'] })";

function removeInitProvider(manifest) {
  manifest.manifest.$ = manifest.manifest.$ ?? {};
  manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  const app = manifest.manifest.application?.[0];
  if (!app) throw new Error('withMetaGuards: no <application> in the Android manifest');
  const others = (app.provider ?? []).filter((p) => p.$?.['android:name'] !== INIT_PROVIDER);
  app.provider = [
    ...others,
    {
      $: {
        'android:name': INIT_PROVIDER,
        'android:authorities': '${applicationId}.FacebookInitProvider',
        'tools:node': 'remove',
      },
    },
  ];
  return manifest;
}

function excludeExpoAdapter(podfile) {
  if (podfile.includes(EXCLUDE)) return podfile;
  const next = podfile.replace(/^(\s*)use_expo_modules!\s*$/m, `$1${EXCLUDE}`);
  // A template change must stop the build, not quietly restart the SDK at launch.
  if (next === podfile) throw new Error('withMetaGuards: use_expo_modules! not found in the Podfile');
  return next;
}

function pinFacebookSdk(gradle) {
  const line = `ext.facebookSdkVersion = '${FACEBOOK_SDK_VERSION}'`;
  return gradle.includes('ext.facebookSdkVersion') ? gradle : `${gradle.trimEnd()}\n\n${line}\n`;
}

const withMetaGuards = (config) => {
  config = withAndroidManifest(config, (c) => {
    c.modResults = removeInitProvider(c.modResults);
    return c;
  });
  config = withProjectBuildGradle(config, (c) => {
    c.modResults.contents = pinFacebookSdk(c.modResults.contents);
    return c;
  });
  config = withPodfile(config, (c) => {
    c.modResults.contents = excludeExpoAdapter(c.modResults.contents);
    return c;
  });
  return config;
};

module.exports = withMetaGuards;
module.exports.removeInitProvider = removeInitProvider;
module.exports.excludeExpoAdapter = excludeExpoAdapter;
module.exports.pinFacebookSdk = pinFacebookSdk;
module.exports.FACEBOOK_SDK_VERSION = FACEBOOK_SDK_VERSION;
