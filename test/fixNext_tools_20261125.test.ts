/**
 * Round 2, TOOLS group (owner 2026-11-25: "Fix-first 15", then "continue with
 * next fixes"). Checker corrections T1–T5 on the round-1 changes, then the
 * next fixes from the lab controls audit (Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md,
 * Appendices C and D). Each `it` fails on the code before this round.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { plainTempoDeck } from '../src/screens/lab/dj/pages/tempoDeck.ts';
import { builtBooth } from '../src/screens/lab/dj/model/djModel.ts';
import { PITCH_RANGE_PCT } from '../src/screens/lab/dj/model/djTime.ts';
import { spDevice, spUpdateDevice, spUpdateObject } from '../src/features/stageplot/spModel.ts';
import { spFromTemplate, SP_TEMPLATES } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';
import { gaInitial, gaReduce, type GaAction, type GaState } from '../src/screens/lab/gameaudio/model/gaModel.ts';
import type { HeadState } from '../src/screens/lab/drumtuning/drumEngine.ts';

// stageLinks / spPacket / gaSceneLogic import neighbors with no extension (the app's way).
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { stageName } = await import('../src/screens/lab/stageplot/stage/stageLinks.ts');
const { spBuildDoc, spBuildSnapshot } = await import('../src/features/stageplot/spPacket.ts');
const { gaSoundingOf, gaRingGap } = await import('../src/screens/lab/gameaudio/scene/gaSceneLogic.ts');
const { DRUMS, evenHead, fundamentalHz, meanTension, renderStrike } = await import('../src/screens/lab/drumtuning/drumEngine.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
/** Lift one exported top-level function out of a source file and run it. */
function lift<T>(src: string, name: string): T {
  const m = src.match(new RegExp(`export function ${name}\\([\\s\\S]*?\\n\\}\\n`));
  assert.ok(m, `${name} exists`);
  const js = ts.transpileModule(m[0].replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(`${js}\nreturn ${name};`)() as T;
}

/* ══ A · corrections T1–T5 ═══════════════════════════════════════════════ */

describe('T1 · Cable Install: re-checking a passed bend never lowers the score', () => {
  it('only a bend that has not met its spec counts a miss', () => {
    const M = read('src/screens/lab/cableinstall/scenes/MechScene.tsx');
    assert.match(M, /if \(!ok && !bendDone\[i\]\) badBendRef\.current \+= 1;/);
    assert.doesNotMatch(M, /if \(!ok\) badBendRef\.current \+= 1;/);
  });
});

describe('T2 · SPL Meter: START clears the LED meter’s own held peak too', () => {
  const S = read('src/screens/tools/SplMeterScreen.tsx');
  it('startMeter bumps the LED hold reset with the engine reset (rule of 2026-08-28)', () => {
    const body = S.match(/const startMeter = useCallback\(\(\) => \{([\s\S]*?)\}, \[start, resetPeakHold, resetLeq\]\);/);
    assert.ok(body, 'startMeter');
    assert.match(body[1], /resetPeakHold\(\);\n\s*\/\/[^\n]*\n\s*setLedHoldReset\(\(n\) => n \+ 1\);\n\s*resetLeq\(\);/);
    // the state exists before the callback that uses it
    assert.ok(S.indexOf('const [ledHoldReset, setLedHoldReset] = useState(0);') < S.indexOf('const startMeter = useCallback'));
    assert.equal((S.match(/const \[ledHoldReset, setLedHoldReset\]/g) ?? []).length, 1);
  });
});

describe('T3 · SPL help lines say what the screen does', () => {
  const H = read('src/features/lab/guidedLessons/toolHelp.tsx');
  it('PEAK is on the same scale as the big number (dBFS in dBFS mode)', () => {
    assert.match(H, /"The highest instant in the raw, unweighted signal right now, on the same scale as the big number\. CLIP/);
    assert.doesNotMatch(H, /same estimated scale/);
  });
  it('SESSION LOG: with C the column is the unweighted Leq', () => {
    assert.match(H, /SAVE LOG stores it\. With C, that second column is the unweighted Leq: this meter does not log a C-weighted Leq\."/);
  });
});

describe('T4 · DJ Screen 10 adds no KEY LOCK keys to a deck that had none', () => {
  it('a plain deck stays plain: no keyLock / keyShift / tempoRange written onto it', () => {
    const A0 = builtBooth().decks.A;
    assert.equal(A0.keyLock, undefined, 'a fresh deck A carries no key lock');
    const A = plainTempoDeck({ ...A0, pitch: 2.5 });
    assert.equal(A.pitch, 0);
    assert.equal('keyLock' in A, false);
    assert.equal('keyShift' in A, false);
    assert.equal('tempoRange' in A, false);
    // the player draws its KEY LOCK / KEY ± keys exactly when keyLock is defined
    assert.match(read('src/screens/lab/dj/art/PlayerTop.tsx'), /\{d\.keyLock !== undefined \? <KeyLockKeys d=\{d\} \/> : null\}/);
  });
  it('a deck that carries the Stage 2 settings is still reset to the plain player', () => {
    const B = plainTempoDeck({ ...builtBooth().decks.B, pitch: -3, keyLock: true, keyShift: 2, tempoRange: 16 });
    assert.equal(B.keyLock, false);
    assert.equal(B.keyShift, 0);
    assert.equal(B.tempoRange, PITCH_RANGE_PCT);
    assert.equal(B.pitch, 0);
  });
});

describe('T5 · small ones', () => {
  it('SPL: the false "stored AS DISPLAYED" comment is corrected (dBFS mode stores the SPL estimate)', () => {
    const S = read('src/screens/tools/SplMeterScreen.tsx');
    assert.doesNotMatch(S, /Values are stored AS DISPLAYED/);
    assert.match(S, /Values are stored as estimated dB SPL ALWAYS/);
    // the stored value itself is unchanged
    assert.match(S, /const avgDb = shown\(weighting === 'A' \? m\.leqADb : m\.leqZDb\);/);
  });
  it('Stage Plot: the device keeps the same trimmed name its symbols get', () => {
    const p0 = spFromTemplate('four-piece', { id: 'p-four', now: 1_800_000_000_000, band: 'The Example Four' });
    const o0 = p0.objects.find((o) => o.deviceId && o.label.trim())!;
    const p = spUpdateDevice(p0, o0.deviceId!, { label: '  Leo’s wedge  ' });
    assert.equal(spDevice(p, o0.deviceId)!.label, 'Leo’s wedge');
    assert.equal(p.objects.find((x) => x.id === o0.id)!.label, 'Leo’s wedge');
    // a change that is not a name leaves the name alone
    assert.equal(spDevice(spUpdateDevice(p0, o0.deviceId!, { note: 'x' }), o0.deviceId)!.label, spDevice(p0, o0.deviceId)!.label);
  });
});

/* ══ B · next fixes ═══════════════════════════════════════════════════════ */

describe('Stage Plot › Inputs: each list keeps its own "keep reserved channels free" choice', () => {
  it('the order panel remounts per list, so it re-reads that list’s choice', () => {
    const I = read('src/screens/lab/stageplot/InputsArea.tsx');
    assert.match(I, /<OrderPanel key=\{`\$\{p\.id\}:\$\{patchId\}`\} patchId=\{patchId\} fold=\{fold\('order'\)\} \/>/);
    // the choice it re-reads is per plot and per list (unchanged)
    const O = read('src/screens/lab/stageplot/inputs/OrderPanel.tsx');
    assert.match(O, /const choiceKey = `\$\{p\.id\}:\$\{patchId\}`;/);
    assert.match(O, /useState\(keepReservedChoice\[choiceKey\] \?\? true\)/);
  });
});

describe('Stage Plot › an empty "Name on the plot" prints no name, on paper too', () => {
  const NOW = 1_800_000_000_000;
  const plotItems = (p: SpProject): { id: string; label: string }[] => {
    const d = spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'full' }, NOW));
    for (const s of d.sections) for (const b of s.blocks) if (b.t === 'plot') return b.plot.items;
    throw new Error('no plot');
  };
  it('a monitor symbol whose name was cleared: drawing and packet both print none', () => {
    const p0 = spFromTemplate('four-piece', { id: 'p-four', now: NOW, band: 'The Example Four' });
    const o0 = p0.objects.find((o) => o.deviceId && o.label.trim())!;
    const devName = spDevice(p0, o0.deviceId)!.label;
    const p = spUpdateObject(p0, o0.id, { label: '' });
    const o = p.objects.find((x) => x.id === o0.id)!;
    assert.equal(stageName(p, o), '', 'the drawing prints no name');
    const item = plotItems(p).find((i) => i.id === o0.id);
    assert.ok(item, 'the symbol is on the printed plot');
    assert.equal(item.label, '', `the packet printed "${item.label}" (the device is "${devName}")`);
  });
  it('every example plot: any monitor symbol whose name is cleared prints none', () => {
    let seen = 0;
    for (const t of SP_TEMPLATES) {
      const p0 = spFromTemplate(t.id, { id: `p-${t.id}`, now: NOW, band: 'The Example Band' });
      for (const o0 of p0.objects.filter((o) => o.deviceId)) {
        const p = spUpdateObject(p0, o0.id, { label: '' });
        const it = plotItems(p).find((i) => i.id === o0.id);
        if (!it) continue;
        seen++;
        assert.equal(stageName(p, p.objects.find((x) => x.id === o0.id)!), '');
        assert.equal(it.label, '', `${t.id}: ${o0.id}`);
      }
    }
    assert.ok(seen > 0);
  });
});

