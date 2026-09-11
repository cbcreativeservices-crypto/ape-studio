/**
 * R6c lab-credit bridge — the STATIC unit sets.
 *
 * Foundations, Mic Principles and Speaker Coverage used to declare their unit
 * ids only at runtime (registerLabUnits on mount). retryUnsent() runs during
 * labCompletion's hydrate() at BOOT, before any lab screen mounts, so unitsFor()
 * found nothing and a lab completed offline was never retried until the learner
 * reopened it. They now also declare the set in a React-free units.ts, the same
 * way Patchbay and Connector Select do.
 *
 * Two things have to hold, and neither can be checked by the screens' own
 * __DEV__ guards from here (importing a screen would drag in React + Skia):
 *   1. the ids are EXACTLY the ones the screens have always marked — Foundations
 *      marks String(stepIndex); Mic/Speaker mark the section `key`. Change the
 *      shape and every already-banked completion on a device is orphaned.
 *   2. the modules stay pure data — no React/Skia import may creep in, because
 *      labCompletion is loaded at boot.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../src/${rel}`, import.meta.url)), 'utf8');

describe('lab-credit units (af_foundations)', () => {
  it('key + count + one unit per step, keyed by INDEX (0..13)', async () => {
    const { FOUNDATIONS_LAB_KEY, FOUNDATIONS_STEP_COUNT, FOUNDATIONS_UNITS } = await import(
      '../src/screens/lab/foundations/units.ts'
    );
    assert.equal(FOUNDATIONS_LAB_KEY, 'af_foundations');
    assert.equal(FOUNDATIONS_STEP_COUNT, 14);
    assert.equal(FOUNDATIONS_UNITS.length, FOUNDATIONS_STEP_COUNT);
    assert.equal(new Set(FOUNDATIONS_UNITS).size, FOUNDATIONS_STEP_COUNT);
    FOUNDATIONS_UNITS.forEach((u: string, i: number) => assert.equal(u, String(i)));
  });

  it('the screen still marks String(step) and STEPS still has 14 entries', () => {
    const screen = src('screens/lab/foundations/FoundationsCourseScreen.tsx');
    // Format-TOLERANT on purpose: this reads production source, so anchoring on
    // exact indentation or a trailing comma turns any reformat into a false
    // failure (the first version did exactly that and flaked once).
    assert.match(screen, /markLabUnit\(\s*FOUNDATIONS_LAB_KEY\s*,\s*String\(step\)\s*\)/);
    // One `key: 'mN'` per step in the STEPS array.
    const stepKeys = screen.match(/\bkey:\s*'m\d+'/g) ?? [];
    assert.equal(stepKeys.length, 14);
  });
});

describe('lab-credit units (af_mic_principles / af_speaker_coverage)', () => {
  it('unit ids are the section keys, in order, unique', async () => {
    const {
      MIC_PRINCIPLES_LAB_KEY,
      MIC_PRINCIPLES_UNITS,
      SPEAKER_COVERAGE_LAB_KEY,
      SPEAKER_COVERAGE_UNITS,
    } = await import('../src/screens/lab/micspeaker/units.ts');
    assert.equal(MIC_PRINCIPLES_LAB_KEY, 'af_mic_principles');
    assert.equal(SPEAKER_COVERAGE_LAB_KEY, 'af_speaker_coverage');
    assert.deepEqual(MIC_PRINCIPLES_UNITS, [
      'capsule',
      'polar',
      'distance',
      'proximity',
      'offaxis',
      'stereo',
      'pop',
      'shock',
      'hand',
      'mistakes',
    ]);
    assert.deepEqual(SPEAKER_COVERAGE_UNITS, ['top', 'side', 'read']);
    assert.equal(new Set(MIC_PRINCIPLES_UNITS).size, MIC_PRINCIPLES_UNITS.length);
    assert.equal(new Set(SPEAKER_COVERAGE_UNITS).size, SPEAKER_COVERAGE_UNITS.length);
  });

  it("each screen's SECTIONS keys match its static list, in order", () => {
    // SECTIONS entries are the only `{ key, label, title, … }` shape in these
    // files (the mics/windscreen tables next to them carry no `title`).
    // Whitespace-TOLERANT: this reads production source, and pinning exact
    // spacing made a reformat — or an edit landing mid-run — look like drift.
    const keysOf = (file: string) =>
      [...src(file).matchAll(/\bkey:\s*'([a-z]+)'\s*,\s*label:\s*'[^']*'\s*,\s*title:/g)].map(
        (m) => m[1],
      );
    assert.deepEqual(keysOf('screens/lab/micspeaker/MicPrinciplesLabScreen.tsx'), [
      'capsule',
      'polar',
      'distance',
      'proximity',
      'offaxis',
      'stereo',
      'pop',
      'shock',
      'hand',
      'mistakes',
    ]);
    assert.deepEqual(keysOf('screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx'), [
      'top',
      'side',
      'read',
    ]);
  });
});

describe('units modules stay boot-safe (no React/Skia)', () => {
  it('every units.ts the completion store imports is pure data', () => {
    for (const rel of [
      'screens/lab/foundations/units.ts',
      'screens/lab/micspeaker/units.ts',
      'screens/lab/patchbay/units.ts',
      'screens/lab/connectorselect/units.ts',
    ]) {
      const text = src(rel);
      assert.equal(/\bfrom\s+'react/.test(text), false, `${rel} imports react`);
      assert.equal(/@shopify\/react-native-skia/.test(text), false, `${rel} imports skia`);
      assert.equal(/\bfrom\s+'react-native'/.test(text), false, `${rel} imports react-native`);
    }
  });

  it('LAB_UNITS carries a static entry for all three previously runtime-only labs', () => {
    const store = src('features/lab/labCompletion.ts');
    assert.match(store, /af_foundations: FOUNDATIONS_UNITS/);
    assert.match(store, /af_mic_principles: MIC_PRINCIPLES_UNITS/);
    assert.match(store, /af_speaker_coverage: SPEAKER_COVERAGE_UNITS/);
  });
});
