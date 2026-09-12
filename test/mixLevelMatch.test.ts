/**
 * The mixing labs' A/B level-match ceiling.
 *
 * `matchGainDb` exists so an A/B comparison is decided by DECISIONS rather than
 * by loudness — the page notes say so in as many words. An unclamped match
 * breaks that promise in the one direction nobody checks: upward. Every sample
 * past +/-1 is hard-clamped by the WAV writer (`earDsp.ts`), so a match that
 * overshoots the ceiling hands the learner distortion and calls it a fair
 * comparison.
 *
 * SOLO made that reachable in ONE TAP (audit 2026-09-12). Soloing the snare on
 * Beginning Mixing page 5 asked for **+14.55 dB** and landed the render at
 * **+8.08 dBFS** — measured on the real renderer. Two independent guards now
 * stand in the way and both are pinned here:
 *   1. a soloed render is not level-matched at all (it is a monitor feed, not
 *      a comparison) — `soloActiveIn` gates it at the call site;
 *   2. `matchGainDb` itself can never push a render past -1 dBFS.
 *
 * Mirror convention as in `grLadder.test.ts`: `mixAudio.ts` pulls the DSP kit
 * and cannot be imported under `node --test`, so the pure arithmetic is
 * restated and the source is pinned so the mirror cannot drift.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

type Mix = { rmsDb: number; peakDb: number };

/** Mirror of matchGainDb (mixAudio.ts). */
const matchGainDb = (a: Mix, b: Mix) => {
  const want = a.rmsDb - b.rmsDb;
  if (want <= 0) return want;
  return Math.min(want, Math.max(0, -1 - b.peakDb));
};

/** Real measurements from the shipped renderer, Beginning Mixing page 5. */
const WALL: Mix = { rmsDb: -17.59, peakDb: -0.99 };
const SOLO_SNARE: Mix = { rmsDb: -32.14, peakDb: -6.47 };
const SOLO_KICK: Mix = { rmsDb: -26.02, peakDb: -7.7 };
const TAUGHT_MIX: Mix = { rmsDb: -20.31, peakDb: -3.84 };

describe('A/B level match never clips', () => {
  test('a normal taught-mix comparison is untouched by the ceiling', () => {
    // The clamp must not disturb the case the feature exists for.
    const g = matchGainDb(WALL, TAUGHT_MIX);
    assert.equal(g, TAUGHT_MIX.rmsDb === 0 ? 0 : WALL.rmsDb - TAUGHT_MIX.rmsDb);
    assert.ok(TAUGHT_MIX.peakDb + g <= -1, 'a normal match stays under the ceiling on its own');
  });

  test('the snare solo that measured +8.08 dBFS can no longer get there', () => {
    const g = matchGainDb(WALL, SOLO_SNARE);
    assert.ok(g < 14.55, `unclamped this asked for +14.55 dB; got ${g.toFixed(2)}`);
    assert.ok(SOLO_SNARE.peakDb + g <= -1, `matched peak must stay under -1 dBFS; got ${(SOLO_SNARE.peakDb + g).toFixed(2)}`);
  });

  test('no single-channel solo can drive a render over the ceiling', () => {
    for (const m of [SOLO_SNARE, SOLO_KICK]) {
      assert.ok(m.peakDb + matchGainDb(WALL, m) <= -1);
    }
  });

  test('the clamp is a ceiling, not a floor — quiet targets still get pulled DOWN', () => {
    const loud: Mix = { rmsDb: -6, peakDb: -0.5 };
    assert.ok(matchGainDb(WALL, loud) < 0, 'a louder render must still be attenuated to match');
  });

  test('a hot-but-honest console mix is NOT quietened by the ceiling', () => {
    // The near-miss the first version of this clamp caused: a mix peaking at
    // -0.2 dBFS wanting +1.5 dB would have been played 2.3 dB BELOW the
    // reference, silently, under a note promising it is matched.
    const hot: Mix = { rmsDb: -19.09, peakDb: -0.2 };
    const g = matchGainDb(WALL, hot);
    assert.ok(g >= 0, `a boost must never be turned into an attenuation; got ${g.toFixed(2)}`);
    assert.ok(g <= 1.5, 'and it must still be trimmed to the ceiling');
  });

  test('source pin: both guards are present', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const audio = readFileSync(join(here, '..', 'src', 'screens', 'lab', 'mixing', 'audio', 'mixAudio.ts'), 'utf8');
    assert.match(audio, /Math\.min\(want, Math\.max\(0, -1 - b\.peakDb\)\)/, 'matchGainDb must clamp a BOOST to the ceiling');
    assert.match(audio, /if \(want <= 0\) return want;/, 'attenuation must always be honoured in full — a ceiling must never become a floor');
    assert.match(audio, /export function soloActiveIn/, 'soloActiveIn must exist for the call site to gate on');
    const kit = readFileSync(join(here, '..', 'src', 'screens', 'lab', 'mixing', 'kit.tsx'), 'utf8');
    assert.match(kit, /!soloActiveIn\(v\.settings\)/, 'a soloed render must not be level-matched at all');
    assert.match(kit, /playerRef\.current\?\.stop\(\);/, 'a console edit must stop the now-stale sounding render');
  });
});
