/**
 * The Android release manifest drops three permissions nothing in the app uses
 * (owner 2026-11-11, launch must-do E6, 1.0.1 store build):
 *
 *   SYSTEM_ALERT_WINDOW     Expo's base template (main AndroidManifest.xml).
 *                           Only React Native's dev tools use it, and RN's own
 *                           debug manifest keeps it for debug builds.
 *   READ_EXTERNAL_STORAGE   merged from expo-media-library, expo-file-system
 *   WRITE_EXTERNAL_STORAGE  and expo-image, each with maxSdkVersion 32.
 *
 * Why blocking the storage pair is safe NOW, when blocking it on 2026-09-19
 * broke Android SAVE (docs/APE_NEXT_BUILD_CHECKLIST.md): that save called
 * expo-media-library's requestPermissionsAsync, which Android denies for an
 * undeclared permission. Since 2026-10-09 Android SAVE opens the Share sheet
 * instead and never reaches expo-media-library (harmoExport.ts), and every
 * file the app writes lives in its own cache directory, which needs no
 * permission on any Android the app supports (minSdk 24). The ratchets below
 * fail if either of those stops being true.
 *
 * ⚠️ app.json is a fingerprint input: this lands only with a native build.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const walk = (dir: string, re: RegExp, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, re, out);
    else if (re.test(name)) out.push(relative(ROOT, p).split(sep).join('/'));
  }
  return out;
};

const { expo } = JSON.parse(read('app.json'));

describe('app.json: the Android blocked list', () => {
  it('is exactly this list (it may only grow, and only with the owner)', () => {
    assert.deepEqual([...expo.android.blockedPermissions].sort(), [
      'android.permission.ACCESS_ADSERVICES_AD_ID',
      'android.permission.ACCESS_ADSERVICES_ATTRIBUTION',
      'android.permission.ACCESS_ADSERVICES_CUSTOM_AUDIENCE',
      'android.permission.ACCESS_ADSERVICES_TOPICS',
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ]);
  });

  it('the asked-for permissions are untouched, and none is also blocked', () => {
    assert.deepEqual(expo.android.permissions, [
      'android.permission.CAMERA',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'com.google.android.gms.permission.AD_ID',
    ]);
    for (const p of expo.android.permissions) assert.ok(!expo.android.blockedPermissions.includes(p), p);
  });
});

describe('why the storage pair can go: nothing on Android needs it', () => {
  it('Android SAVE opens the Share sheet and never reaches expo-media-library', () => {
    const src = code('src/screens/lab/harmoExport.ts');
    assert.match(src, /export function isSaveAvailable\(\): boolean \{\s+if \(Platform\.OS === 'android'\) return shareImage\.isAvailable\(\);/);
    const save = src.slice(src.indexOf('export async function saveToPhotos'));
    const android = save.indexOf("if (Platform.OS === 'android') {");
    const media = save.indexOf('const ml = mediaLib();');
    assert.ok(android >= 0 && media > android, 'the Android branch comes first');
    assert.match(
      save,
      /if \(Platform\.OS === 'android'\) \{\s+if \(ref == null \|\| !shareImage\.isAvailable\(\)\) return 'unavailable';\s+return \(await shareImage\.captureAndShare\(ref, 'Save image'\)\) \? 'shared' : 'failed';\s+\}/,
    );
  });

  it('expo-media-library is reached from one file only (and the optional-module table)', () => {
    const users = walk(join(ROOT, 'src'), /\.tsx?$/).filter((f) => /expo-media-library/.test(code(f)));
    assert.deepEqual(users.sort(), ['src/features/tools/capture/optionalModule.ts', 'src/screens/lab/harmoExport.ts']);
  });

  it('every file the app writes is in its own cache directory: no shared storage', () => {
    const files = walk(join(ROOT, 'src'), /\.tsx?$/);
    const fsUsers = files.filter((f) => /from 'expo-file-system/.test(code(f)));
    assert.deepEqual(fsUsers.sort(), [
      'src/features/credentials/certificatePdf.ts',
      'src/features/ear/earPlayer.ts',
      'src/features/lab/labClipBuffer.ts',
      'src/screens/lab/cymatics/galleryExport.ts',
    ]);
    for (const f of fsUsers) {
      const src = code(f);
      assert.match(src, /FileSystem\.cacheDirectory/, f);
      assert.ok(!/documentDirectory|StorageAccessFramework|bundleDirectory/.test(src), f);
    }
    for (const f of files) {
      assert.ok(!/['"`]\/(sdcard|storage\/emulated)\b/.test(code(f)), f);
    }
  });
});

describe('why SYSTEM_ALERT_WINDOW can go: nothing draws over other apps', () => {
  it('no app code or local native module uses an overlay window', () => {
    const files = [
      ...walk(join(ROOT, 'src'), /\.tsx?$/),
      ...walk(join(ROOT, 'modules'), /\.(kt|java|tsx?)$/),
      ...walk(join(ROOT, 'plugins'), /\.js$/),
    ];
    for (const f of files) {
      assert.ok(!/canDrawOverlays|TYPE_APPLICATION_OVERLAY|ACTION_MANAGE_OVERLAY_PERMISSION|SYSTEM_ALERT_WINDOW/.test(read(f)), f);
    }
  });
});
