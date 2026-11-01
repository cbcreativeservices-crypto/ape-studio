/**
 * Screen Guide rollout — DJ Systems Lab (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_20261031.test.ts and the Fundamentals tests.
 *
 *   1. every one of the 24 screens has a guide, keyed by its on-screen title
 *      (read from each page's PageDef): five sections, 1–5 bullets, 2–3 TRY
 *      THIS, the house copy rules, each step within its no-scroll budget;
 *   2. each guide quotes its screen's REAL names — every name pinned here is
 *      in both the guide and the lab's source;
 *   3. every TRY THIS number is the screen's own: the safe-level tile worked
 *      out from nioshDose, MATCH TEMPO TO A from pitchFor / playedSemis and
 *      the tracks' BPMs, and the targets quoted from the screens' goals;
 *   4. wiring: DJSystemsLabScreen hands PagedLab its pageGuide (PagedLab, the
 *      shared shell, already draws the ⓘ and hosts the overlay);
 *   5. the accuracy-chip decision: KEPT — the lab prints gain/level readouts
 *      (dBFS meters), modeled dBA and a 4-hour dose (Screen 20) and latency,
 *      and its chip carries the lab's own safe-listening detail.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
/** Source with comments stripped — a name in a comment proves nothing. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const { DJ_SCREEN_GUIDES } = await import('../src/screens/lab/dj/djScreenGuides.ts');
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { nioshDose } = await import('../src/screens/lab/calc/workspaces/splSafety.ts');
const { pitchFor } = await import('../src/screens/lab/dj/model/djTime.ts');
const { playedSemis } = await import('../src/screens/lab/dj/model/djKey.ts');
const { TRACKS } = await import('../src/screens/lab/dj/engine/djMusic.ts');

type Guide = Record<string, string[]>;
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const GUIDES = DJ_SCREEN_GUIDES as unknown as Record<string, Guide>;
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');
const tryOf = (gd: Guide) => gd.tryThis.join('\n');

const DJ = 'src/screens/lab/dj';
const PAGE_FILES = readdirSync(join(ROOT, DJ, 'pages')).filter((f) => /^p\d\d\w+\.tsx$/.test(f)).sort();
/** Each screen's title, in outline order, from its PageDef. */
const TITLES = PAGE_FILES.map((f) => {
  const m = code(`${DJ}/pages/${f}`).match(/export const P\d\d: PageDef = \{ title: '([^']+)'/);
  assert.ok(m, `${f}: PageDef title`);
  return m[1];
});
const titleOf = (n: number) => TITLES[n - 1];
const G = (n: number) => GUIDES[titleOf(n)];

