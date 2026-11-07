/**
 * The items pushed back to the next store build (owner 2026-11-07: "include
 * everything pushed back in this one build"), must-do rows E4, E5 and D20.
 *
 *  1. MultiMeter snapshot TAG LOCATION restored (expo-location, the loader,
 *     the purpose strings, foreground-only permissions).
 *  2. Fill-in and Matching end-of-round review with "Research and learn more ·
 *     View images" (features/study/studyRounds.ts + RoundReview.tsx).
 *  3. Android camera optional (already pinned in metaMeasurement_20261105;
 *     re-checked here as part of the set).
 *  4. Stereo Imaging MONO CHECK folds AFTER the pan (Effects.hpp, shared by
 *     Android). The arithmetic is pinned by the native golden suite,
 *     modules/ape-dsp/test/golden_main.cpp section "12i-b".
 *  5. Android: capture and every output voice stop when the React instance is
 *     about to die (ReactHost before-destroy listener), never on a screen
 *     handoff. Kotlin is not compiled on Windows; this pins the shape.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { ROUND_TERMS, noteAnswer, roundDue, roundTarget, type RoundEntry } from '../src/features/study/studyRounds.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('1. MultiMeter TAG LOCATION is back, foreground only', () => {
  const pkg = JSON.parse(read('package.json'));
  const app = JSON.parse(read('app.json')).expo;
  const SENTENCE =
    'Used only when you choose to tag a measurement snapshot with where it was taken. Location is stored with the snapshot on this device and never shared automatically.';

  it('the package is installed and literally required by the loader table', () => {
    assert.ok(pkg.dependencies['expo-location'], 'expo-location in dependencies');
    assert.match(read('src/features/tools/capture/optionalModule.ts'), /'expo-location': \(\) => require\('expo-location'\),/);
  });
  it('iOS: every location purpose string is the approved sentence (none left at the SDK default)', () => {
    assert.equal(app.ios.infoPlist.NSLocationWhenInUseUsageDescription, SENTENCE);
    const plugin = app.plugins.find((p: unknown) => Array.isArray(p) && p[0] === 'expo-location');
    assert.ok(plugin, 'expo-location listed with its options (otherwise prebuild auto-applies it with "Allow $(PRODUCT_NAME)…")');
    assert.equal(plugin[1].locationWhenInUsePermission, SENTENCE);
    assert.equal(plugin[1].locationAlwaysAndWhenInUsePermission, SENTENCE);
    assert.equal(plugin[1].locationAlwaysPermission, SENTENCE);
    // Foreground only: no background mode, no Android background or foreground service.
    for (const k of ['isIosBackgroundLocationEnabled', 'isAndroidBackgroundLocationEnabled', 'isAndroidForegroundServiceEnabled', 'isAndroidMotionActivityEnabled']) {
      assert.ok(!plugin[1][k], `${k} stays off`);
    }
  });
  it('Android: coarse + fine only, never background', () => {
    const perms: string[] = app.android.permissions;
    assert.ok(perms.includes('android.permission.ACCESS_COARSE_LOCATION'));
    assert.ok(perms.includes('android.permission.ACCESS_FINE_LOCATION'));
    assert.ok(!perms.some((p) => /BACKGROUND_LOCATION|FOREGROUND_SERVICE/.test(p)));
  });
  it('3. the camera stays optional on Android', () => {
    assert.ok(app.plugins.includes('./plugins/withAndroidCameraOptional'));
  });
});

describe('2. Fill-in and Matching: end-of-round review', () => {
  const item = (id: string) => ({ id, term: `T${id}`, definition: `D${id}`, wikipedia_url: null, search_query: `q${id}` });

  it('a round is ROUND_TERMS distinct terms, or the whole of a smaller deck', () => {
    assert.equal(ROUND_TERMS, 10);
    assert.equal(roundTarget(162), 10);
    assert.equal(roundTarget(4), 4);
    assert.equal(roundTarget(0), 1);
    let r: RoundEntry[] = [];
    for (let i = 0; i < 9; i++) r = noteAnswer(r, item(String(i)), true);
    assert.equal(roundDue(r, 162), false);
    r = noteAnswer(r, item('9'), false, 'wrong');
    assert.equal(roundDue(r, 162), true);
    assert.equal(roundDue([], 0), false, 'an empty round is never due');
  });
  it('one entry per term; a miss stays marked and keeps the wrong pick', () => {
    let r: RoundEntry[] = [];
    r = noteAnswer(r, item('a'), false, 'Headroom');
    r = noteAnswer(r, item('a'), true);
    r = noteAnswer(r, item('b'), true);
    assert.equal(r.length, 2);
    assert.deepEqual(
      { gotRight: r[0].gotRight, missed: r[0].missed, lastWrong: r[0].lastWrong, searchQuery: r[0].searchQuery },
      { gotRight: true, missed: true, lastWrong: 'Headroom', searchQuery: 'qa' },
    );
    assert.equal(r[1].missed, false);
  });
  it('the panel carries the research links for every term, with the stored article and search phrase', () => {
    const p = read('src/features/study/RoundReview.tsx');
    assert.match(p, /<ResearchMoreLink term=\{e\.term\} wikipediaUrl=\{e\.wikipediaUrl\} searchQuery=\{e\.searchQuery\}/);
    assert.match(p, /entries\.map\(\(e\) =>/);
    assert.match(p, /label="Next round"/);
  });
  for (const [file, method] of [
    ['src/screens/study/FillInBlankScreen.tsx', 'fill_in_blank'],
    ['src/screens/study/MatchingScreen.tsx', 'matching'],
  ] as const) {
    it(`${method}: answers feed the round, the review replaces the screen, then practice carries on`, () => {
      const s = read(file);
      assert.match(s, /roundRef\.current = noteAnswer\(roundRef\.current, /);
      assert.match(s, /if \(review\) \{\s*return \(\s*<RoundReview\s+method="/);
      // The pace clock pauses for the reading and resumes as it was; full screen likewise.
      assert.match(s, new RegExp(`if \\(runningRef\\.current\\) setRunning\\('${method}', false\\);`));
      assert.match(s, new RegExp(`if \\(reviewResume\\.current\\.running\\) setRunning\\('${method}', true\\);`));
      assert.match(s, /if \(reviewResume\.current\.fullscreen\) setFullscreen\(true\);/);
    });
  }
  it('Fill-in shows the review instead of the next question only when the round is full', () => {
    const s = read('src/screens/study/FillInBlankScreen.tsx');
    assert.match(s, /if \(reviewNow\) \{\s*openReview\(\);\s*return;\s*\}[\s\S]*?setQIdx\(\(i\) => i \+ 1\);/);
    assert.match(s, /const closeReview = useCallback\(\(\) => \{\s*session\.current\?\.touch\(\);\s*setReview\(null\);\s*setQIdx\(\(i\) => i \+ 1\);/);
  });
  it('Matching still auto-advances between boards; only a full round stops for the review', () => {
    const s = read('src/screens/study/MatchingScreen.tsx');
    assert.match(s, /if \(reviewNow\) openReviewRef\.current\(\);\s*else goBoardRef\.current\(1\);/);
    assert.match(s, /const closeReview = useCallback\(\(\) => \{\s*setReview\(null\);\s*goBoardRef\.current\(1\);/);
  });
});

describe('4. Stereo Imaging: MONO CHECK folds after the pan', () => {
  const hpp = read('modules/ape-dsp/ios/core/Effects.hpp');
  const body = hpp.slice(hpp.indexOf('class StereoEffect'), hpp.indexOf('class EffectChain'));
  it('pan gains first, then the fold, then the write', () => {
    const pan = body.indexOf('l *= panL * 1.41421356;');
    const fold = body.indexOf('if (fold) { l = r = 0.5 * (l + r); }');
    const write = body.indexOf('L[i] = static_cast<float>(l);');
    assert.ok(pan > 0 && fold > pan && write > fold, `order pan ${pan} < fold ${fold} < write ${write}`);
  });
  it('the golden vectors cover it', () => {
    const g = read('modules/ape-dsp/test/golden_main.cpp');
    assert.match(g, /MONO CHECK \+ PAN L: the right channel is not silent/);
    assert.match(g, /MONO CHECK \+ PAN L: each side = half the panned L/);
  });
  it('the caption no longer promises a full SIDE cancel with PAN off centre', () => {
    const c = read('src/screens/lab/fxLabConfigs.tsx');
    assert.match(c, /v\[P\.monoFold\] > 0\.5 && v\[P\.pan\] !== 0 \? ' With PAN off centre, the fold adds what the pan left, so the SIDE does not fully cancel\.'/);
    assert.match(c, /\(v\[P\.monoFold\] > 0\.5 && v\[P\.pan\] === 0\) \|\| v\[P\.widthPct\] === 0/);
  });
});

describe('5. Android: the engine lets go of the hardware when the React instance dies', () => {
  const kt = read('modules/ape-dsp/android/src/main/java/expo/modules/apedsp/ApeDspModule.kt');
  const stop = kt.slice(kt.indexOf('private fun stopAudioForInstanceDeath()'), kt.indexOf('override fun definition()'));
  it('a ReactHost before-destroy listener is added on create and removed on the way out', () => {
    assert.match(kt, /reactHost = \(appContext\.reactContext\?\.applicationContext as\? ReactApplication\)\?\.reactHost/);
    assert.match(kt, /it\.addBeforeDestroyListener\(listener\)/);
    assert.match(kt, /onInstanceDying\?\.let \{ reactHost\?\.removeBeforeDestroyListener\(it\) \}/);
    assert.match(kt, /OnDestroy \{\s*detachFromReactHost\(\)/);
    assert.match(read('modules/ape-dsp/android/build.gradle'), /implementation 'com\.facebook\.react:react-android'/);
  });
  it('it stops capture and every output voice, and does not free the engine', () => {
    for (const call of ['nativeStopCapture(handle)', 'nativeGenStop(handle)', 'nativeBinStop(handle)', 'nativeModStop(handle)']) {
      assert.ok(stop.includes(call), call);
    }
    assert.ok(!stop.includes('nativeDestroy'), 'OnDestroy still owns the free');
    assert.match(stop, /outputLostPoll\.removeCallbacks\(outputLostCheck\)/);
  });
  it('the warm mic session is untouched: nothing on background or activity events stops capture', () => {
    assert.doesNotMatch(kt, /OnActivityEntersBackground|OnActivityDestroys|OnActivityEntersForeground/);
    assert.equal((kt.match(/stopAudioForInstanceDeath\(\)/g) ?? []).length, 2, 'declared once, called only from the listener');
  });
});
