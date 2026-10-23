/**
 * Fact-audit fix pass, Round 2, group C_facts_lessons (2026-10-22): Computer
 * B's fact-check return — weekly notification facts (curated JSON), guided
 * lessons / tool help, and the src/data copy files. A representative sample of
 * the fixes is pinned so the wrong claim cannot come back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const raw = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
// Whitespace collapsed so strings concatenated across source lines read as one.
const read = (rel: string) => raw(rel).replace(/\s+/g, ' ');

type Entry = { term: string; body: string };
const MIS = JSON.parse(raw('src/features/notifications/curated/misunderstoodTerms.json')) as Entry[];
const ODD = JSON.parse(raw('src/features/notifications/curated/oddTerms.json')) as Entry[];
const body = (list: Entry[], term: string) => {
  const hits = list.filter((e) => e.term === term);
  assert.equal(hits.length, 1, `exactly one entry for ${term}`);
  return hits[0].body;
};

const CONTENT = read('src/features/lab/guidedLessons/content.ts');
const HELP = read('src/features/lab/guidedLessons/toolHelp.tsx');
const LABREQ = read('src/data/labRequirements.ts');
const CRED = read('src/data/credentialCopy.ts');
const ABOUT = read('src/data/topicAbout.ts');

describe('curated lists keep their shape after the Round 2 edits', () => {
  for (const [name, list] of [['misunderstood', MIS], ['odd', ODD]] as const) {
    it(`${name}: every entry is {term, body}, body ≤ 160 chars`, () => {
      for (const e of list) {
        assert.deepEqual(Object.keys(e).sort(), ['body', 'term']);
        assert.ok(e.body.length > 0 && e.body.length <= 160, `${e.term}: ${e.body.length} chars`);
      }
    });
  }
});

describe('weekly notification facts', () => {
  it('Round 1 note: "dry" agrees with the Dry monitor mix item (no added reverb/delay, not untouched)', () => {
    const wet = body(MIS, 'Wet monitor mix');
    assert.ok(wet.includes('dry has none, though EQ may apply'));
    assert.ok(!wet.includes('dry is untouched'));
    assert.ok(body(MIS, 'Dry monitor mix').includes('no added reverb or delay'));
  });
  it('F095263: a PPM reads near-peaks, not a smoothed average', () => {
    const b = body(MIS, 'Audio metering scale');
    assert.ok(b.includes('a PPM near-peaks'));
    assert.ok(!b.includes('VU and PPM read differently smoothed averages'));
  });
  it('F095766: delay time sets the gap between each repeat', () => {
    const b = body(MIS, 'Delay Time');
    assert.ok(b.includes('the gap between each repeat'));
    assert.ok(!b.includes('only sets the gap before the first repeat'));
  });
  it('F096213: thermal noise depends on bandwidth too', () => {
    const b = body(MIS, 'Johnson–Nyquist noise');
    assert.ok(b.includes('resistance, temperature and bandwidth'));
    assert.ok(!b.includes('resistance and temperature alone'));
  });
  it('F096313: current-feedback parts are the GBW exception, not decompensated ones', () => {
    const b = body(MIS, 'GBW');
    assert.ok(b.includes('current-feedback parts'));
    assert.ok(!b.includes('multi-pole or decompensated parts'));
  });
  it('F096429: CCIF dates from the 1920s', () => {
    const b = body(ODD, 'CCIF IMD');
    assert.ok(b.includes('a 1920s telephone body'));
    assert.ok(!b.includes('1930s'));
  });
  it('F096748: elephant rumbles are airborne and seismic', () => {
    const b = body(ODD, 'Seismic-acoustic spectrogram');
    assert.ok(b.includes('travel through the air and also shake the ground'));
    assert.ok(!b.includes('not the air'));
  });
  it('F096809: one night plugged in does not kill an active-pickup battery', () => {
    const b = body(ODD, 'Active pickup');
    assert.ok(b.includes('whenever a cable sits in the jack'));
    assert.ok(!b.includes('an overnight cable kills it'));
  });
  it('F097026: electrophones predate synths', () => {
    const b = body(ODD, 'electrophone');
    assert.ok(b.includes('around 1940'));
    assert.ok(!b.includes('built for synths'));
  });
  it('F097261: bridle leg tension is stated against the load, with the 120° mark', () => {
    const b = body(ODD, 'Bridle');
    assert.ok(b.includes('past 120°, each leg holds more than the load'));
    assert.ok(!b.includes('nearly doubling near 150'));
  });
});

describe('guided lessons and tool help', () => {
  it('F001355: delay formula multiplies by beats, not the written note fraction', () => {
    assert.ok(CONTENT.includes('(60000 / BPM) × beats, where a quarter note = 1, an eighth = 0.5'));
    assert.ok(!CONTENT.includes('× note-fraction'));
  });
  it('F001374: Sabine with 0.161 uses absorption in m² (metric sabins)', () => {
    assert.ok(CONTENT.includes('A = total absorption in m², i.e. metric sabins'));
    assert.ok(!CONTENT.includes('A = total absorption in sabins)'));
  });
  it('F001536 / F001542: asymmetric shaping adds even AND odd harmonics', () => {
    assert.ok(CONTENT.includes('asymmetric (tube) → even plus odd (warm)'));
    assert.ok(CONTENT.includes('asymmetric f → even + odd'));
    assert.ok(!CONTENT.includes('asymmetric f → even. Any harmonic'));
  });
  it('F001533: no builder note in learner text', () => {
    assert.ok(!CONTENT.includes('so make oversampling a toggle'));
  });
  it('F001672: Lissajous formula carries 2π', () => {
    assert.ok(CONTENT.includes('A₁sin(2πf₁t+φ₁)'));
    assert.ok(!CONTENT.includes('A₁sin(f₁t+φ₁)'));
  });
  it('F002270 / F002271 / F002280: T20 needs ~35 dB, T30 ~45 dB above the noise floor', () => {
    assert.ok(HELP.includes('about 35 dB above the noise floor'));
    assert.ok(HELP.includes('about 45 dB from the peak down to the noise floor'));
    assert.ok(!HELP.includes('you only need 20 clean dB'));
    assert.ok(!HELP.includes('to see 30 clean dB'));
  });
  it('F002180: A-weighting turns the lows down; it does not emphasise mids/highs', () => {
    assert.ok(HELP.includes('A turns the lows down hard'));
    assert.ok(!HELP.includes('A emphasises mid/high'));
  });
});

describe('src/data copy', () => {
  it('F001143: sibilance starts in the mouth', () => {
    assert.ok(LABREQ.includes('Sibilance starts in the mouth'));
    assert.ok(!LABREQ.includes('Sibilance is created at the microphone'));
  });
  it('F001126: phasing is not built from delay', () => {
    assert.ok(!LABREQ.includes('the effects below are all built from it'));
  });
  it('F094119: Atmos is object-based; Ambisonics is the scene-based example', () => {
    assert.ok(CRED.includes('scene-based formats such as Ambisonics'));
    assert.ok(!CRED.includes('object- and scene-based formats such as Dolby Atmos'));
  });
  it('F095030: missing lines go to ADR, not to re-recording', () => {
    assert.ok(ABOUT.includes('hands missing or unusable lines to ADR for replacement'));
    assert.ok(!ABOUT.includes('hands replacement needs to the re-recording process'));
  });
  it('F094989: no outdated DAW product name', () => {
    assert.ok(!ABOUT.includes('Studio One'));
  });
});