describe('Stage Plot › Stage: the "Selected … facing" line follows the TURN fader', () => {
  it('reads the shown turn (the drag preview), as the drawing does', () => {
    const A = read('src/screens/lab/stageplot/StageArea.tsx');
    assert.match(A, /const shownRot = sel \? \(turn && turn\.id === sel\.id \? turn\.rot : sel\.rot\) : 0;/);
    assert.match(A, /Selected: \$\{selName\} \(\$\{stageWhere\(sel, p\.stage\)\}, \$\{stageFacingWord\(shownRot, p\.stage\)\}\)\./);
    assert.doesNotMatch(A, /stageFacingWord\(sel\.rot/);
  });
});

describe('SPL Meter › reference gauge: number colour vs lit segments (audit row was wrong)', () => {
  it('whenever there is a number, its colour comes from the same level as the lit segments', () => {
    const G = read('src/screens/tools/Spl3dGauge.tsx');
    // centerColor (the 3 s zone EMA) is used ONLY when the gauge has no level
    assert.match(G, /const numColor = band \? ZONE_HEX\[band\.zone\] : centerColor \?\? INK;/);
    assert.match(G, /const band = level == null \? null : activeBand\(level, mode\);/);
    const S = read('src/screens/tools/SplMeterScreen.tsx');
    assert.equal((S.match(/level=\{gaugeSpl\}/g) ?? []).length, 2, 'both gauges get the 5 s average as level');
    assert.match(S, /const gaugeText = gaugeSpl != null \? `\$\{gaugeSpl\}` : '—';/);
  });
});

describe('Signal Generator › OUT reads "—" while stopped', () => {
  it('OUT checks the engine’s own running flag, like the OUTPUT row', () => {
    const G = read('src/screens/tools/SignalGenScreen.tsx');
    assert.match(G, /k: 'OUT',[\s\S]{0,400}?v: status && genRunning \? `\$\{status\.effectiveLevelDb\.toFixed\(1\)\} dBFS` : '—',\n\s*tint: levelColorForDb\(genRunning \? status\?\.effectiveLevelDb : undefined\),/);
    assert.match(G, /\{status && genRunning \? `\$\{status\.effectiveLevelDb\.toFixed\(1\)\} dBFS` : '—'\}/);
  });
});

describe('Frequency Counter › Tap: HOLD keeps AVG (5 s) too', () => {
  const F = read('src/screens/tools/FrequencyCounterScreen.tsx');
  const delay = lift<(last: number, now: number, held: boolean) => number | null>(F, 'tapAvgClearDelayMs');
  it('no clear timer while held; after release only what is left of the 5 s', () => {
    assert.equal(delay(1000, 1000, true), null);
    assert.equal(delay(1000, 9000, true), null);
    assert.equal(delay(1000, 1000, false), 5000, 'unchanged: 5 s after a tap');
    assert.equal(delay(1000, 3000, false), 3000);
    assert.equal(delay(1000, 60000, false), 0, 'a release after 5 s clears at once: HOLD never extends it');
  });
  it('the timer effect re-runs on HOLD and uses the rule', () => {
    assert.match(F, /const delay = tapAvgClearDelayMs\(last, Date\.now\(\), held\);\n\s*if \(delay != null\) avgClearTimer\.current = setTimeout\(\(\) => setAvg5s\(null\), delay\);\n\s*\}, \[taps, held\]\);/);
    assert.doesNotMatch(F, /setTimeout\(\(\) => setAvg5s\(null\), 5000\)/);
  });
});

