/**
 * Beginner waves 1-3 (2026-11-15) · group F2 (Sound Systems + DJ Systems).
 *
 * The owner, 2026-11-15: "build waves 1 thru 3" (D62 adoption plan). Every
 * block pins one item of docs/labs/beginner_waves_2026_11_15/F2_ITEMS.md and
 * would have failed before its change.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';

// House resolver hook: source modules import siblings without extensions.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { FAULTS, firstAbnormal } = await import('../src/features/soundsystems/faults.ts');
const { STATION_ORDER, STATION_LABEL } = await import('../src/features/soundsystems/types.ts');
const fx = await import('../src/screens/lab/soundsystems/fixHelpers.ts');

const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const SS = 'src/screens/lab/soundsystems';
const DJ = 'src/screens/lab/dj';

/* ── SS-09 · every station reads what its name says ─────────────────────── */
describe('SS-09 · a station never contradicts its own name', () => {
  it('no station reading says it is not in the path', () => {
    for (const f of FAULTS) {
      for (const s of STATION_ORDER) {
        const note = f.reads[s].note;
        assert.doesNotMatch(note, /^Not in (this|the)\b/i, `${f.id} · ${s}: "${note}"`);
        assert.doesNotMatch(note, /not in the (chain|monitor path)/i, `${f.id} · ${s}: "${note}"`);
      }
    }
  });
  it('the feedback case gives its Monitor EQ a monitor-EQ reading', () => {
    const f = FAULTS.find((x) => x.id === 'feedback')!;
    assert.equal(f.labels?.processor, 'Monitor EQ');
    assert.match(f.reads.processor.note, /EQ/);
    assert.equal(fx.readoutOf(f.reads.processor), 'OK', 'healthy before the fault station');
  });
  it('a powered top is no longer two look-alike "powered cabinet" stations', () => {
    for (const f of FAULTS) {
      const labels = Object.values(f.labels ?? {});
      assert.ok(!labels.some((l) => /Powered cabinet/i.test(l ?? '')), `${f.id}: ${labels.join(', ')}`);
      // the station that hums / cancels is NAMED the powered top, not a generic Loudspeaker
      if (f.kinds?.amp === 'poweredSpeaker') assert.fail(`${f.id}: the amp station is drawn as a second powered cabinet`);
    }
    const g = FAULTS.find((x) => x.id === 'ground-loop')!;
    assert.equal(g.labels?.speaker, 'Powered top');
    assert.equal(g.labels?.amp, 'Amp inside the top');
    assert.equal(g.labels?.processor, 'Long cable');
    assert.doesNotMatch(g.reads.amp.note, /^Powered cabinet/);
    const p = FAULTS.find((x) => x.id === 'polarity')!;
    assert.equal(p.labels?.speaker, 'Powered tops');
  });
  it('the readings still teach the same walk (healthy before, fault at the fault station)', () => {
    for (const f of FAULTS) assert.equal(firstAbnormal(f), f.faultAt, f.id);
  });
  it('badges carry no OK in front of a flag', () => {
    for (const f of FAULTS) for (const s of STATION_ORDER) assert.doesNotMatch(fx.readoutOf(f.reads[s]), /^OK ·/, `${f.id} · ${s}`);
  });
  it('the map names stay short enough for two map lines', () => {
    for (const f of FAULTS) for (const l of Object.values(f.labels ?? {})) assert.ok((l ?? '').length <= 22, `${f.id}: ${l}`);
    assert.ok(STATION_LABEL.speaker);
  });
});

/* ── SS-11 · the trace page's dock key is not a second NEXT ─────────────── */
describe('SS-11 · Trace the signal: the dock key is STATION, not NEXT', () => {
  const src = read(`${SS}/pagesLearnA.tsx`);
  const trace = src.slice(src.indexOf('function PageTrace') >= 0 ? src.indexOf('function PageTrace') : src.indexOf("'Trace source → listener in order'"));
  it('the dock key reads STATION', () => {
    assert.doesNotMatch(src, /label: 'NEXT'/);
    assert.match(trace, /id: 'next',[\s\S]{0,400}label: 'STATION'/);
  });
  it('the caption and the screen guide name the same key', () => {
    assert.doesNotMatch(src, /Open NEXT and tap/);
    const guide = read(`${SS}/soundsystemsScreenGuides.ts`);
    const block = guide.slice(guide.indexOf("'Trace the signal': {"), guide.indexOf("'Trace the signal': {") + 1600);
    assert.doesNotMatch(block, /Open NEXT/);
    assert.match(block, /Open STATION and tap/);
  });
});

