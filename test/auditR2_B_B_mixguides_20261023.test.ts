/**
 * Round-2 audit fix pass, Round B (the last round), group B_mixguides (2026-10-23).
 * Comp B's remaining S3 CLARIFY / HEDGE / CONTEXT rows for the mixing guides.
 * The guide files are the MASTER COPY; these edits were made in them directly
 * (never via scripts/mixing-guides/convert.py). Pins every fix: new wording
 * present, old wording gone.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const DATA = 'src/screens/lab/mixingGuides/data';
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
const g = (name: string) => read(`${DATA}/guides/${name}.ts`);

// [guide file, new wording that must be present, old wording that must be gone]
const PINS: Array<[string, string, string]> = [
  ['g29-sertanejo', 'if harsh (a nasal tone sits lower, near 1 kHz)', 'if nasal/harsh'],
  ['g29-sertanejo', 'time-aligned to the stage mics', 'delayed to align'],
  ['g14-afrobeats', 'time its release to the tempo so it lets go between beats', 'slow enough to follow the tempo'],
  ['g15-classical-orchestral', 'often with rubato', 'constant rubato'],
  ['g15-classical-orchestral', 'then raise it a touch and stop', 'just notice them missing, then stop'],
  ['g34-folk-singer-songwriter', 'ask the player first', 'always get a DI from it'],
  ['g34-folk-singer-songwriter', 'a real room makes the nulls shallower than on paper', '20 dB or more of voice/guitar separation'],
  ['g22-soul', '(bari and trombone 60–80 Hz)', '(bari 60–80 Hz)'],
  ['g41-arabic-pop', 'a “lazma” (instrumental hook) on strings', '(instrumental hook) instrumental hook'],
  ['g41-arabic-pop', 'Pitch correction set to a Western chromatic scale', 'A chromatic tuner set to a Western key'],
  ['g41-arabic-pop', 'about 50 cents (a quarter tone) away from Western pitches', 'neutral intervals about 50 cents off Western semitones'],
  ['g48-musical-theatre', 'The amplified voice arrives 10–20 ms', '"Voice arrives 10–20 ms'],
  ['g48-musical-theatre', 'underscore can sit 30 dB or more below the finale', 'peaks at +10 dB'],
  ['g48-musical-theatre', 'on the digital receiver or console input meter', 'so peaks sit near −12 dBFS.'],
  ['g48-musical-theatre', 'Pitch correction is rarely used live', 'Pitch correction is not used live'],
  ['g47-bluegrass-americana', 'Acoustic bluegrass sounds best around 85–92 dBA LAeq-15 at FOH; C-weighted', 'one major acoustic tour'],
  ['g47-bluegrass-americana', 'Delay the pickup about 0.5–2 ms to line it up with the mic', 'Align pickup and mic (0.5–2 ms delay)'],
  ['g46-lo-fi-chillhop', 'counter-melody panned 20–40% to one side', 'opposite the keys'],
  ['g46-lo-fi-chillhop', '"cut": "HPF 25–30 Hz; optional gentle high shelf, −1 to −3 dB above 10–12 kHz"', '"boost": "Optional gentle shelf'],
  ['g08-reggaeton', 'breaking through in the mid-2010s', 'Latin trap rising out of Puerto Rico'],
  ['g08-reggaeton', 'Dominican dembow (a separate, faster style from the Dominican Republic)', "Dominican dembow (reggaeton's core drum pattern)"],
  ['g08-reggaeton', 'use wedges instead of in-ear monitors', 'IEM-less'],
  ['g13-bollywood-indian-film-music', 'shows up as bright overtones above about 5 kHz', 'shimmer lives above 5 kHz'],
  ['g13-bollywood-indian-film-music', 'Keep the shelf gentle; if strings or percussion crowd', 'Cut the upper band on strings and percussion'],
  ['g20-gospel', 'altos just off center', 'altos center'],
  ['g23-hard-rock', '+2 dB at 1–2 kHz on organ grit', '+2 dB at 1–3 kHz on organ grit'],
  ['g30-punjabi-pop-bhangra', 'a supercardioid pattern helps reject dhol spill', 'supercardioid capsule handles high SPL'],
  ['g35-brazilian-funk', 'Keep that DJ-input limiter to 2–3 dB of gain reduction at most', 'on the bus there'],
  ['g36-dancehall', 'a half-time feel of about 70–80', '70–80 felt in half time'],
  ['g42-turkish-pop', 'def (frame drum with jingles), bendir (frame drum with a snare)', '(def, bendir, shakers)'],
  ['g42-turkish-pop', 'Keep the kick’s low boost narrow', 'Keep the kick narrower'],
  ['g16-film-video-game-score', 'the lowest bass notes reach about 41 Hz', 'celli and basses 80–250 Hz. Sidechain'],
  ['g07-latin-pop', "carry the dembow (reggaeton's core drum pattern).", 'drum pattern) pattern'],
  ['g07-latin-pop', 'caja vallenata (small vallenato hand drum), which plays with the accordion', 'accordion and caja vallenata'],
];

describe('audit R2 Round B · mixing guides: clarified and hedged rows', () => {
  for (const [file, now, old] of PINS) {
    it(`${file}: ${now.slice(0, 50)}`, () => {
      const s = g(file);
      assert.ok(s.includes(now), `missing new wording in ${file}: ${now}`);
      assert.ok(!s.includes(old), `old wording still in ${file}: ${old}`);
    });
  }

  it('index.ts mirrors the reggaeton origin fix', () => {
    const s = read(`${DATA}/index.ts`);
    assert.match(s, /Latin trap growing out of Puerto Rico from the mid-2000s and breaking through in the mid-2010s/);
    assert.doesNotMatch(s, /Latin trap rising out of Puerto Rico/);
  });

  it('the lo-fi master row no longer lists a cut in the boost field', () => {
    const s = g('g46-lo-fi-chillhop');
    assert.doesNotMatch(s, /"boost": "[^"]*−1 to −3 dB/);
  });
});