describe('1. every DJ Systems screen has a complete guide', () => {
  it('24 screens, one guide each by title, none for a screen that does not exist', () => {
    assert.equal(TITLES.length, 24);
    assert.deepEqual(Object.keys(GUIDES).sort(), [...TITLES].sort());
    // the registry the lab renders lists the same 24, in this order
    const idx = code(`${DJ}/pages/index.ts`);
    assert.match(idx, /export const DJ_PAGES: PageDef\[\] = \[\s*P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11, P12,\s*P13, P14, P15, P16, P17, P18,\s*P19, P20, P21, P22, P23, P24,\s*\];/);
  });
  for (const [id, gd] of Object.entries(GUIDES)) {
    it(`${id}: all five sections, 1–5 bullets each, none empty, 2–3 experiments`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('house copy rules: knowledge not skills, no "N of total", no build notes, "suggest" not "recommend", no gear brands', () => {
    for (const [id, gd] of Object.entries(GUIDES)) {
      const t = textOf(gd);
      // MASTER is a control name on a DJ mixer; the rule is about claiming a skill.
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou mastered\b|\byou will learn to\b|\byou can now\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend" (house word is "suggest")`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|walkthrough|owner 20\d\d|build \d+)\b/i, `${id}: a build note in learner text`);
      assert.doesNotMatch(t, /\b(Pioneer|Technics|Serato|rekordbox|Rekordbox|Traktor|Native Instruments|Denon|Rane|Allen & Heath|Numark|Shure|Sennheiser|Ableton|Roland)\b/, `${id}: a gear brand`);
    }
  });
  it('every step fits its no-scroll budget, on every screen', () => {
    const over: string[] = [];
    for (const [id, gd] of Object.entries(GUIDES)) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length}): ${item.slice(0, 40)}…`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, [], 'tighten the wording (keep it accurate) — a step must not need scrolling');
  });
  it('every guide names the dock’s ■ STOP and places its screen in the sequence', () => {
    for (const [n, title] of TITLES.entries()) {
      const t = textOf(GUIDES[title]);
      assert.ok(t.includes('■ STOP'), `${title}: ■ STOP`);
      assert.ok(t.includes(`Screen ${n + 1}`), `${title}: says which screen it is`);
    }
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const walk = (dir: string): string[] =>
    readdirSync(join(ROOT, dir)).flatMap((f) => {
      const p = `${dir}/${f}`;
      return statSync(join(ROOT, p)).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && !f.endsWith('ScreenGuides.ts') ? [p] : [];
    });
  const SRC = walk(DJ).map(code).join('\n');
  const NAMES: Record<number, string[]> = {
    1: ['BOOTH', 'LISTENING AS', 'PLAYBACK', 'A LOUD NIGHT, IN NUMBERS', 'PLAY A', 'LISTEN', 'CROWD', 'PHONES', 'QUIETER', 'LOUDER', 'RESET', '■ STOP', 'h set', 'dBA', '% of a day’s allowance'],
    2: ['FIND', 'SENDS TO', 'EQUIPMENT', 'TURNTABLE', 'MEDIA PLAYER', 'MIXER', 'CONTROLLER + LAPTOP', 'STANDALONE SYSTEM', 'AUDIO INTERFACE', 'HEADPHONES', 'POWERED SPEAKER', 'SYSTEM', 'VINYL', 'LAPTOP + CONTROLLER', 'STANDALONE', 'MODULAR PLAYERS', 'CONTROLLER OUTPUTS', 'LAPTOP’S OWN AUDIO'],
    3: ['CH1 INPUT', 'CH1 L GETS', 'CH1 R GETS', 'SOURCE', 'DECK A (PLAYER)', 'TURNTABLE', 'PATCH', 'IDENTIFY', 'PLAY', 'CH1 LINE', 'CH1 PHONO', 'PHONO', 'LINE', 'DECK A', 'FIND'],
    4: ['CABLES', 'POWERED', 'PA L · R', 'PATCH', 'FOLLOW THE CABLE', 'WHOLE BOOTH', 'POWER', 'DECK A', 'DECK B', 'BOOTH L', 'BOOTH R', 'PA L', 'PA R', 'DECKS', 'UNWIRE', 'MASTER', 'CROWD'],
    5: ['ON AIR', 'STATE', 'PLAYING', 'PAUSED', 'AT CUE', 'BROWSE', 'LOAD', 'SEARCH', '‹ 1 s', '1 s ›', '‹ JOG', 'JOG ›', 'DECK A', 'DECK B', 'PLAY A'],
    6: ['TRIM 1', 'TRIM 2', 'BUS OVER', 'CH1 AVG', 'CH2 AVG', 'PK', 'MASTER', 'MIX BUS', 'CLEAN', 'OVER', 'LEVELS', 'CH1 FADER', 'CH2 FADER', 'DECKS', 'INPUT SELECTOR', 'LINE', 'PHONO', 'USB', 'CUE 2'],
    7: ['PHONES', 'CUE BUS', 'PHONES L', 'PHONES R', 'LISTENING', 'CUE', 'SPLIT', 'BLEND', 'BOOTH', 'CUE 2', 'MASTER'],
    8: ['CH1 → MIX', 'CH2 → MIX', 'FADERS', 'CH1 (DECK A)', 'CH2 (DECK B)', 'X-FADER', 'SETUP', 'BLEND', 'DIP', 'CUT', 'PUT THE SAME TRACK ON BOTH DECKS, ALIGNED', 'DECKS', 'TWO COPIES'],
    9: ['CH1 LOW', 'CH2 LOW', 'RES', 'LOW 1', 'LOW 2', 'EQ+FILT', 'CH1 FILTER', 'RESONANCE', 'KILL', 'DECKS'],
    10: ['A BPM', 'B BPM', 'B vs A', 'A PHRASE', 'PHASE', 'TEMPO B', 'JOG B', 'PUSH ›', '‹ BACK', 'CUE B BACK TO BAR 1', 'CH2 FADER', 'PLAY B', 'DECKS'],
    11: ['B GRID BPM', 'GRID', 'REAL BEATS', 'B BPM', 'GRID RIGHT', 'FIRST BEAT LATE', 'HALF BPM', '◀ ½ BEAT', '◀ ¼', 'BPM ×2', 'LOOP 4 BEATS', 'SYNC B', 'QUANTIZE', 'RIGHT', 'CROWD'],
    12: ['PHONES', 'CROWD', 'HOT CUES', 'LOOP', 'SAMPLER →', 'ON AIR', 'PRIVATE', 'HOT CUE', 'CLEAR ALL', 'EXIT', 'SAMPLER', 'DECKS'],
    13: ['FX SCOPE', 'EFFECT', 'SITS ON', 'TIME', 'FX', 'FX ON', 'TYPE', 'ECHO', 'REVERB', 'FILTER', 'FLANGER', 'WHERE IT SITS (CH SELECT)', 'CH1', 'CH2', 'MASTER', 'SEND', 'RETURN TO', 'FX TIME', 'FEEDBACK', 'LEVEL (DRY/WET)', 'RETURN', 'FADER 1', '1 BEAT', 'CROWD'],
    14: ['B BPM', 'B PITCH', 'B KEY', 'STRETCH', 'TEMPO B', 'KEY LOCK', 'KEY', 'MATCH TEMPO TO A', 'KEY SHIFT (semitones)', 'TEMPO RANGE', '±8 %', '±16 %', 'TEMPO 0 %', 'CH1 DOWN', 'CH1 UP', 'DECKS'],
    15: ['A STEMS', 'B STEMS', 'ORIGINAL', 'SEPARATED', 'SIMULATED', 'STEMS', 'SOURCE', 'ORIGINAL STEMS', 'SEPARATED (SIMULATED)', 'FADER 2', 'MELODY', 'DRUMS', 'BASS', 'DECKS'],
    16: ['AUDIO SETUP', 'DEVICE', 'LATENCY', 'DROPOUTS', 'CH2 GETS', 'SETUP', 'OUTPUT DEVICE', 'BUFFER (samples)', 'SAMPLE RATE', 'OUTPUT', 'RIG', 'MIXER USB AUDIO', 'DECKS'],
    17: ['DIAL', 'TRUE FORCE', 'TRACKING', 'STAGES', 'LOOP GAIN', 'ARM', 'STYLUS SCALE', 'ANTI-SKATE DIAL', 'PHONO', 'GROUND WIRE', 'CH1 INPUT SELECTOR', 'ROOM', 'BOOTH MONITOR LEVEL', 'PLATTER', 'FADER 1', 'LISTEN AS', 'LOOSE'],
    18: ['ROUND TRIP', 'SIGNAL', 'DECK 1', 'CROWD', 'PLATTER', 'NEEDLE DROP', 'PLATTER PITCH', 'MODE', 'ABSOLUTE', 'RELATIVE', 'INTERNAL', 'CH1 IN', 'USB (the software’s music)', 'PHONO (the record itself)', 'CALIBRATE'],
    19: ['MIC', 'MIC PEAK', 'MUSIC DIP', 'FEEDBACK', 'RINGING', 'VOICE IN', 'GAIN', 'ROUTE', 'TALK OVER', 'TALK', 'TALK NOW', 'SHOUT', 'DYNAMIC', 'MIC 1', 'ON', 'ROOM', 'AT A MONITOR'],
    20: ['ROOM', 'HANDOFF', 'SYSTEM', 'FLOOR', 'AT THE DECKS', '4-HOUR DOSE', 'TT LOOP', 'DJ L · DJ R', 'AT 100 Hz', 'MASTER', 'VIEW', 'VENUE', 'DJ L', 'DJ R', 'ASK THE ENGINEER', 'SETUP', 'MASTER L', 'MASTER R'],
    21: ['RECORDER', 'REC PEAK', 'STOPPED', 'RECORDING', 'CLIPPING', 'MASTER PEAK', 'VOICE IN', 'REC GAIN', 'MASTER', 'TAP', 'REC OUT', 'BOOTH OUT', 'LOOPBACK', 'UNPLUG', 'REC', 'MIC → REC', 'RECORD', 'STOP', 'PLAY THE TAKE'],
    22: ['MIDI OUT', 'CLOCK', 'DECK A', 'MACHINE', 'EXT', 'INT', 'ITS BAR 1', 'IN THE ROOM', 'TEMPO A', 'START', 'PLAY NOW', 'START ON THE NEXT BAR', 'AUDIO', 'CH 2', 'CH 2 FADER', 'CUE 2', 'CH 1', '5-PIN MIDI', 'EXTERNAL'],
    23: ['ON AIR', 'CH 1 AVG', 'CH 2 AVG', 'HUM', 'TRIM 2', 'PLUG', 'PREDICT', 'MIX', 'CH 2', 'DJ 1', 'DJ 2'],
    24: ['SIGNAL FLOW', 'THE BOOTH', 'EVENT', 'SETTING UP', 'DOORS OPEN', 'POWER', 'THE ROOM', 'PLAYING', 'FADERS', 'CH 1 ↓', 'CH 1 ↑', 'MIXER', 'DECKS', 'RECORD', 'OPEN THE DOORS', 'SEE', 'MASTER', 'BOOTH'],
  };
  it('a name list for every screen', () => {
    assert.deepEqual(Object.keys(NAMES).map(Number).sort((a, b) => a - b), TITLES.map((_, i) => i + 1));
  });
  for (const [n, names] of Object.entries(NAMES)) {
    it(`Screen ${n} (${titleOf(Number(n))}): every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(G(Number(n)));
      for (const name of names) {
        assert.ok(SRC.includes(name), `Screen ${n}: "${name}" is no longer in the lab's source — update the guide`);
        assert.ok(gt.includes(name), `Screen ${n}: the guide never names "${name}"`);
      }
    });
  }
  it('Screen 11: the guide and the step text both follow the GRID readout (it prints RIGHT, never “ON THE KICK”)', () => {
    const p11 = code(`${DJ}/pages/p11Grid.tsx`);
    assert.match(p11, /if \(gridCorrect\(d\)\) return 'RIGHT';/);
    assert.ok(tryOf(G(11)).includes('GRID reads RIGHT'));
    assert.ok(!textOf(G(11)).includes('ON THE KICK'));
    assert.ok(p11.includes('The GRID readout says RIGHT when it is right.'));
    assert.ok(!p11.includes('ON THE KICK'));
  });
});

