/**
 * Round-2 audit fix pass, Round A, group B_mixguides (2026-10-23).
 * The guide files are the MASTER COPY (owner 2026-10-22); these edits were made in
 * them directly. Pins:
 *  - owner rule 1 (2026-10-23): a dose line names NIOSH and says "a day", never "safe";
 *    85 dBA is never called a workplace/legal limit; where a limit is stated, OSHA is named too;
 *  - pattern 8: the shared studio row "−9 to −6 LUFS-I, −2 dBTP" (6 guides) reads as the typical
 *    range with its trade-off, and no "−1 to −2 dBTP" row is left on a master louder than −14 LUFS;
 *  - pattern 7: the typical dBA/dBC pairs fit each guide's own C-minus-A rule;
 *  - a sample of the single fixes (new wording present, old wording gone).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const DIR = join(ROOT, 'src/screens/lab/mixingGuides/data/guides');
const read = (name: string) => readFileSync(join(DIR, `${name}.ts`), 'utf8').replace(/\r\n/g, '\n');
const ALL = readdirSync(DIR).filter((f) => f.endsWith('.ts')).map((f) => [f, read(f.replace(/\.ts$/, ''))] as const);

describe('mixing guides: hearing-dose wording names the authority (rule 1, 2026-10-23)', () => {
  it('no guide calls a dose "safe" or leaves the source unnamed', () => {
    for (const [f, s] of ALL) {
      assert.doesNotMatch(s, /\bsafe for (only )?(about )?\d|safe exposure|dBA safe for|is safe for/i, f);
      assert.doesNotMatch(s, /common hearing-safety guidance/i, f);
    }
  });
  it('85 dBA is never called a workplace or legal limit', () => {
    for (const [f, s] of ALL) assert.doesNotMatch(s, /85 dBA[^."]{0,20}(workplace|legal) limit|hazard threshold/i, f);
  });
  it('every NIOSH dose line says "a day"', () => {
    for (const [f, s] of ALL) {
      for (const m of s.matchAll(/NIOSH advises no more than [^.;—:,]*/g)) assert.match(m[0], / a day /, `${f}: ${m[0]}`);
    }
  });
  it('where 85 dBA is stated as a limit, both NIOSH and OSHA are named with both rules', () => {
    for (const name of ['g09-regional-mexican', 'g49-disco-nu-disco']) {
      const s = read(name);
      assert.match(s, /NIOSH[^.]*85 dBA for 8 hours, halving the time for every 3 dB/, name);
      assert.match(s, /OSHA[^.]*90 dBA with a 5 dB rule/, name);
    }
  });
});

describe('mixing guides: studio loudness rows agree with the PLR advice (pattern 8)', () => {
  it('the shared −9 to −6 row reads as typical with its trade-off in all 6 guides', () => {
    const shared = ['g13-bollywood-indian-film-music', 'g18-house', 'g27-punk-pop-punk', 'g30-punjabi-pop-bhangra', 'g37-amapiano', 'g41-arabic-pop'];
    for (const name of shared) {
      const s = read(name);
      assert.ok(s.includes('"studio": "Often −9 to −6 LUFS-I, −2 dBTP (the loud end trades punch for level)"'), name);
    }
    for (const [f, s] of ALL) assert.ok(!s.includes('"studio": "−9 to −6 LUFS-I, −2 dBTP"'), f);
  });
  it('no studio row offers −1 dBTP on masters that are all louder than −14 LUFS', () => {
    for (const [f, s] of ALL) {
      for (const m of s.matchAll(/"studio": "([^"]*)"/g)) {
        const row = m[1];
        const lufs = row.match(/−(\d+) to −(\d+) LUFS-I/);
        if (lufs && Number(lufs[1]) < 14 && /−1 to −2 dBTP/.test(row)) assert.fail(`${f}: ${row}`);
      }
    }
  });
});

