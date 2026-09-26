/**
 * GUARD — every recording the Bass Guitar Lab can ask for is a published
 * `bass_fretboard` asset (owner 2026-09-25: the lab plays the real
 * recordings, not the generator). The lab derives asset keys from its
 * selection; this checks every derivable key against the published mapping.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASS_LAB_KEY, frettedSampleKey, harmonicSampleKey, openSampleKey, type BassString } from '../src/features/lab/bassSamples.ts';

const mapping = JSON.parse(
  readFileSync(join(process.cwd(), 'docs', 'lab_audio_asset_mapping_COMPLETED_2026-09-15.json'), 'utf8'),
) as { lab_key: string; asset_key: string; access_tier: string }[];
const published = new Set(mapping.filter((r) => r.lab_key === BASS_LAB_KEY).map((r) => r.asset_key));
const STRINGS: BassString[] = ['e', 'a', 'd', 'g'];

describe('bass lab recordings', () => {
  test('the lab key names 72 published assets, all public', () => {
    const rows = mapping.filter((r) => r.lab_key === BASS_LAB_KEY);
    assert.equal(rows.length, 72);
    assert.ok(rows.every((r) => r.access_tier === 'public'));
  });

  test('every string × fret 0–12 resolves to a published chromatic recording', () => {
    for (const s of STRINGS) {
      for (let f = 0; f <= 12; f++) {
        const k = frettedSampleKey(s, f);
        assert.ok(published.has(k), `${k} is not a published asset`);
      }
    }
    assert.equal(frettedSampleKey('e', 0), 'chromatic-bass-e-string-0-fret-e');
    assert.equal(frettedSampleKey('a', 1), 'chromatic-bass-a-string-1-fret-asharp');
    assert.equal(frettedSampleKey('g', 12), 'chromatic-bass-g-string-12-fret-g');
  });

  test('every string × harmonic ½ ⅓ ¼ ⅕ resolves to a published recording', () => {
    for (const s of STRINGS) {
      for (const n of [2, 3, 4, 5]) {
        const k = harmonicSampleKey(s, n);
        assert.ok(k && published.has(k), `${k} is not a published asset`);
      }
    }
    assert.equal(harmonicSampleKey('d', 2), 'bass-d-string-half-harmonic-3');
    assert.equal(harmonicSampleKey('e', 4), 'bass-e-string-forth-harmonic-1');
    assert.equal(harmonicSampleKey('e', 6), null);
  });

  test('every open string is a published recording', () => {
    for (const s of STRINGS) assert.ok(published.has(openSampleKey(s)));
  });
});