describe('3. every TRY THIS number is the screen’s own', () => {
  it('Screen 1: the safe-level tile (NIOSH) — 88 dBA for a 4 h set is 100 %, 91 dBA is 200 %', () => {
    const p01 = code(`${DJ}/pages/p01Welcome.tsx`);
    assert.match(p01, /const LEVELS = \[85, 88, 91, 94, 97, 100\] as const;/);
    assert.match(p01, /const HOURS = \[1, 2, 4\] as const;/);
    assert.match(p01, /`\$\{Math\.round\(dose\)\} % of a day’s allowance \(NIOSH\)`/);
    const at = (db: number) => Math.round(nioshDose([db], [240]));
    assert.equal(at(88), 100);
    assert.equal(at(91), 200);
    assert.ok(tryOf(G(1)).includes(`pick 4 h set and 88 dBA: ${at(88)} % of a day’s allowance. Step up to 91 dBA: ${at(91)} %.`));
  });
  it('Screen 14: MATCH TEMPO TO A — deck B slows 3.2 % to 122 BPM, B PITCH −0.56', () => {
    assert.equal(TRACKS.glassHarbour.bpm, 126);
    assert.equal(TRACKS.nightFerry.bpm, 122);
    const p14 = code(`${DJ}/pages/p14Key.tsx`);
    assert.match(p14, /label="MATCH TEMPO TO A" selected=\{false\} onPress=\{\(\) => setB\(\(\) => \(\{ pitch: pitchFor\(TRACKS\.glassHarbour\.bpm, bpmOf\(getBooth\(\), 'A'\)\) \}\)\)\}/);
    const pitch = pitchFor(126, 122);
    assert.equal(Math.abs(pitch).toFixed(1), '3.2');
    const st = playedSemis({ pitch, keyLock: false, keyShift: 0 });
    assert.equal(st.toFixed(2), '-0.56');
    assert.ok(tryOf(G(14)).includes('deck B slows 3.2 % to 122 BPM and B PITCH reads −0.56'));
  });
  it('the targets quoted are the screens’ own goals', () => {
    const goal = (f: string, s: string) => assert.ok(code(`${DJ}/pages/${f}`).includes(s), `${f}: "${s}"`);
    goal('p06Gain.tsx', "'Deck A: average −21…−15, peaks under −3'");
    goal('p06Gain.tsx', 'within 2 dB of CH1 AVG');
    assert.ok(tryOf(G(6)).includes('−21…−15 dBFS with PK under −3') && tryOf(G(6)).includes('within 2 dB of CH1 AVG'));
    goal('p10Tempo.tsx', "'Match the tempo (±0.1 BPM)', 'Line the beats up (≤ 1/16 beat)'");
    assert.ok(tryOf(G(10)).includes('within a sixteenth of a beat'));
    goal('p19Mic.tsx', "'Mic live: speech peaks −18 … −8 dBFS'");
    assert.ok(tryOf(G(19)).includes('speech peaks sit at −18 to −8 dBFS'));
    goal('p19Mic.tsx', "'Make it ring, then win back 6 dB'");
    goal('p20Pa.tsx', 'until the FLOOR reads about 95 dBA');
    goal('p20Pa.tsx', "'4-hour dose at the decks ≤ 100 %'");
    assert.ok(tryOf(G(20)).includes('about 95 dBA') && tryOf(G(20)).includes('100 % or less'));
    goal('p21Rec.tsx', "'Capture level: peaks −12 … −3 dBFS, no clip'");
    assert.ok(tryOf(G(21)).includes('between −12 and −3 dBFS'));
    goal('p23Changeover.tsx', 'within 2 dB of CH 1 AVG');
    assert.ok(textOf(G(23)).includes('within 2 dB of CH 1 AVG'));
  });
  it('the model facts the guides explain are the screens’ (EQ crossovers, crossfader curves, 6 % per semitone)', () => {
    const p08 = code(`${DJ}/pages/p08Faders.tsx`);
    assert.ok(p08.includes('BLEND keeps the total steady (each side −3 dB in the middle), DIP sags (each −6 dB)'));
    assert.ok(textOf(G(8)).includes('each side −3 dB in the middle') && textOf(G(8)).includes('DIP sags (−6 dB each)'));
    assert.ok(code(`${DJ}/pages/p09Eq.tsx`).includes('crossing over at about 250 Hz and 2.5 kHz'));
    assert.ok(textOf(G(9)).includes('about 250 Hz and 2.5 kHz'));
    assert.ok(code(`${DJ}/pages/p14Key.tsx`).includes('about one semitone for every 6 % of tempo'));
    // 12·log2(1.06) ≈ 1.009 semitones: the rule of thumb holds.
    assert.ok(Math.abs(12 * Math.log2(1.06) - 1) < 0.02);
    assert.ok(textOf(G(14)).includes('about one semitone for every 6 % of tempo'));
  });
});

