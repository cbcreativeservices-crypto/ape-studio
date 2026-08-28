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
  // WEB-ONLY SKIA MUST NOT ENTER A NATIVE BUNDLE (2026-08-28).
  //
  // index.ts loads CanvasKit for web behind `if (Platform.OS === 'web')` with a
  // dynamic import. That guard is a RUNTIME check — Metro still walks the
  // import at BUILD time, so `canvaskit-wasm` joined the native graph, and it
  // requires Node's `fs`, which React Native has no shim for:
  //   Unable to resolve module fs from node_modules/canvaskit-wasm/bin/full/canvaskit.js
  // The dev client hid this because it bundles LAZILY (only what runtime asks
  // for); a full bundle — `expo export`, an EAS release build — walks the whole
  // graph and FAILS. Verified: GET /index.bundle?platform=ios returned HTTP 500
  // with that error before this fix, HTTP 200 after.
  //
  // CanvasKit is web-only by design (native Skia is linked into the binary), so
  // on any non-web platform we resolve both the Skia web entry and canvaskit-wasm
  // to an empty module. The guarded code never runs on native, so nothing is lost.
  resolveRequest: (context, moduleName, platform) => {
    if (
      platform !== 'web' &&
      (moduleName === 'canvaskit-wasm' ||
        moduleName.startsWith('canvaskit-wasm/') ||
        moduleName.startsWith('@shopify/react-native-skia/lib/module/web'))
    ) {
      return { type: 'empty' };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
