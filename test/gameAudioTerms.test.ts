/**
 * Game Audio lab — its words are the GLOSSARY's words (owner 2026-11-12:
 * "matching glossary learning terms"; "only key concepts and common terms").
 *
 * VERIFIED is every term the lab may show, as it was checked against the
 * live glossary's base table by EXACT name on 2026-11-12 (103 asked, 103
 * found, none missing). A term added to gaTerms.ts without being checked
 * against the glossary fails here: check it live, then add it to VERIFIED
 * with the date. Pages get their terms through gaTerms(), whose argument type
 * is the key set, so a page cannot show a word that is not in this list.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { GA_TERMS, gaTerms } from '../src/screens/lab/gameaudio/gaTerms.ts';

const VERIFIED_2026_11_12 = [
  'Game audio', 'Interactive audio', 'Audio event (game)', 'Event-driven audio', 'Audio parameter', 'Playback instance', 'Game engine', 'Controller speaker',
  'Platform certification', 'Audio listener', 'Listener position', 'Listener orientation', 'Split-screen audio', 'Ambient loop', 'Gameplay sound effect',
  'Interface sound', 'NPC bark', 'Diegetic Sound', 'Non-Diegetic Sound', 'Foley', 'Audio asset', 'Audio Middleware', 'Sound bank', 'Implementation',
  'Audio implementer', 'Technical sound designer', 'Audio pipeline', 'Audio Emitter', 'One-shot asset', 'Audio trigger', 'Trigger (game engine)', 'Audio state',
  'State group', 'Switch group', 'Switch container', 'Real-Time Parameter Control (RTPC)', 'Game Syncs', 'Sound variation', 'Random container',
  'Sequence container', 'Layer container', 'Blend container', 'Avoid-repeat setting', 'Machine-gun effect', 'Pitch randomization', 'Ambience zone', 'Loop Point',
  'Crossfade', 'Seamless music loop', 'Room Tone', 'Volume (game engine)', 'Attenuation curve', 'Minimum distance', 'Maximum distance', 'Positional audio',
  'Cone attenuation', 'Obstruction', 'Audio Occlusion', 'Reverb zone', 'Acoustic portal', 'Channel-based audio', 'Object-Based Audio', 'Binaural rendering', 'HRTF',
  'Ambisonics', 'Head tracking', 'Downmix', 'Mono compatibility', 'Adaptive music', 'Vertical layering', 'Horizontal resequencing', 'Music segment', 'Music state',
  'Music transition rule', 'Bar-aligned transition', 'Musical stinger', 'Dialogue systems', 'Playback priority', 'Closed Captioning',
  'Subtitles for the deaf and hard of hearing', 'Audio Bus (Game Audio)', 'Ducking', 'Snapshot (Game Mix State)', 'Dynamic mixing', 'Headroom', 'Playback limit',
  'Virtual voice', 'Voice Stealing', 'Audio memory budget', 'Audio CPU budget', 'Audio level of detail (audio LOD)', 'Prefetch streaming', 'In-game voice chat',
  'Proximity voice chat', 'Audio profiling', 'Quality assurance', 'Wwise', 'FMOD', 'Unity (game engine)', 'Unreal Engine', 'MetaSounds', 'Procedural Audio',
  'Steam Audio',
];

describe('the lab’s vocabulary is the glossary’s', () => {
  it('every term the lab can show was verified against the live glossary by exact name', () => {
    assert.deepEqual(Object.keys(GA_TERMS).sort(), [...VERIFIED_2026_11_12].sort());
    assert.equal(VERIFIED_2026_11_12.length, 103);
  });
  it('"Localization" is not a lab term (in this glossary it means hearing where a sound is)', () => {
    assert.ok(!('Localization' in GA_TERMS));
  });
  it('each meaning is short, plain, and claims nothing it cannot keep', () => {
    for (const [term, def] of Object.entries(GA_TERMS)) {
      assert.ok(def.length >= 40 && def.length <= 260, `${term}: ${def.length} characters`);
      assert.ok(/[.]$/.test(def), `${term} ends as a sentence`);
      assert.ok(!/\b(always|never|must)\b/i.test(def), `${term}: no dogma words`);
      assert.ok(!/\b(colour|behaviour|centre|programme|synthesi[sz]ed by)\b/.test(def), `${term}: US spelling`);
    }
  });
  it('gaTerms() hands a page the glossary name with its meaning', () => {
    const t = gaTerms('Audio event (game)', 'Playback instance');
    assert.deepEqual(t.map((x) => x.term), ['Audio event (game)', 'Playback instance']);
    assert.equal(t[0].def, GA_TERMS['Audio event (game)']);
  });
});

describe('learner text across the lab’s pages', () => {
  const dir = new URL('../src/screens/lab/gameaudio/pages/', import.meta.url);
  const files = readdirSync(dir).filter((f) => /^p\d\d.*\.tsx$/.test(f));
  /** Text a learner reads: JSX text and string literals, comments removed. */
  const learnerText = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  it('there is at least the example page, and every page file exports a PageDef', () => {
    assert.ok(files.includes('p02Reacts.tsx'));
    for (const f of files) {
      const src = readFileSync(new URL(f, dir), 'utf8').replace(/\r\n/g, '\n');
      assert.match(src, /export const P\d\d: PageDef = \{/, f);
    }
  });
  it('US spelling, no skill promises, no citations, and languages are never called localization', () => {
    for (const f of files) {
      const t = learnerText(readFileSync(new URL(f, dir), 'utf8').replace(/\r\n/g, '\n'));
      assert.ok(!/\b(colour|behaviour|centre|metres?\b|programmes?\b|organis|recognis|analys(e|ing)\b|grey\b|catalogue)/i.test(t), `${f}: US spelling`);
      assert.ok(!/you(’|')ll (master|build|mix|be able)|you will (master|be able to)|learn to (mix|master)/i.test(t), `${f}: claims knowledge, not skills`);
      assert.ok(!/\b(research shows|studies show|according to|survey|percent of)\b/i.test(t), `${f}: no citations or statistics`);
      assert.ok(!/locali[sz]ation/i.test(t), `${f}: "localization" is not used for languages`);
    }
  });
});