describe('Cable Install › Supports: a longer gap sags deeper', () => {
  const SU = read('src/screens/lab/cableinstall/scenes/SupportsScene.tsx');
  // the drawing's own geometry and sampled profile, run as written
  const chunk = SU.slice(SU.indexOf('const POS_UNITS = '), SU.indexOf('/** Sample-index ranges'));
  const geo = new Function(
    `${ts.transpileModule(chunk.replace(/export function/g, 'function'), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText}\nreturn { sagProfile, anchorsFor, sagDepthPx, SAMPLE_X, CABLE_Y, UNIT, X1, SAG_ROOM_PX, SAG_LIMIT_UNITS, SPEC_EVERY };`,
  )() as {
    sagProfile: (a: number[]) => number[];
    anchorsFor: (s: Set<number>) => number[];
    sagDepthPx: (s: number, e: number, l: number, r: number) => number;
    SAMPLE_X: number[];
    CABLE_Y: number;
    UNIT: number;
    X1: number;
    SAG_ROOM_PX: number;
    SAG_LIMIT_UNITS: number;
    SPEC_EVERY: number;
  };
  const dip = (span: number) => geo.sagDepthPx(span, geo.SPEC_EVERY, geo.SAG_LIMIT_UNITS * geo.UNIT, geo.SAG_ROOM_PX);
  it('to scale up to the ½-unit limit; past it strictly deeper for every longer span', () => {
    assert.equal(dip(2), 3.5);
    assert.equal(dip(4), 14, 'a 4-unit span hangs exactly to the MAX SAG line');
    const d = [6, 8, 10, 12].map(dip);
    for (let i = 1; i < d.length; i++) assert.ok(d[i] - d[i - 1] > 2.5, `span ${6 + 2 * i} only ${(d[i] - d[i - 1]).toFixed(1)} px deeper`);
    assert.ok(d[0] > 14 && d[3] < 50, d.map((x) => x.toFixed(1)).join(' / '));
  });
  it('the sag never reaches the ruler or the two-line MAX SAG / ½ UNIT label, for any of the 32 layouts', () => {
    // "MAX SAG": 11 pt Oswald SemiBold caps + 0.8 letter spacing, right-aligned
    // at X1−2, about 41 px wide (46 allowed); its caps top ~9 px above the baseline
    const labelLeft = geo.X1 - 2 - 46;
    const labelTop = geo.CABLE_Y + geo.SAG_LIMIT_UNITS * geo.UNIT + 29 - 9.5;
    assert.match(SU, /y=\{CABLE_Y \+ SAG_LIMIT_UNITS \* UNIT \+ 29\}/);
    let minGap = Infinity;
    for (let mask = 0; mask < 32; mask++) {
      const placed = new Set([0, 1, 2, 3, 4].filter((i) => mask & (1 << i)));
      const ys = geo.sagProfile(geo.anchorsFor(placed));
      ys.forEach((y, s) => {
        // cable body: stroke half-width 1.75 + the 1.5 drop shadow
        assert.ok(y + 1.75 + 1.5 < 94, `layout ${mask}: the cable reaches the ruler`);
        // the strained halo (8 wide) included; from the sample left of the label
        // too, since the drawn line runs straight between samples
        if (geo.SAMPLE_X[s] >= labelLeft - 7) minGap = Math.min(minGap, labelTop - (y + 4));
        if (geo.SAMPLE_X[s] >= labelLeft - 7) assert.ok(y + 4 < labelTop, `layout ${mask}: the sag runs into the label at x ${geo.SAMPLE_X[s].toFixed(0)} (y ${y.toFixed(1)})`);
      });
    }
    assert.ok(minGap >= 2, `halo-to-label clearance ${minGap.toFixed(2)} px`);
    // the second line stays clear of the ruler's first ticks (y 94/96)
    assert.match(SU, /y=\{CABLE_Y \+ SAG_LIMIT_UNITS \* UNIT \+ 40\}/);
    assert.match(SU, />\n\s*MAX SAG\n\s*<\/SvgText>/);
    assert.match(SU, />\n\s*½ UNIT\n\s*<\/SvgText>/);
  });
});