/* ── DJ-04 · a goal set up right with the deck stopped says "press PLAY" ── */
describe('DJ-04 · goals that wait on PLAY say so', async () => {
  const gw = await import('../src/screens/lab/dj/goalWords.ts');
  it('the chip words: ○ label · Right, now press PLAY to hear it', () => {
    const w = gw.goalChipWords('Mute the melody (original)', false, gw.waitIf(true, true, 'A'));
    assert.equal(w.mark, '○ ');
    assert.equal(w.text, 'Mute the melody (original) · Right, now press PLAY A to hear it');
    assert.equal(w.waiting, true);
    assert.match(w.a11y, /not yet\. Right, now press PLAY A to hear it/);
    assert.equal(gw.WAIT_PLAY, 'Right, now press PLAY to hear it');
  });
  it('no wait line once the goal is met, or while the set-up is wrong, or while the deck plays', () => {
    assert.equal(gw.goalChipWords('X', true, gw.WAIT_PLAY).text, 'X');
    assert.equal(gw.waitIf(false, true, 'A'), undefined);
    assert.equal(gw.waitIf(true, false, 'A'), undefined);
    assert.equal(gw.goalChipWords('X', false, undefined).text, 'X');
  });
  it('the turntable and both-decks lines name the real keys', () => {
    assert.match(gw.waitFor('tt'), /START TURNTABLE/);
    assert.match(read(`${DJ}/pages/p17Vinyl.tsx`), /▶ START TURNTABLE/);
    assert.match(read(`${DJ}/dock.tsx`), /'▶ PLAY'/);
    assert.match(gw.waitFor('both'), /both decks/);
  });
  it('GoalChips draws the wait line, and the audited screens pass one', () => {
    const bits = read(`${DJ}/bits.tsx`);
    assert.match(bits, /goalChipWords\(g\.label, !!latched\[i\], g\.wait\)/);
    for (const f of ['p03Connect', 'p07Cue', 'p08Faders', 'p14Key', 'p15Stems', 'p16Laptop', 'p17Vinyl', 'p18Dvs']) {
      const src = read(`${DJ}/pages/${f}.tsx`);
      assert.match(src, /\(\{ label, hit: hits\[i\], wait: waits\[i\] \}\)/, f);
    }
  });
  it('the wait line never changes what ticks a goal (hits are computed before the waits)', () => {
    for (const f of ['p03Connect', 'p07Cue', 'p14Key', 'p15Stems']) {
      const src = read(`${DJ}/pages/${f}.tsx`);
      assert.ok(src.indexOf('const hits = [') < src.indexOf('const waits = ['), f);
      assert.doesNotMatch(src.slice(src.indexOf('const waits = [')), /h\.current\.\w+ = true/, f);
    }
  });
});

/* ── DJ-05 · the intro card and the page name the same first move ────────── */
describe('DJ-05 · WHERE TO START and the page agree on the first control', async () => {
  const { DJ_SCREEN_GUIDES } = await import('../src/screens/lab/dj/djScreenGuides.ts');
  const cases: [string, string, RegExp, RegExp][] = [
    ['Welcome and safe operation', 'p01Welcome', /^Find ■ STOP in the dock, then press PLAY A/, /<Do>Find ■ STOP in the dock[^<]*Then press PLAY A/],
    ['Meet the DJ equipment', 'p02Gear', /Open EQUIPMENT and pick the device/, /open EQUIPMENT and pick it/],
    ['Connections and signal types', 'p03Connect', /^Open IDENTIFY and pick each socket/, /Open IDENTIFY and pick it/],
  ];
  for (const [title, file, guideRe, pageRe] of cases) {
    it(title, () => {
      const start = DJ_SCREEN_GUIDES[title].intro!.start;
      assert.match(start, guideRe);
      assert.match(read(`${DJ}/pages/${file}.tsx`), pageRe);
      assert.ok(start.split(/\s+/).length <= 40, `${title}: ${start.split(/\s+/).length} words`);
    });
  }
  it('screen 1 no longer opens on the exposure tile; screen 3 no longer opens on PATCH', () => {
    assert.doesNotMatch(DJ_SCREEN_GUIDES['Welcome and safe operation'].intro!.start, /^In the A LOUD NIGHT/);
    assert.doesNotMatch(DJ_SCREEN_GUIDES['Connections and signal types'].intro!.start, /^Use PATCH/);
  });
});

