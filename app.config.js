/**
 * The Meta App ID and Client Token come from the build environment, never from
 * a committed file (plan 2026-11-05 section 7). Without both, the Meta plugin is
 * left out, `nativeValuesPresent` stays false and the app never touches Meta.
 * app.json holds everything else.
 *
 * ⚠️ runtimeVersion is the fingerprint policy, and this file changes the
 * config it hashes. `eas update` must run with the same two values the build
 * had, or the update gets a different runtime and reaches nobody.
 */
const META_DISPLAY_NAME = 'Pro Audio Training Academy';

function metaValues(env) {
  const appID = (env.META_APP_ID ?? '').trim();
  const clientToken = (env.META_CLIENT_TOKEN ?? '').trim();
  return /^\d+$/.test(appID) && clientToken ? { appID, clientToken } : null;
}

module.exports = ({ config }) => {
  const meta = metaValues(process.env);
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(meta
        ? [
            [
              'react-native-fbsdk-next',
              {
                appID: meta.appID,
                clientToken: meta.clientToken,
                displayName: META_DISPLAY_NAME,
                scheme: `fb${meta.appID}`,
                autoLogAppEventsEnabled: false,
                advertiserIDCollectionEnabled: false,
                isAutoInitEnabled: false,
                // No Apple tracking prompt, ever (owner 2026-11-27): false
                // writes no NSUserTrackingUsageDescription. The flag above
                // writes FacebookAdvertiserIDCollectionEnabled = false (iOS
                // Info.plist and the Android manifest; Android turns it on at
                // run time after the person's yes).
                iosUserTrackingPermission: false,
              },
            ],
          ]
        : []),
    ],
    extra: {
      ...config.extra,
      metaMeasurement: { nativeValuesPresent: meta !== null },
    },
  };
};

module.exports.metaValues = metaValues;
