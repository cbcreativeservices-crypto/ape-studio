/**
 * withAndroidNavTransitions — Android screen transitions at the SAME pace as
 * iOS (owner 2026-10-23: "both phones should match look and feel. those
 * different settings were not approved by me").
 *
 * Why a plugin: native-stack's `animationDuration` is iOS-only. On Android,
 * react-native-screens (4.26.2) plays fixed XML animations — area FADE 150 ms
 * (rns_fade_in / rns_fade_out) and content PUSH at the system's
 * config_mediumAnimTime (rns_slide_*). An APP resource with the same name wins
 * over the library's, so this writes our own copies into the generated
 * android/app/src/main/res/anim at prebuild.
 *
 * The numbers are the app's one source of truth, src/navigation/reduceMotionNav.ts:
 * NAV_FADE 280 ms, iOS NAV_PUSH ('simple_push') 490 ms. Change them THERE and
 * here together (test/androidNavTransitions_20261023.test.ts pins the pair).
 * Reduce Motion is unaffected: it uses NAV_PUSH_REDUCED (a 170 ms 'fade' on
 * iOS; on Android every 'fade' plays these files).
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const FADE_MS = 280;
const PUSH_MS = 490;

const alpha = (from, to) => `<?xml version="1.0" encoding="utf-8"?>
<!-- App override of react-native-screens' ${from === '0.0' ? 'rns_fade_in' : 'rns_fade_out'} (plugins/withAndroidNavTransitions.js) -->
<alpha xmlns:android="http://schemas.android.com/apk/res/android"
    android:fromAlpha="${from}"
    android:toAlpha="${to}"
    android:duration="${FADE_MS}" />
`;

const slide = (name, from, to) => `<?xml version="1.0" encoding="utf-8"?>
<!-- App override of react-native-screens' ${name} (plugins/withAndroidNavTransitions.js) -->
<translate xmlns:android="http://schemas.android.com/apk/res/android"
    android:duration="${PUSH_MS}"
    android:interpolator="@android:interpolator/accelerate_decelerate"
    android:fromXDelta="${from}"
    android:toXDelta="${to}" />
`;

const FILES = {
  'rns_fade_in.xml': alpha('0.0', '1.0'),
  'rns_fade_out.xml': alpha('1.0', '0.0'),
  'rns_slide_in_from_right.xml': slide('rns_slide_in_from_right', '100%', '0%'),
  'rns_slide_out_to_left.xml': slide('rns_slide_out_to_left', '0%', '-100%'),
  'rns_slide_in_from_left.xml': slide('rns_slide_in_from_left', '-100%', '0%'),
  'rns_slide_out_to_right.xml': slide('rns_slide_out_to_right', '0%', '100%'),
};

module.exports = function withAndroidNavTransitions(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'anim');
      fs.mkdirSync(dir, { recursive: true });
      for (const [name, xml] of Object.entries(FILES)) fs.writeFileSync(path.join(dir, name), xml);
      return cfg;
    },
  ]);
};
module.exports.FADE_MS = FADE_MS;
module.exports.PUSH_MS = PUSH_MS;
module.exports.FILES = FILES;