describe('4. wiring: PagedLab gets the guides', () => {
  it('DJSystemsLabScreen passes pageGuide, by each screen’s title', () => {
    const scr = code(`${DJ}/DJSystemsLabScreen.tsx`);
    assert.match(scr, /import \{ DJ_SCREEN_GUIDES \} from '\.\/djScreenGuides';/);
    assert.match(scr, /const pageGuide = \(i: number\) => \(DJ_PAGES\[i\] \? DJ_SCREEN_GUIDES\[DJ_PAGES\[i\]\.title\] : undefined\);/);
    assert.match(scr, /<PagedLab[\s\S]*?pageGuide=\{pageGuide\}[\s\S]*?\/>/);
  });
  it('the shared shell draws the key and hosts the overlay for a pageGuide (unchanged here)', () => {
    const pl = code('src/screens/lab/kit/PagedLab.tsx');
    assert.match(pl, /const guide = ending \? undefined : def\.guide \?\? pageGuide\?\.\(page\);/);
    assert.match(pl, /<ScreenGuideHost resetKey=\{ending \? 'end' : String\(page\)\} regions=\{!!def\.rack && !ending\}>/);
    // every DJ screen is a Rack Unit page, so every step sits beside its area
    for (const f of PAGE_FILES) assert.match(code(`${DJ}/pages/${f}`), /manualDone: true, rack: true \};/, `${f}: a rack page`);
  });
});

describe('5. the accuracy chip: KEPT (gain/level readouts, modeled dBA and dose)', () => {
  it('PagedLab keeps its default accuracy chip with the lab’s own detail', () => {
    const scr = code(`${DJ}/DJSystemsLabScreen.tsx`);
    assert.match(scr, /accuracyDetail=\{DJ_ACCURACY_DETAIL\}/);
    assert.doesNotMatch(scr, /accuracy=\{false\}/);
    assert.match(scr, /its meters read this model in dBFS/);
  });
  it('the reason, re-vetted from the code: dBFS level readouts, modeled dBA and a 4-hour dose, latency in ms', () => {
    assert.match(code(`${DJ}/pages/shared.tsx`), /v: `\$\{db\.toFixed\(1\)\} dBFS`/);
    const p20 = code(`${DJ}/pages/p20Pa.tsx`);
    assert.match(p20, /k: 'FLOOR'/);
    assert.match(p20, /k: '4-HOUR DOSE'/);
    assert.match(code(`${DJ}/pages/p16Laptop.tsx`), /k: 'LATENCY'/);
  });
});
