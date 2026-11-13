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
import { GA_TERMS, GA_TERMS_KEPT_UNSHOWN, gaTerms } from '../src/screens/lab/gameaudio/gaTerms.ts';

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
  const dataDir = new URL('data/', dir);
  const dataFiles = readdirSync(dataDir).filter((f) => /\.ts$/.test(f));
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
  it('"localization" appears in learner text exactly once: page 15’s note that gives both meanings (L-11, owner’s lead 2026-11-12)', () => {
    // the one allowed sentence, word for word; nothing else in a page or a data file may use the word
    const ALLOWED = 'Making language versions of a game is called localization. In this app’s glossary that word means something else: hearing where a sound comes from.';
    const hits: string[] = [];
    for (const [d, list] of [[dir, files], [dataDir, dataFiles]] as const) {
      for (const f of list) {
        const t = learnerText(readFileSync(new URL(f, d), 'utf8').replace(/\r\n/g, '\n')).split(ALLOWED).join('');
        if (/locali[sz]ation/i.test(t)) hits.push(f);
      }
    }
    assert.deepEqual(hits, [], 'only the allowed sentence uses the word');
    const note = readFileSync(new URL('chcMusicVoice.ts', dataDir), 'utf8');
    assert.ok(note.includes(`CHC_LANGUAGE_VERSIONS_NOTE = '${ALLOWED}'`), 'the allowed sentence is CHC_LANGUAGE_VERSIONS_NOTE');
  });
});

describe('audit 2 (2026-11-12): whose word, which are shown, no filler', () => {
  const ga = new URL('../src/screens/lab/gameaudio/', import.meta.url);
  /** Every term a page shows: the names inside each gaTerms( … ) call. */
  function shownTerms(): Set<string> {
    const out = new Set<string>();
    const dir = new URL('pages/', ga);
    for (const f of readdirSync(dir).filter((x) => /\.tsx?$/.test(x))) {
      const src = readFileSync(new URL(f, dir), 'utf8');
      for (const call of src.matchAll(/gaTerms\(((?:\s*'[^']*'\s*,?)+)\s*\)/g)) for (const m of call[1].matchAll(/'([^']+)'/g)) out.add(m[1]);
    }
    return out;
  }
  it('every term no page shows is on the kept list, which says why (B7, L-30)', () => {
    const shown = shownTerms();
    const unshown = Object.keys(GA_TERMS).filter((k) => !shown.has(k));
    for (const k of unshown) assert.ok(GA_TERMS_KEPT_UNSHOWN.includes(k as never), `"${k}" is shown on no page: keep it on GA_TERMS_KEPT_UNSHOWN (with the reason) or show it`);
    for (const k of GA_TERMS_KEPT_UNSHOWN) assert.ok(k in GA_TERMS, `${k} is a key`);
    // and a term a page shows is NOT on the kept list (the list says "no page shows these")
    const nowShown = GA_TERMS_KEPT_UNSHOWN.filter((k) => shown.has(k));
    assert.deepEqual(nowShown, [], `shown on a page, so take off GA_TERMS_KEPT_UNSHOWN: ${nowShown.join(', ')}`);
  });
  it('the Wwise words say they are Wwise’s, and Game Syncs agrees with page 20 (A1, L-01, decision 3)', () => {
    for (const k of ['Game Syncs', 'Real-Time Parameter Control (RTPC)', 'Switch group', 'State group', 'Switch container', 'Blend container'] as const) assert.match(GA_TERMS[k], /^Wwise’s name for /, k);
    assert.match(GA_TERMS['Game Syncs'], /Switches, States, Game Parameters \(linked by RTPCs\) and Triggers/);
    assert.match(GA_TERMS['Game Syncs'], /A Wwise Trigger starts a music stinger\. A footstep is an Event\./);
    assert.ok(!/\b(trigger|foot)\b.*\bGame Syncs?\b/i.test(GA_TERMS['Audio trigger']), 'the lab’s own trigger is not called a Game Sync');
    assert.match(GA_TERMS['Layer container'], /No tool on page 20 uses this exact name/);
  });
  it('the three meanings the accuracy report corrected, and no filler (B7, L-27)', () => {
    assert.match(GA_TERMS.FMOD, /^Another widely used/);
    assert.ok(!/usually dips/.test(GA_TERMS['In-game voice chat']));
    for (const [term, def] of Object.entries(GA_TERMS)) {
      assert.ok(!/\b(powerful|simply|afterwards)\b/i.test(def), `${term}: no filler, US usage`);
      for (const sentence of def.split(/(?<=[.?!])\s+/)) assert.ok(sentence.split(/\s+/).length <= 25, `${term}: a sentence of ${sentence.split(/\s+/).length} words`);
    }
  });
});
