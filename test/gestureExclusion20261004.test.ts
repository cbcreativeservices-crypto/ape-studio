/**
 * Edge gestures vs lab drags, the platform half (2026-10-04).
 *
 * ANDROID — modules/ape-gesture-exclusion: a leaf native view that asks the
 * system to exclude its bounds from the back gesture
 * (View.setSystemGestureExclusionRects), wired into the dock lane and the
 * miking placement stage. It ships in the next build; on the current store
 * builds (no native module), on iOS and on web it renders nothing.
 *
 * iOS — the native-stack interactive pop is already OFF app-wide
 * (RootNavigator screenOptions gestureEnabled:false, owner 2026-08-11, for
 * exactly this reason: a slider's left end sits in the edge zone). Only a
 * fixed set of read-only routes opt back in. This pins that set as a
 * ratchet (it may only shrink): a lab route with a drag control must never
 * join it.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const MOD = 'modules/ape-gesture-exclusion';

describe('ape-gesture-exclusion — native module', () => {
  it('is an Android-only local Expo module (no iOS fingerprint change)', () => {
    const cfg = JSON.parse(read(`${MOD}/expo-module.config.json`));
    assert.deepEqual(cfg.platforms, ['android']);
    assert.deepEqual(cfg.android.modules, ['expo.modules.apegestureexclusion.ApeGestureExclusionModule']);
  });

  it('the view excludes its own bounds, API 29+ only, clamped to the 200 dp per-edge cap', () => {
    const kt = read(`${MOD}/android/src/main/java/expo/modules/apegestureexclusion/GestureExclusionView.kt`);
    assert.match(kt, /Build\.VERSION\.SDK_INT < Build\.VERSION_CODES\.Q\) return/);
    assert.match(kt, /const val SYSTEM_CAP_DP = 200\.0/);
    assert.match(kt, /min\(value, SYSTEM_CAP_DP\)/);
    assert.match(kt, /systemGestureExclusionRects = listOf\(Rect\(0, top, width, top \+ h\)\)/);
    assert.match(kt, /systemGestureExclusionRects = emptyList\(\)/);
    for (const hook of ['onSizeChanged', 'onLayout', 'onAttachedToWindow']) assert.match(kt, new RegExp(`override fun ${hook}`));
    const mod = read(`${MOD}/android/src/main/java/expo/modules/apegestureexclusion/ApeGestureExclusionModule.kt`);
    assert.match(mod, /Name\("ApeGestureExclusion"\)/);
    assert.match(mod, /View\(GestureExclusionView::class\)/);
  });

  it('JS degrades to nothing when the module is absent — never throws', () => {
    const js = read(`${MOD}/index.tsx`);
    assert.match(js, /Platform\.OS === 'android' \? requireOptionalNativeModule<ExclusionNative>\('ApeGestureExclusion'\) : null/);
    // The view manager is looked up only once the module is known present, inside try.
    assert.match(js, /if \(!native\) return \(NativeZone = null\);\n\s*try \{\n\s*NativeZone = requireNativeViewManager/);
    assert.match(js, /if \(!Zone\) return null;/);
    assert.doesNotMatch(js, /requireNativeModule\(/);
    assert.match(js, /pointerEvents="none"/);
  });

  it('wired into the dock lane and the miking stage, inside the 200 dp budget', () => {
    const lane = read('src/screens/lab/rack/ParamLane.tsx');
    assert.match(lane, /<GestureExclusionZone \/>/);
    assert.match(lane, /height: 48,/);
    const scene = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
    assert.match(scene, /\{!mini && interactive \? <GestureExclusionZone maxHeightDp=\{STAGE_BAND_DP\} \/> : null\}/);
    const band = Number(/export const STAGE_BAND_DP = (\d+);/.exec(read(`${MOD}/index.tsx`))?.[1]);
    assert.ok(48 + band <= 200, `lane 48 + stage ${band} must fit Android's 200 dp per-edge cap`);
  });
});

describe('iOS: the interactive pop stays off on lab drag routes', () => {
  const nav = read('src/navigation/RootNavigator.tsx');
  it('app-wide default is gestureEnabled:false', () => {
    assert.match(nav, /screenOptions=\{\{ headerShown: false, gestureEnabled: false,/);
    assert.match(read('src/navigation/StudyStack.tsx'), /screenOptions=\{\{ headerShown: false, gestureEnabled: false,/);
  });
  it('only the frozen read-only set opts back in (ratchet: may only shrink)', () => {
    const optedIn = [...nav.matchAll(/<Stack\.Screen name="(\w+)"[^>]*options=\{swipe\}/g)].map((m) => m[1]).sort();
    const ALLOWED = [
      'AmplitudeLab', 'AudioLearning', 'AwardProgress', 'CareerFamily', 'CareerFamilyList', 'CareerFinder',
      'CareerFinderAbout', 'CareerFinderResults', 'ConceptModule', 'EarLab', 'LabCategory', 'StartHereTerms',
      'ToolInfo', 'ToolLearn', 'ToolLibrary', 'TubeCard', 'TubeReference',
    ];
    for (const r of optedIn) assert.ok(ALLOWED.includes(r), `${r} opted into the iOS edge swipe — a lab with a drag control must not`);
    assert.equal((nav.match(/gestureEnabled: true/g) ?? []).length, 2, 'only the `swipe` const (and its comment) enable the gesture');
    assert.doesNotMatch(nav, /fullScreenGestureEnabled/);
  });
});
