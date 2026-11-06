/**
 * The CAMERA permission makes Play assume a camera is required, which hides the
 * app from devices without one (audit 2026-10-24). Only the Light-Pulse counter
 * uses it, so the app declares the camera optional.
 */
const { withAndroidManifest } = require('expo/config-plugins');

const CAMERA = 'android.hardware.camera';

function markCameraOptional(manifest) {
  const others = (manifest.manifest['uses-feature'] ?? []).filter((f) => f.$?.['android:name'] !== CAMERA);
  manifest.manifest['uses-feature'] = [...others, { $: { 'android:name': CAMERA, 'android:required': 'false' } }];
  return manifest;
}

const withAndroidCameraOptional = (config) =>
  withAndroidManifest(config, (c) => {
    c.modResults = markCameraOptional(c.modResults);
    return c;
  });

module.exports = withAndroidCameraOptional;
module.exports.markCameraOptional = markCameraOptional;