describe('Cable Install › Fire: the rule card agrees with the banner after a correct retry', () => {
  it('both rule cards follow solvedBy, like the banner; the scored first pick is unchanged', () => {
    const F = read('src/screens/lab/cableinstall/scenes/FireScene.tsx');
    assert.match(F, /<RuleFeedback ruleId=\{selSpace\.ruleId\} verdict=\{solvedBy\(selSpace\.id, selAns, selSpace\.correctIdx\) \? 'good' : 'bad'\}/);
    assert.match(F, /<RuleFeedback ruleId=\{q\.ruleId\} verdict=\{solvedBy\(q\.id, ans, q\.correctIdx\) \? 'good' : 'bad'\}/);
    assert.doesNotMatch(F, /verdict=\{selAns === selSpace\.correctIdx|verdict=\{ans === q\.correctIdx/);
    // the folded score line still shows the first pick
    assert.match(F, /const ok = flowAns\[qi\] === q\.correctIdx;/);
  });
});

describe('Game Audio › an orphaned loop’s rings keep its speed', () => {
  function run(s: GaState, ...actions: GaAction[]): GaState {
    let t = s.t;
    for (const a of actions) {
      t += 0.05;
      s = gaReduce(s, a, t).state;
    }
    return s;
  }
  it('SPEED 0.9, then remove the generator with the loop left playing: rings at 0.9, as the sound', () => {
    const s = run(
      gaInitial(),
      { type: 'addMachine' },
      { type: 'speed', id: 'generator-2', value: 0.9 },
      { type: 'machine', id: 'generator-2', on: true },
      { type: 'fault', patch: { orphanLoop: true } },
      { type: 'removeMachine', id: 'generator-2' },
    );
    assert.equal(s.machines.some((m) => m.id === 'generator-2'), false);
    const orphan = s.inst.find((i) => i.event === 'generator' && i.owner === 'generator-2');
    assert.ok(orphan, 'the orphan loop is still playing');
    assert.equal(orphan.speed, 0.9, 'the model keeps its speed (and the sound uses it)');
    const src = gaSoundingOf(s).find((x: { owner: string }) => x.owner === 'generator-2');
    assert.ok(src, 'the scene draws it');
    assert.equal(src.speed, 0.9);
    assert.notEqual(gaRingGap(src.speed), gaRingGap(0.4));
  });
});

describe('DJ › Screen 22 Hybrid: the INTERNAL drift creeps', () => {
  it('a 4-per-second clock tick re-reads the drift while it can drift', () => {
    const P = read('src/screens/lab/dj/pages/p22Hybrid.tsx');
    assert.match(P, /const driftLive = dm\.sync === 'INT' && running;/);
    assert.match(P, /useAnimatedReaction\(\n\s*\(\) => \(driftLive \? Math\.floor\(motion\.clock\.value \* 4\) : -1\),\n\s*\(n, p\) => \{\n\s*if \(n !== p\) runOnJS\(bumpDrift\)\(n\);\n\s*\},\n\s*\[driftLive\],\n\s*\);/);
    assert.match(P, /const drift = driftLive \? dmDrift\(booth, boothNow\(\)\) : null;/);
    assert.match(P, /import \{ runOnJS, useAnimatedReaction \} from 'react-native-reanimated';/);
  });
});

describe('Drum Tuning › Ch1 "Turn one rod": the reso line stays true as a rod turns', () => {
  it('the line is measured from the same pitch the traces are drawn from (mean tension)', () => {
    const C = read('src/screens/lab/drumtuning/modules/ch1Sound.tsx');
    assert.match(C, /const rodF0 = fundamentalHz\(SPEC\.diameterIn, meanTension\(head\), SPEC\.sigmaBatter\);/);
    assert.match(C, /resoCents=\{1200 \* Math\.log2\(fundamentalHz\(SPEC\.diameterIn, RESO_T, SPEC\.sigmaReso\) \/ rodF0\)\}/);
    // the traces' 0 ¢ is the mean-tension pitch, turns included (renderStrike's fb)
    const spec = DRUMS.rack;
    const head: HeadState = { ...evenHead(3000, spec.lugs) };
    head.turns = head.turns.map((t, i) => (i === 0 ? 1 : t)); // one full turn on rod 1
    const r = renderStrike({ drum: 'rack', batter: head, reso: evenHead(2600, spec.lugs), resoPresent: true, damping: 0, strike: 0.05, strikeR: 0.3, strikeTheta: 0 });
    const fb = fundamentalHz(spec.diameterIn, meanTension(head), spec.sigmaBatter);
    const fStart = fundamentalHz(spec.diameterIn, head.tension, spec.sigmaBatter);
    assert.ok(r.pitchTraces.length > 0);
    const off = 1200 * Math.log2(fb / fStart);
    assert.ok(off > 20, `one turn moves the mean pitch ${off.toFixed(1)} ¢ (the old line was this far off)`);
    // each trace ends (bend gone) at its partial's own pitch measured from fb,
    // not from the starting tension's pitch
    const coupled = r.partials.filter((q: { head: string }) => q.head === 'coupled');
    assert.equal(coupled.length, r.pitchTraces.length);
    r.pitchTraces.forEach((t: { pts: { cents: number }[] }, k: number) => {
      const end = t.pts[t.pts.length - 1].cents;
      assert.ok(Math.abs(end - 1200 * Math.log2(coupled[k].hz / fb)) < 0.5, `trace ${k}: ${end.toFixed(2)} ¢`);
      assert.ok(Math.abs(end - 1200 * Math.log2(coupled[k].hz / fStart)) > 20, 'the starting-tension reference would be off');
    });
  });
});

/* ══ C · round-2 checker corrections ═════════════════════════════════════ */

describe('Check 1 · Frequency Counter: HOLD never brings back a blanked AVG', () => {
  const F = read('src/screens/tools/FrequencyCounterScreen.tsx');
  const live = lift<(last: number, now: number) => boolean>(F, 'tapAvgWindowLive');
  it('the average is recomputed only while the 5 s window is live', () => {
    assert.equal(live(1000, 1000), true, 'right after a tap');
    assert.equal(live(1000, 5999), true);
    assert.equal(live(1000, 6000), false, 'AVG has blanked: HOLD must not resurrect it');
    assert.match(F, /if \(recent\.length >= 2 && tapAvgWindowLive\(last, Date\.now\(\)\)\) \{/);
  });
});

describe('Check 2 · Stage Plot: a note on an unnamed monitor symbol still says what it is about', () => {
  const NOW = 1_800_000_000_000;
  const doc = (p: SpProject) => spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'full' }, NOW));
  it('stage notes name the device; the plot label stays empty', () => {
    const p0 = spFromTemplate('four-piece', { id: 'p-four', now: NOW, band: 'The Example Four' });
    const o0 = p0.objects.find((o) => o.deviceId && o.label.trim())!;
    const devName = spDevice(p0, o0.deviceId)!.label.trim();
    const p = spUpdateObject(p0, o0.id, { label: '', note: 'tilt it up' });
    const d = doc(p);
    const t = JSON.stringify(d);
    assert.ok(t.includes(`${devName}: tilt it up`), 'the note is named by its device');
    assert.ok(!t.includes('An object with no name: tilt it up'));
    for (const s of d.sections) for (const b of s.blocks) if (b.t === 'plot') assert.equal(b.plot.items.find((i: { id: string }) => i.id === o0.id)!.label, '');
    // an object with no device and no name still reads as before
    const o1 = p0.objects.find((o) => !o.deviceId && !o.performerId && !o.boxId && o.kind !== 'choir')!;
    assert.ok(JSON.stringify(doc(spUpdateObject(p0, o1.id, { label: '', note: 'mind the cable' }))).includes('An object with no name: mind the cable'));
  });
});

