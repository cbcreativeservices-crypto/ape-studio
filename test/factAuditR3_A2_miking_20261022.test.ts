/**
 * Fact audit, Round 3 (Comp B return, 2026-10-22) — group A2_miking.
 * Pins a sample of the HEDGE / CONTEXT / CAN'T CONFIRM fixes in the miking
 * files outside lessons a-, b- and c- (lessons d–f, i, m, spk, shared/,
 * data/, engine/, pages/): the corrected words are present and the
 * overstated claim is gone. Also the owner ruling of 2026-10-22: comb
 * filtering cancels FREQUENCIES, not "pitches", in every A2 file.
 * Ledger: LEDGER_R3_A2_miking.json (scratchpad of the parent session).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const M = 'src/screens/lab/miking/';
const L = M + 'lessons/';
const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

const PINS: { id: string; file: string; now: string; gone: string }[] = [
  { id: 'F014878', file: M + 'data/registry.ts', now: 'Wooden bars over pipes, often four to five octaves wide', gone: 'Wooden bars over pipes, five octaves wide' },
  { id: 'F037956', file: L + 'e01LeadVocal/lesson.ts', now: 'An omni hears all sides alike', gone: 'An omni rejects nothing' },
  { id: 'F039348', file: L + 'e05Choir/lesson.ts', now: 'little or none of the choir mics in the choir’s monitor', gone: 'the choir mics never in the choir’s monitor' },
  { id: 'F041315', file: L + 'e09CompleteBand/lesson.ts', now: 'risks hum and phantom clashes between the desks', gone: 'An improvised parallel split is unsafe' },
  { id: 'F041565', file: L + 'e10HornSection/lesson.ts', now: 'Brass speaks from the bell, and its highs are strongly directional', gone: 'Brass speaks from the bell and is strongly directional' },
  { id: 'F042485', file: L + 'e12PercussionEnsemble/lesson.ts', now: 'add as few supports as you can, each for a named problem', gone: 'add at most two supports' },
  { id: 'F044150', file: L + 'e16BigBand/lesson.ts', now: 'Where is a big band’s electric guitar heard from?', gone: 'Where is a big band’s guitar heard from?' },
  { id: 'F047454', file: L + 'f07Wildlife/lesson.ts', now: 'No playback, calls or lures in this lab — many sites ban them.', gone: 'No playback, calls or lures — ever.' },
  { id: 'F048005', file: L + 'f08Passby/lesson.ts', now: 'the safety lead sets speeds in the plan', gone: 'Never ask a driver to change speed for a mic.' },
  { id: 'F048775', file: L + 'f10SpatialField/geometry.ts', now: 'about 20 ms late', gone: 'a few milliseconds late' },
  { id: 'F049306', file: L + 'f10SpatialField/pages.tsx', now: 'the ears about 1.5–1.8 m up', gone: '1.55–1.8 m up' },
  { id: 'F049756', file: L + 'f11MeasurementMics/lesson.ts', now: 'The capsule is a big part of a wavelength', gone: 'The capsule nears a wavelength in size' },
  { id: 'F051610', file: L + 'f15Machinery/lesson.ts', now: 'modify an operating machine yourself', gone: 'You never place a sensor on' },
  { id: 'F051868', file: L + 'f15Machinery/lesson.ts', now: 'Who fits a sensor to an industrial machine?', gone: 'Who fits a sensor to an operating industrial machine?' },
  { id: 'F052629', file: L + 'i01aHiHat/lesson.ts', now: 'An overhead hears its top face well', gone: 'one reason an overhead hears it well' },
  { id: 'F054226', file: L + 'i01eChina/model.ts', now: 'Underneath, below the valley', gone: 'Underneath, below the lip' },
  { id: 'F058943', file: L + 'i06cBarChimes/pages.tsx', now: 'The bars ring on until they die away', gone: 'the earlier ones fading first' },
  { id: 'F060853', file: L + 'i11aRhodes/pages.tsx', now: 'which may mean a pickup adjustment', gone: 'never a mic move or a pickup adjustment' },
  { id: 'F062404', file: L + 'm02Snare/lesson.ts', now: 'Just beside and above it, to the player’s left', gone: 'Just behind and above it' },
  { id: 'F064619', file: L + 'm05Djembe/lesson.ts', now: 'set mostly by the shell’s size and shape, much less by the skin’s tension', gone: 'independent of the skin’s tension' },
  { id: 'F065429', file: L + 'm07aConcertBassDrum/copy.ts', now: 'Only the player or the percussion crew moves it', gone: 'The percussion crew alone moves it' },
  { id: 'F066461', file: L + 'm08HeadedTambourine/lesson.ts', now: 'It is a head and metal jingles on a frame, most often wood.', gone: 'It is a skin head and metal jingles on a wooden frame.' },
  { id: 'F069331', file: L + 'shared/sax/saxLesson.ts', now: 'A cardioid rejects most straight behind; a supercardioid', gone: 'Only a cardioid rejects most straight behind' },
  { id: 'F071177', file: L + 'shared/ensemble/voiceGroupItems.ts', now: 'Not over the heads unless the venue’s qualified crew rigs it', gone: 'Never over the heads' },
  { id: 'F072530', file: L + 'shared/lutes/LuteSound.tsx', now: 'the player tunes them for the music.</Note>', gone: 'A mic toward the neck hears more of that shimmer' },
  { id: 'F073131', file: L + 'shared/measure/chains.ts', now: 'roughly as hearing does at quiet levels', gone: 'at moderate levels' },
  { id: 'F074507', file: L + 'shared/sports/safety.ts', now: 'unless the event approves that one spot (a goal or net mic)', gone: 'NEVER INTO PLAY' },
  { id: 'F075542', file: M + 'pages/PMicrophone.tsx', now: 'this one is a half-cardioid, so keep the sound source within about 60°', gone: 'picks up the half-space above its surface (a half-cardioid)' },
];

describe('fact audit R3 · A2 miking — corrected wording', () => {
  for (const p of PINS) {
    it(`${p.id}: ${p.file.replace(L, '')}`, () => {
      const s = read(p.file);
      assert.ok(s.includes(p.now), `${p.id}: new wording missing`);
      assert.ok(!s.includes(p.gone), `${p.id}: old wording still present`);
    });
  }
});

describe('owner ruling 2026-10-22 · comb filtering cancels frequencies, not pitches', () => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) {
        if (/lessons[\\/][abc][^\\/]*$/.test(p)) continue; // group A1's files
        walk(p);
      } else if (/\.tsx?$/.test(n)) files.push(p);
    }
  };
  walk(M);
  it('scans the A2 files', () => assert.ok(files.length > 200, String(files.length)));
  it('no A2 file says pitches or notes cancel in a comb', () => {
    const bad: string[] = [];
    for (const f of files) {
      const s = read(f);
      for (const re of [/some pitches (arrive out of step and )?cancel/, /pitches cancel/, /cancelled pitch/, /(align|line up) every pitch/, /cancel only at some pitches/, /notches fall on some notes/, /some pitches add, some cancel/])
        if (re.test(s)) bad.push(`${f}: ${re}`);
    }
    assert.deepEqual(bad, []);
  });
  it('the corrected phrase is in place', () => {
    assert.match(read(L + 'e01LeadVocal/lesson.ts'), /some frequencies cancel in the sum/);
    assert.match(read(L + 'f11MeasurementMics/lesson.ts'), /raising some frequencies and cutting others/);
    assert.match(read(L + 'shared/guitars/stringsContent.ts'), /arrives at different times, so some frequencies cancel/);
  });
});
