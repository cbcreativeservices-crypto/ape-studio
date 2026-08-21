// Metro config — extends Expo's default so `.svg` files import as React
// components via react-native-svg-transformer (added 2026-08-17 for the
// Measurement Tools card strips). This is a JS-layer transform only; no native
// change. Recipe: react-native-svg-transformer README (Expo SDK 41+).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
  // Keep Metro's watcher OUT of the big non-app dirs (2026-08-21): the Next.js
  // web/ subproject's .next dev cache emitted a malformed path that CRASHED the
  // watcher (exit 7), and audio_app_archive/ is 370 MB of art the bundler never
  // imports. ROOT-ANCHORED on purpose — a bare /web/ pattern would also block
  // node_modules/**/web/ folders (react-native-svg etc.) and break bundling.
  // Nothing in the RN app imports from these dirs (verified by grep).
  blockList: [
    config.resolver.blockList,
    ...['web', 'audio_app_archive', 'machineA_ingest'].map(
      (dir) =>
        new RegExp(
          `^${(__dirname + require('path').sep + dir).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\\\/].*)?$`,
        ),
    ),
  ]
    .flat()
    .filter(Boolean),
};

module.exports = config;