describe('mixing guides: typical dBA/dBC pairs fit each guide\'s own C-minus-A rule (pattern 7)', () => {
  // [guide, typical C-weighted range now shown, old range that broke the rule]
  const PAIRS: Array<[string, string, string]> = [
    ['g03-rock', 'C-weighted LCeq around 112–120 dBC', 'C-weighted levels around 115–125 dBC'],
    ['g14-afrobeats', 'C-weighted LCeq around 112–120 dBC', '115–124 dBC'],
    ['g19-heavy-metal', 'C-weighted LCeq around 115–124 dBC', '118–128 dBC'],
    ['g37-amapiano', 'C-weighted LCeq of about 115–122 dBC', '118–128 dBC'],
    ['g38-salsa', 'C-weighted LCeq around 108–115 dBC', 'hearing-risk flag'],
    ['g43-dangdut', 'C-weighted LCeq around 112–120 dBC', '115–125 dBC'],
    ['g20-gospel', 'a C-weighted Leq about 10–20 dB above the A level is normal', '110–120 dBC'],
    ['g34-folk-singer-songwriter', 'C-weighted levels about 5–10 dB higher', '95–100 dBC'],
    ['g45-drum-and-bass', 'in D&B a C-minus-A gap of about 20–25 dB is normal', 'a C-minus-A gap above about 20–25 dB means'],
    ['g16-film-video-game-score', 'Compare like with like', 'a C-minus-A gap above 20 dB signals too much sub'],
  ];
  for (const [name, now, old] of PAIRS) {
    it(name, () => {
      const s = read(name);
      assert.ok(s.includes(now), `${name}: missing "${now}"`);
      assert.ok(!s.includes(old), `${name}: still has "${old}"`);
    });
  }
});

describe('mixing guides: Round A single fixes', () => {
  const PINS: Array<[string, string, string]> = [
    ['g01-pop', 'a −7 LUFS-I master only 5 dB. For more punch, aim for 7–9 dB', 'of around 7–9 dB is typical'],
    ['g01-pop', 'HPF the sidechain at about 60–120 Hz so the kick and sub don’t drive it', 'HPF the sidechain at 30–60 Hz'],
    ['g02-hip-hop-rap', 'cap at 100–103 dBA over 15 minutes or 100 dBA over 60', '105 dBA over 15'],
    ['g07-latin-pop', 'many artists use top handheld condensers and many use top dynamics', 'artists use premium handheld condensers'],
    ['g09-regional-mexican', 'Fast retune (about 0–20 ms) on tumbados', 'Fast retune (10–30 ms)'],
    ['g10-k-pop', 'have peaked at 108–109 dBA and about 130 dBC from 50-plus subs—levels few venue limits allow', 'a target few venue limits allow'],
    ['g15-classical-orchestral', 'HPF 60–100 Hz (tuba and bass trombone about 30–40 Hz)', '"cut": "HPF 60–100 Hz; −2–3 dB'],
    ['g17-trap', 'on beat 3 of each bar at the session tempo (2 and 4 if you count the half-time feel)', '(2 and 4 at double time)'],
    ['g20-gospel', 'HPF about 25 Hz, just under the low B fundamental', 'HPF 30–35 Hz (low B'],
    ['g20-gospel', 'so place wedges there, not straight behind it', 'Use a supercardioid handheld, since'],
    ['g21-jazz', 'Avoid gating brushes or the ride', 'Never gate brushes'],
    ['g27-punk-pop-punk', 'found the first mix unsatisfying, and had it remixed', 'first mixed with almost no reverb'],
    ['g28-reggae', 'selectors (who pick and play the records)', 'selectors (sound-system DJs)'],
    ['g30-punjabi-pop-bhangra', '+1–2 dB at the 808’s own note, below the kick', '+1–2 dB at 50–60 Hz'],
    ['g31-blues', 'feedback at 2–4 kHz still needs the notches', 'kills hiss and squeal'],
    ['g33-techno', 'Sets of 2–8 hours in nights of up to 10', '2–10 hour nights'],
    ['g43-dangdut', 'kendang (hand drums)', 'kendang (two-headed hand drum)'],
    ['g44-mpb-bossa-nova', 'peak-to-loudness ratio of about 11–15 dB', 'peak-to-loudness ratio of 12–16 dB'],
    ['g45-drum-and-bass', 'high-passed (often 35–50 Hz, up to 85 Hz on 909-style kicks)', 'high-passed (40–85 Hz)'],
    ['g47-bluegrass-americana', 'For bluegrass, aim for a PLR of 11–15 dB (at −2 dBTP', '(at −1 dBTP that means a master at about −12'],
    ['g48-musical-theatre', 'Cast albums commonly −16 to −9 LUFS-I', '55:45 vocal-to-band'],
  ];
  for (const [name, now, old] of PINS) {
    it(`${name}: ${now.slice(0, 40)}`, () => {
      const s = read(name);
      assert.ok(s.includes(now), `${name}: missing "${now}"`);
      assert.ok(!s.includes(old), `${name}: still has "${old}"`);
    });
  }
});