/* ── DJ-08 · the on-air track never runs out during the event ────────────── */
describe('DJ-08 · screen 24: a playing track repeats its last phrases instead of ending', async () => {
  const eg = await import('../src/screens/lab/dj/pages/eventGuards.ts');
  const music = await import('../src/screens/lab/dj/engine/djMusic.ts');
  it('a deck near its end jumps back whole 32-bar phrases (its beat stays put)', () => {
    const tk = 'nightFerry' as const;
    const end = music.trackSeconds(tk) - 1;
    const bar = music.barSec(tk);
    assert.equal(eg.repeatPhrasePos(end - 60, end, bar), null, 'far from the end: nothing');
    const p = eg.repeatPhrasePos(end - 10, end, bar)!;
    assert.ok(p != null && end - p > eg.REPEAT_LEAD_SEC, 'well clear of the end afterwards');
    const jumped = (end - 10 - p) / bar;
    assert.ok(Math.abs(jumped - Math.round(jumped)) < 1e-9 && Math.round(jumped) % 32 === 0, `whole phrases: ${jumped} bars`);
    // past the end (a deck that ran out before this screen was opened) comes back too
    assert.ok(eg.repeatPhrasePos(end + 5, end, bar)! < end - eg.REPEAT_LEAD_SEC);
  });
  it('the event page wires it in, and says so in an existing line', () => {
    const src = read(`${DJ}/pages/p24Capstone.tsx`);
    assert.match(src, /repeatPhrasePos\(deckPos\(x\.decks\[id\], tt\)/);
    assert.match(src, /seek\(x, tt, id, p\)/);
    assert.match(src, /a playing track repeats its last phrases instead of running out/);
  });
});

/* ── SH-75-F · the check guide no longer repeats the card's no-score line ── */
describe('SH-75-F · Sound Systems CHECK guide drops the repeated no-score sentence', () => {
  it('the sentence the shared card now says is not repeated', () => {
    const g = read(`${SS}/soundsystemsScreenGuides.ts`);
    assert.doesNotMatch(g, /Nothing is lost and there is no score/);
    assert.doesNotMatch(g, /costs you nothing, and there is no score/);
    assert.match(g, /Every wrong option has its own reason, so a wrong pick still teaches you something\. Once every question is correct, the check is passed\./);
  });
});

/* ── sweep, wave 1 (SH-11 · SH-35 · SH-64) ──────────────────────────────── */
describe('SH-11 · DJ WHERE TO START lines open with a step that can be seen with sound off', async () => {
  const { DJ_SCREEN_GUIDES } = await import('../src/screens/lab/dj/djScreenGuides.ts');
  it('no WHERE TO START ends its first move on a listening-only instruction', () => {
    const all = Object.values(DJ_SCREEN_GUIDES).map((g) => g.intro?.start ?? '');
    assert.match(all.find((s) => s.startsWith('In CUE press')) ?? '', /Watch CUE BUS and PHONES L/);
    assert.ok(!all.some((s) => /listen for what is left/.test(s)));
    assert.ok(all.some((s) => /read MELODY LEFT/.test(s)));
    assert.ok(all.some((s) => /press SYNC B: REAL BEATS shows/.test(s)));
    for (const s of all) assert.ok(s.split(/\s+/).length <= 40, s);
  });
});

describe('SH-35 · the DJ dock keeps DECKS just before ■ STOP on every screen', () => {
  it('screen 24 had DECKS in the middle; now DECKS, then STOP', () => {
    const src = read(`${DJ}/pages/p24Capstone.tsx`);
    const i = src.indexOf("id: 'event', label: 'EVENT'");
    const j = src.indexOf("id: 'decks', label: 'DECKS'");
    const k = src.indexOf('stopKey(tr),', j);
    assert.ok(i > 0 && j > i && k > j && src.slice(j, k).split('\n').length <= 3);
  });
  it('every screen that has DECKS puts it right before STOP', () => {
    // p04Build keeps its UNWIRE reset between DECKS and STOP (a reset sits just before STOP, as RESET on screen 1)
    const files = ['p06Gain', 'p08Faders', 'p09Eq', 'p10Tempo', 'p11Grid', 'p12Loops', 'p13Effects', 'p14Key', 'p15Stems', 'p16Laptop'];
    for (const f of files) {
      const s = read(`${DJ}/pages/${f}.tsx`);
      const between = s.slice(s.lastIndexOf('boothKey(') + 'boothKey('.length, s.lastIndexOf('stopKey(tr)'));
      assert.ok(between.length > 0, f);
      assert.doesNotMatch(between, /\{ kind: '|\w+Key\(booth/, f);
    }
  });
});

describe('SH-64 · the X-FADER key is greyed out with a reason while both channels are on THRU', async () => {
  const gw = await import('../src/screens/lab/dj/goalWords.ts');
  it('locked only when neither channel reaches the crossfader', () => {
    assert.match(gw.xfIgnoredWhy('THRU', 'THRU')!, /crossfader does nothing/);
    assert.equal(gw.xfIgnoredWhy('A', 'THRU'), undefined);
    assert.equal(gw.xfIgnoredWhy('THRU', 'B'), undefined);
    assert.match(gw.XF_IGNORED, /\.$/, 'a fader key prints its locked line as given (seen at 390: no stop was added)');
  });
  it('the key passes it', () => {
    assert.match(read(`${DJ}/dock.tsx`), /locked: xfIgnoredWhy\(booth\.ch\[1\]\.xf, booth\.ch\[2\]\.xf\)/);
  });
});

/* ── SS-01 · heavy pages open with the idea; the formula is folded ───────── */
describe('SS-01 · plain idea first, formula under GO DEEPER', () => {
  const B = read(`${SS}/pagesLearnB.tsx`);
  const C = read(`${SS}/pagesLearnC.tsx`);
  const A = read(`${SS}/pagesLearnA.tsx`);
  const bits = read(`${SS}/bits.tsx`);
  it('no formula line prints on the page itself any more', () => {
    for (const f of ['Ztot = 1 ÷ Σ(1/Zi)', 'SPL = sensitivity + 10·log10(P) − 20·log10(d) − headroom', 't = d ÷ c · c = 331.3 × √(1 + T/273.15)']) {
      const src = f.startsWith('t =') ? C : B;
      assert.ok(src.includes(`<FormulaFold formula="${f}">`), f);
      assert.ok(!src.includes(`<Text style={styles.path}>${f}</Text>`), f);
    }
  });
  it('each of those pages opens with "The idea:" before its picture-description', () => {
    for (const [src, tag] of [[B, 'AMPLIFIERS AND LOUDSPEAKER COMPATIBILITY · LOADS'], [B, 'POWER RATINGS, HEADROOM AND PROTECTION'], [C, 'DELAY TIME, TIME ALIGNMENT AND POLARITY']] as const) {
      const after = src.slice(src.indexOf(tag));
      const body = after.slice(after.indexOf('<Body>') + 6, after.indexOf('</Body>'));
      assert.match(body, /^The idea: /, tag);
    }
  });
  it('the fold is the shared GO DEEPER (one per page: the link row rides inside it)', () => {
    assert.match(bits, /import \{ GoDeeper \} from '\.\.\/foundations\/GoDeeper'/);
    assert.match(bits, /<DeeperRow bare>/);
  });
  it('comb-filter is said in plain words where it first appears', () => {
    assert.doesNotMatch(A, /overlap and comb-filter\./);
    assert.match(A, /they add at some pitches and cancel at others \(comb filtering\)/);
  });
});

/* ── SS-10 · capstones 7, 8 and 10 open the desk one step at a time ─────── */
describe('SS-10 · the console tray shows only the current step', async () => {
  const { CAPSTONES } = await import('../src/features/soundsystems/capstones.ts');
  const build = read(`${SS}/pagesBuild.tsx`);
  const routeUiCols = (id: string): string[] => {
    const at = build.indexOf(`${/^[a-z]+$/.test(id) ? id : `'${id}'`}: {`, build.indexOf('export const ROUTE_UI'));
    const c0 = build.indexOf('columns: [', at);
    const blk = build.slice(c0, build.indexOf(']', c0));
    return [...blk.matchAll(/'((?:send:aux\d+)|main|sub|dca)'/g)].map((m) => m[1]);
  };
  for (const id of ['groups-fx', 'matrices', 'festival']) {
    it(`${id}: every console requirement and every desk column lives in exactly one step`, () => {
      const steps = fx.CONSOLE_STEPS[id];
      const cap = CAPSTONES.find((c: { id: string }) => c.id === id)!;
      const route = cap.requirements.filter((r: { kind: string }) => r.kind === 'route').map((r: { id: string }) => r.id).sort();
      assert.deepEqual(steps.flatMap((s) => s.reqs).sort(), route);
      const cols = steps.flatMap((s) => s.columns);
      assert.equal(new Set(cols).size, cols.length, 'no column twice');
      assert.deepEqual([...cols].sort(), routeUiCols(id).sort());
      for (const h of steps.flatMap((x) => x.hears)) assert.ok(build.includes(`title: '${h}'`), h);
    });
  }
  it('the first unmet step is open; a tapped header wins; all met → none open', () => {
    const steps = fx.CONSOLE_STEPS['groups-fx'];
    assert.equal(fx.openConsoleStep(steps, [], null), 0);
    assert.equal(fx.openConsoleStep(steps, ['drumsSub', 'drumsMain'], null), 1);
    assert.equal(fx.openConsoleStep(steps, ['drumsSub', 'drumsMain', 'reverb'], null), 2);
    assert.equal(fx.openConsoleStep(steps, ['drumsSub', 'drumsMain', 'reverb', 'dca'], null), -1);
    assert.equal(fx.openConsoleStep(steps, [], 2), 2);
    assert.match(fx.consoleStepHeader(steps[0], ['drumsSub', 'drumsMain'], false), /^✓ GROUP ▾ · /);
  });
  it('the page draws the steps for those capstones and keeps capstone 6’s own fold', () => {
    assert.match(build, /const steps = ui \? CONSOLE_STEPS\[capstone\.id\] : undefined;/);
    assert.match(build, /columns=\{st\.columns as readonly ConsoleColumn\[\]\}/);
    assert.match(build, /capstone\.id === 'monitors' \? MONITOR_CORE_CHANNELS/);
    assert.ok(!fx.CONSOLE_STEPS.monitors);
  });
});

/* ── DJ-10 · a two-half fix says the second half the moment the first is done ── */
describe('DJ-10 · the fault card names the step that proves the fix', async () => {
  const gw = await import('../src/screens/lab/dj/goalWords.ts');
  const gf = await import('../src/screens/lab/dj/pages/gridFault.ts');
  const { TRACKS } = await import('../src/screens/lab/dj/engine/djMusic.ts');
  it('screen 10: in phase with CH2 still down → "Now bring CH2 back UP"', () => {
    const base = { faultOn: true, pulled: true, bpmMatch: true, inPhase: true, ch2Fader: 0 };
    assert.match(gw.tempoHalfway(base)!, /Now bring CH2 back UP/);
    assert.equal(gw.tempoHalfway({ ...base, ch2Fader: 0.8 }), null, 'fader up: the fix itself, no line');
    assert.equal(gw.tempoHalfway({ ...base, inPhase: false }), null);
    assert.equal(gw.tempoHalfway({ ...base, faultOn: false }), null);
  });
  it('screen 11: grid doubled but the old loop still runs → "Now set a NEW loop"', () => {
    const bpm = TRACKS.glassHarbour.bpm;
    const deck = (loopBeats: number | null) => ({ track: 'glassHarbour', gridMode: 'HALF_BPM', bpmFix: 2, gridShiftBeats: 0, loop: loopBeats == null ? null : { startSec: 10, lengthSec: (loopBeats * 60) / bpm } }) as never;
    // first half: only when the grid is right; never once the 4-real-beat loop runs
    assert.equal(gf.halfBpmFirstHalf(deck(4)), false);
    for (const n of [4, 8, null]) assert.ok(!(gf.halfBpmFirstHalf(deck(n)) && gf.halfBpmFaultFixed(deck(n))), `never both (${n})`);
    assert.match(gw.GRID_HALFWAY, /LOOP EXIT, then LOOP 4 BEATS/);
    assert.match(read(`${DJ}/pages/p11Grid.tsx`), /halfway=\{halfBpmFirstHalf\(B\) \? GRID_HALFWAY : null\}/);
  });
  it('screen 19: routed to REC, not yet heard there → "Now press TALK NOW"', () => {
    assert.match(gw.micHalfway(true, false)!, /Now press TALK NOW/);
    assert.equal(gw.micHalfway(false, false), null);
    assert.equal(gw.micHalfway(true, true), null);
    assert.match(read(`${DJ}/pages/p19Mic.tsx`), /● TALK NOW/);
  });
  it('FaultCard draws the line only while the fault is on and unfixed', () => {
    const bits = read(`${DJ}/bits.tsx`);
    assert.match(bits, /\{!solved && halfway \? <Text style=\{styles\.halfway\}/);
    for (const f of ['p10Tempo', 'p11Grid', 'p19Mic']) assert.match(read(`${DJ}/pages/${f}.tsx`), /halfway=\{/, f);
  });
});

/* ── DJ-11 · screen 4 step 1 is two sentences ───────────────────────────── */
describe('DJ-11 · screen 4 opens on its one idea', () => {
  const p04 = read(`${DJ}/pages/p04Build.tsx`);
  it('step 1 prints the two-sentence LOOK_SHORT, not the 100-word layout', () => {
    const step1 = p04.slice(p04.indexOf('<Step n={1}>'), p04.indexOf('</Step>', p04.indexOf('<Step n={1}>')));
    assert.match(step1, /<Look>\{LOOK_SHORT\}<\/Look>/);
    assert.doesNotMatch(step1, /<P>/);
    const m = p04.match(/export const LOOK_SHORT = '([^']+)'/)!;
    assert.equal(m[1].split(/(?<=\.)\s+/).length, 2);
    assert.match(m[1], /behind the booth, so left and right are swapped/);
    assert.match(m[1], /9 audio cables/);
    assert.match(m[1], /speakers last/);
  });
  it('the layout moved to the screen guide; the balanced-line fact is one tap away', () => {
    const g = read(`${DJ}/djScreenGuides.ts`);
    assert.match(g, /the room at 1:5 scale: the PA speakers \(PA L on your left\)/);
    assert.match(p04, /\{ term: 'Balanced line', def: '[^']*on this lab’s mixer both are balanced lines, whose inputs reject hum picked up equally on both wires, which matters on long runs\.' \}/);
  });
});

/* ── SH-69 · a solved Sound Systems fault ends on its rule ──────────────── */
describe('SH-69 · "Fixed." paragraphs for the Sound Systems faults', () => {
  it('every fault carries one short rule, in plain words', () => {
    for (const f of FAULTS) {
      assert.ok(typeof f.rule === 'string' && f.rule.length > 20, f.id);
      assert.ok(f.rule.split(/\s+/).length <= 25, `${f.id}: ${f.rule.split(/\s+/).length} words`);
      assert.match(f.rule, /\.$/, f.id);
      assert.doesNotMatch(f.rule, /colou?r(?!s)|organis|behaviour|centre/i, `${f.id}: US spelling`);
      assert.doesNotMatch(f.rule, /\brecommend/i, f.id);
    }
    assert.equal(new Set(FAULTS.map((f) => f.rule)).size, FAULTS.length, 'one rule per fault');
  });
  it('the bench prints "Fixed. <rule>" once solved, and the grade line moved into THE WALK', () => {
    const src = read(`${SS}/pagesTroubleshoot.tsx`);
    assert.match(src, /<VerdictLine ok>\{`Fixed\. \$\{c\.rule\}`\}<\/VerdictLine>/);
    assert.match(src, /<Body>\{`\$\{gradeText\} \$\{c\.forward\}`\}<\/Body>/);
    assert.doesNotMatch(src, /<VerdictLine ok>\{gradeText\}<\/VerdictLine>/);
  });
});

/* ── SS-04 · the home page shows the chain and where to start ───────────── */
describe('SS-04 · the chain in one line, and "Start with LEARN", on the home page', () => {
  it('the chain uses the lab’s own station names, in signal order', () => {
    assert.deepEqual([...fx.SS_CHAIN], ['SOURCE', 'STAGE INPUT', 'CONSOLE', 'PROCESSOR', 'AMPLIFIER', 'LOUDSPEAKER', 'LISTENER']);
    const labels = Object.values(STATION_LABEL).map((l) => l.toUpperCase());
    for (const w of fx.SS_CHAIN) assert.ok(labels.some((l) => l.startsWith(w)), w);
    assert.match(fx.SS_START_LINE, /Start with LEARN/);
  });
  it('it replaces the old lead paragraph (no line added)', () => {
    const src = read(`${SS}/SoundSystemsLabScreen.tsx`);
    assert.doesNotMatch(src, /Finish having designed, wired, routed/);
    assert.match(src, /\{SS_CHAIN\.join\(' → '\)\}/);
    assert.match(src, /\{SS_START_LINE\}/);
  });
});

/* ── DJ-06 · screen 1 opens on the four jobs ────────────────────────────── */
describe('DJ-06 · the four jobs are the first line of screen 1', () => {
  const p01 = read(`${DJ}/pages/p01Welcome.tsx`);
  it('step 1 starts with the four-jobs sentence, then the drawing', () => {
    const step1 = p01.slice(p01.indexOf('<Step n={1}>'), p01.indexOf('</Step>', p01.indexOf('<Step n={1}>')));
    assert.ok(step1.indexOf('{DJ_FOUR_JOBS}') > 0 && step1.indexOf('{DJ_FOUR_JOBS}') < step1.indexOf('<Look>'));
    assert.match(p01, /DJ_FOUR_JOBS = 'Every DJ setup does four jobs: PLAY the music, MIX it, let YOU hear the next track, and let the ROOM hear the mix\./);
    assert.doesNotMatch(p01, /In this lab you put together/);
    assert.equal((step1.match(/<P>/g) ?? []).length, 2, 'the summary paragraph it replaced is gone (a line in, a line out)');
  });
});

/* ── DJ-13 · screen 6: the gain target shown where the average is read ── */
describe('DJ-13 · the target is on the AVG readout, not on the peak meter columns (checker fix)', async () => {
  const L = await import('../src/screens/lab/dj/model/djLessons.ts');
  it('on target is exactly the goal’s own test', () => {
    assert.equal(L.avgOnTarget({ avg: -18, peak: -6 } as never), true);
    assert.equal(L.avgOnTarget({ avg: -18, peak: -1 } as never), false, 'peaks over the ceiling');
    assert.equal(L.avgOnTarget({ avg: -25, peak: -12 } as never), false);
    assert.deepEqual(L.AVG_BAND, { lo: -21, hi: -15 });
  });
  it('no band on the LED columns (they are PEAK meters); the AVG cell turns green with a ✓', () => {
    const p06 = read(`${DJ}/pages/p06Gain.tsx`);
    assert.doesNotMatch(p06, /bandY|AVG_BAND|rgba\(91,255,133,0\.16\)/);
    assert.match(read(`${DJ}/engine/djRender.ts`), /Peak meter ballistics/);
    assert.match(p06, /v: on \? `\$\{l\.avg\.toFixed\(1\)\} ✓` : l\.avg\.toFixed\(1\)/);
    assert.match(p06, /tint: on \? colors\.green :/);
    assert.match(p06, /\(CH1 AVG turns green with a ✓ there\)/);
  });
});

/* ── SH-26 · codes spelled out · SH-76 · tray choices carry a meaning ───── */
describe('SH-26 · the PATCH tray spells out its chip codes', async () => {
  const gw = await import('../src/screens/lab/dj/goalWords.ts');
  it('only the codes the tray shows', () => {
    assert.equal(gw.patchCodeKey(['A·L', 'A·R', 'MST·L', 'BTH·R', 'PWR PA L', 'PWR BTH L', 'PHONES']), 'MST = MASTER OUT · BTH = booth · PWR = power cord · L / R = left / right');
    // checker fix: BTH is BOOTH OUT on BTH·L and a booth monitor on PWR BTH L, so the key must fit both
    assert.equal(gw.patchCodeKey(['PWR BTH L']), 'BTH = booth · PWR = power cord · L / R = left / right');
    assert.equal(gw.patchCodeKey(['PHONES']), null);
    assert.equal(gw.patchCodeKey(['TT·L']), 'TT = turntable · L / R = left / right');
  });
  it('the tray draws it under its head', () => {
    assert.match(read(`${DJ}/trays.tsx`), /const codeKey = patchCodeKey\(plugs\.map\(\(p\) => PLUGS\[p\]\.short\)\);/);
  });
});
describe('SH-76 · the ROUTE BUS tray: every choice has a one-line meaning', () => {
  it('each bus the tray lists has a blurb', () => {
    const src = read(`${SS}/pagesRoute.tsx`);
    const buses = [...src.match(/const BUSES = \[([^\]]+)\]/)![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    for (const b of buses) assert.ok(fx.BUS_BLURB[b] && fx.BUS_BLURB[b].split(/\s+/).length <= 25, b);
    assert.match(src, /blurb: BUS_BLURB\[b\]/);
  });
});

/* ── checker fixes (2026-11-15) ─────────────────────────────────────────── */
describe('F2 checker fixes', async () => {
  const gw = await import('../src/screens/lab/dj/goalWords.ts');
  it('SS-01: the Loads page says a parallel cabinet LOWERS the impedance (a heavier load)', () => {
    const B = read(`${SS}/pagesLearnB.tsx`);
    assert.doesNotMatch(B, /makes the load lighter/);
    assert.match(B, /lowers the load’s impedance, so the amplifier must deliver more current, until the load is too low to drive safely/);
  });
  it('DJ-04: a wait line only once the move itself is made', () => {
    const p08 = read(`${DJ}/pages/p08Faders.tsx`);
    assert.match(p08, /m\.xfCurve === 'BLEND' && \(m\.xf < 0\.15 \|\| m\.xf > 0\.85\)/);
    assert.match(p08, /m\.xfCurve === 'CUT' && \(m\.xf < 0\.02 \|\| m\.xf > 0\.98\)/);
    assert.match(read(`${DJ}/pages/p07Cue.tsx`), /booth\.ch\[2\]\.cue && booth\.ch\[2\]\.fader > 0\.5 && !upDown\.current\.down/);
    void gw;
  });
  it('SS LEARN wrap page: a knowledge title', () => {
    const C = read(`${SS}/pagesLearnC.tsx`);
    assert.doesNotMatch(C, /What you can now do|WHAT YOU CAN NOW DO/);
    assert.match(C, /title: 'What you now know'/);
    assert.match(read(`${SS}/soundsystemsScreenGuides.ts`), /'What you now know': \{/);
  });
  it('SH-69: the ground-loop rule no longer repeats its WHY', () => {
    const g = FAULTS.find((f) => f.id === 'ground-loop')!;
    assert.ok(!g.explain.startsWith(g.rule.slice(0, 30)));
    assert.doesNotMatch(g.rule, /survives muting/);
  });
  it('SS-10: the open step’s own header folds it shut', () => {
    const steps = fx.CONSOLE_STEPS['groups-fx'];
    assert.equal(fx.openConsoleStep(steps, [], -1), -1);
    assert.match(read(`${SS}/pagesBuild.tsx`), /setPickedStep\(isOpen \? -1 : i\)/);
  });
});