describe('Check 3 · Cable Install Supports: the compressed scale is said on screen', () => {
  const SU = read('src/screens/lab/cableinstall/scenes/SupportsScene.tsx');
  it('a caption under the drawing, only while a span is past the limit', () => {
    assert.match(SU, /const SAG_SCALE_NOTE = 'Sag past the limit is drawn compressed, not to scale\.';/);
    assert.match(SU, /\{spanPastLimit\(placed\) \? <Text style=\{styles\.tintNote\}>\{SAG_SCALE_NOTE\}<\/Text> : null\}/);
    assert.match(SU, /tintNote: \{ fontFamily: fonts\.barlowItalic, fontSize: 12,/); // ≥ 9 pt, a Text outside the SVG: no MAX SAG / ruler overlap
    const fn = SU.match(/function spanPastLimit\([\s\S]*?\n\}\n/)![0];
    const anchorsFor = (placed: Set<number>) => [0, ...[...placed].sort((a, b) => a - b).map((i) => [2, 4, 6, 8, 10][i]), 12];
    const past = new Function('anchorsFor', 'SPEC_EVERY', `${ts.transpileModule(fn, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText}\nreturn spanPastLimit;`)(anchorsFor, 4) as (s: Set<number>) => boolean;
    assert.equal(past(new Set([1, 3])), false, 'supports at 4 and 8: no caption');
    assert.equal(past(new Set([0, 2, 4])), false, '2, 6, 10: no caption');
    assert.equal(past(new Set([2])), true, 'one hook at 6: caption');
    assert.equal(past(new Set()), true);
  });
  it('the guide says it too, and stays true', () => {
    const G = read('src/screens/lab/cableinstall/cableInstallScreenGuides.ts');
    assert.match(G, /double the span, four times the dip\. Past the limit the dip glows strained and is drawn compressed, not to scale\./);
  });
});
