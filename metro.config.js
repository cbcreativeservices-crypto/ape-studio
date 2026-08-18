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
};

module.exports = config;
