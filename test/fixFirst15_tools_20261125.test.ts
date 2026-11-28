/**
 * Fix-first 15, TOOLS group (owner 2026-11-25, "Fix-first 15"), from the lab
 * controls audit (Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md, items 8, 10, 11, 12):
 *
 *   8  SPL Meter: RESET PEAK HOLD NOW also clears the LED meter's own held
 *      peak; the session-log Leq column says "unweighted" when C is chosen (the
 *      engine has no C-weighted Leq, the number is Leq(Z)); in dBFS mode PEAK
 *      and PEAK HOLD print the raw dBFS level like the big number.
 *  10  Cable Install: moving a bend after CHECK BEND, or adding/removing a
 *      support after CHECK SPACING, clears the old verdict.
 *  11  DJ: Screen 10 starts plain players (key lock off, no key shift, ±8 %);
 *      Screen 9's RESONANCE plots the channel whose filter is on.
 *  12  Stage Plot: renaming a monitor device renames every symbol drawn for it,
 *      so the drawing, the object list and the printed plot agree.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { plainTempoDeck } from '../src/screens/lab/dj/pages/tempoDeck.ts';
import { eqPlotChannel, filterChannel } from '../src/screens/lab/dj/pages/eqPlotChannel.ts';
import { playedSemis, speedPlan } from '../src/screens/lab/dj/model/djKey.ts';
import { PITCH_RANGE_PCT, semitonesOf } from '../src/screens/lab/dj/model/djTime.ts';
import { builtBooth } from '../src/screens/lab/dj/model/djModel.ts';
import { spDevice, spUpdateDevice, spUpdateObject } from '../src/features/stageplot/spModel.ts';
import { spFromTemplate } from '../src/features/stageplot/spTemplates.ts';
import type { SpProject } from '../src/features/stageplot/spTypes.ts';

// stageLinks / spPacket import neighbors with no extension (the app's way).
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { stageListName, stageName } = await import('../src/screens/lab/stageplot/stage/stageLinks.ts');
const { spBuildDoc, spBuildSnapshot } = await import('../src/features/stageplot/spPacket.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
/** Lift one exported top-level function out of a source file and run it. */
function lift<T>(src: string, name: string): T {
  const m = src.match(new RegExp(`export function ${name}\\([\\s\\S]*?\\n\\}\\n`));
  assert.ok(m, `${name} exists`);
  const js = ts.transpileModule(m[0].replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(`${js}\nreturn ${name};`)() as T;
}

/* ── 8 · SPL Meter ─────────────────────────────────────────────────────── */
describe('8 · SPL Meter', () => {
  const S = read('src/screens/tools/SplMeterScreen.tsx');
  const V = read('src/screens/lab/meter/vizMeters.tsx');

  it('RESET PEAK HOLD NOW clears the engine AND every LED meter’s own held peak', () => {
    const reset = S.match(/const resetAllPeakHold = useCallback\(\(\) => \{([\s\S]*?)\}, \[resetPeakHold\]\);/);
    assert.ok(reset, 'one reset for both');
    assert.match(reset[1], /resetPeakHold\(\);/);
    assert.match(reset[1], /setLedHoldReset\(\(n\) => n \+ 1\);/);
    assert.match(S, /onPress=\{\(\) => \{ resetAllPeakHold\(\); setSettingPopup\(null\); \}\}[^>]*accessibilityLabel="Reset peak hold now"/);
    // the two "tap to reset" PEAK HOLD cells use the same reset
    assert.equal((S.match(/onPress=\{resetAllPeakHold\}/g) ?? []).length, 2);
    assert.doesNotMatch(S, /onPress=\{resetPeakHold\}|\{ resetPeakHold\(\); setSettingPopup/);
    // every LED on the screen hears it
    const leds = S.match(/<SideLed\b[\s\S]*?\/>/g) ?? [];
    assert.equal(leds.length, 3);
    for (const l of leds) assert.match(l, /holdResetKey=\{ledHoldReset\}/);
    assert.match(S, /holdResetKey=\{holdResetKey\}/, 'SideLed passes it on');
    // the LED drops its hold (cap and PK readout both read lHold) to the current peak
    const eff = V.match(/const holdResetKey = p\.holdResetKey \?\? 0;\n\s*useEffect\(\(\) => \{([\s\S]*?)\}, \[holdResetKey/);
    assert.ok(eff, 'the LED meter resets on a new key');
    assert.match(eff[1], /if \(holdResetKey === 0\) return;/);
    assert.match(eff[1], /lHold\.value = lPk\.value;/);
    assert.match(eff[1], /lHoldAge\.value = 0;/);
  });

  it('the Leq column names what its number is: no "dBC" over an unweighted Leq', () => {
    const label = lift<(dbfs: boolean, w: 'A' | 'C' | 'Z') => string>(S, 'splLeqColumnLabel');
    assert.equal(label(false, 'C'), 'Leq · unweighted');
    assert.equal(label(false, 'A'), 'Leq · dBA');
    assert.equal(label(false, 'Z'), 'Leq · dB SPL');
    assert.equal(label(true, 'Z'), 'Leq · dBFS');
    assert.match(S, /const logLeqLabel = splLeqColumnLabel\(dbfs, weighting\);/);
    // the value is unchanged: C still shows the Leq(Z) estimate
    assert.match(S, /: weighting === 'A'\n\s*\? estSpl\(meter\.leqADb\)\n\s*: estSpl\(meter\.leqZDb\);/);
  });

  it('PEAK and PEAK HOLD follow the chosen unit (dBFS = raw level, like the big number)', () => {
    const txt = lift<(db: number, dbfs: boolean, off: number) => string>(S, 'splUnitText');
    assert.equal(txt(-5.8, true, 100), '-5.8');
    assert.equal(txt(1.24, true, 100), '+1.2');
    assert.equal(txt(-0.02, true, 100), '0.0');
    assert.equal(txt(-5.8, false, 100), '94.2'); // SPL units: unchanged estimate
    assert.equal(txt(-130, false, 100), '0.0'); // floored at 0, as before
    assert.equal(txt(NaN, true, 100), '—');
    assert.equal((S.match(/\{meter \? splUnitText\(meter\.peakDb, dbfs, splOffset\) : '—'\}/g) ?? []).length, 2);
    assert.equal((S.match(/\{meter \? splUnitText\(meter\.peakHoldDb, dbfs, splOffset\) : '—'\}/g) ?? []).length, 2);
    assert.doesNotMatch(S, /estSpl\(meter\.peak/);
  });
});

/* ── 10 · Cable Install ────────────────────────────────────────────────── */
describe('10 · Cable Install', () => {
  const M = read('src/screens/lab/cableinstall/scenes/MechScene.tsx');
  const SU = read('src/screens/lab/cableinstall/scenes/SupportsScene.tsx');

  it('a bend verdict speaks only for the bend it was checked at', () => {
    const cur = lift<(v: 'good' | 'bad' | null, checkedT: number | null, t: number) => boolean>(M, 'bendCheckIsCurrent');
    assert.equal(cur('good', 0.4, 0.4), true);
    assert.equal(cur('good', 0.4, 0.48), false); // TIGHTER after the check
    assert.equal(cur('bad', 0.4, 0.32), false); // GENTLER after a fail
    assert.equal(cur(null, null, 0.4), false);
    assert.match(M, /const verdictCurrent = bendCheckIsCurrent\(verdict, checkedT, t\);/);
    assert.match(M, /const locked = done && verdictCurrent;/);
    assert.match(M, /\{verdict && verdictCurrent \? \(\n\s*<Appear>\n\s*<RuleFeedback\n\s*ruleId="mech-bend-radius"/);
    assert.match(M, /setCheckedT\(t\);\n\s*onCheck\(diaRef\.current\);/);
    assert.match(M, /\{locked \? 'MEETS SPEC ✓' : 'CHECK BEND'\}/);
  });

  it('adding or removing a support clears the spacing verdict (as the Ceiling stage does)', () => {
    const tog = SU.match(/const togglePos = \(i: number\) => \{([\s\S]*?)\n {2}\};/);
    assert.ok(tog);
    assert.match(tog[1], /setSpacingVerdict\(null\);/);
    assert.match(tog[1], /setSpacingMsg\(''\);/);
    assert.match(SU, /const spacingShownGood = spacingPassed && spacingVerdict === 'good';/);
    assert.match(SU, /\{spacingShownGood \? 'MEETS SPEC ✓ — CHECK AGAIN' : 'CHECK SPACING'\}/);
    assert.match(read('src/screens/lab/cableinstall/scenes/CeilingScene.tsx'), /setSpacing\(null\);/);
  });
});

/* ── 11 · DJ ───────────────────────────────────────────────────────────── */
describe('11 · DJ Screen 10 starts plain players', () => {
  it('a key-locked, shifted, ±16 % deck B becomes the player the page describes', () => {
    const B0 = { ...builtBooth().decks.B, pitch: -3.17, keyLock: true, keyShift: 1, tempoRange: 16 };
    assert.equal(playedSemis(B0), 1, 'before: key lock holds the pitch (plus the shift)');
    const B = { ...plainTempoDeck(B0), pitch: -3.17 }; // the learner then pulls TEMPO B down
    assert.equal(B.keyLock, false);
    assert.equal(B.keyShift, 0);
    assert.equal(B.tempoRange, PITCH_RANGE_PCT); // the drawn fader's range = the dock's ±8 %
    assert.equal(PITCH_RANGE_PCT, 8);
    // speed AND pitch change together: about half a semitone low, as the Note says
    assert.ok(Math.abs(playedSemis(B) - semitonesOf(-3.17)) < 1e-12);
    assert.ok(playedSemis(B) < -0.5 && playedSemis(B) > -0.6, String(playedSemis(B)));
    const plan = speedPlan(B);
    assert.equal(plan.pitch, plan.rate);
    assert.equal(plan.stretch, 1);
    assert.equal(plainTempoDeck(B0).pitch, 0);
    assert.equal(plainTempoDeck(B0).track, B0.track, 'nothing else changes');
  });
  it('the page setup resets both decks with it', () => {
    const P = read('src/screens/lab/dj/pages/p10Tempo.tsx');
    assert.match(P, /decks: \{ A: plainTempoDeck\(x\.decks\.A\), B: plainTempoDeck\(x\.decks\.B\) \},/);
  });
});

describe('11 · DJ Screen 9 RESONANCE plots the filtered channel', () => {
  it('only CH2’s filter on: RESONANCE plots CH2', () => {
    const filtCh = filterChannel('res', false, true);
    assert.equal(filtCh, 2);
    assert.equal(eqPlotChannel('res', 1, filtCh), 2);
  });
  it('every other knob still plots its own channel; the filter rule is unchanged', () => {
    assert.equal(eqPlotChannel('lo1', 1, 2), 1);
    assert.equal(eqPlotChannel('2mid', 2, 1), 2);
    assert.equal(eqPlotChannel('f1', 1, 1), 1);
    const old = (sel: string, on1: boolean, on2: boolean) => (sel === 'f2' ? 2 : sel === 'f1' ? 1 : on2 && !on1 ? 2 : 1);
    for (const sel of ['1hi', '1mid', '2hi', '2mid', 'f1', 'f2', 'res'])
      for (const on1 of [false, true]) for (const on2 of [false, true]) assert.equal(filterChannel(sel, on1, on2), old(sel, on1, on2));
  });
  it('the page uses it', () => {
    const P = read('src/screens/lab/dj/pages/p09Eq.tsx');
    assert.match(P, /const filtCh: ChannelId = filterChannel\(sel, filterOn\(1\), filterOn\(2\)\);/);
    assert.match(P, /const plotCh = eqPlotChannel\(focus, chOf\(focus\), filtCh\);/);
  });
});

/* ── 12 · Stage Plot ───────────────────────────────────────────────────── */
describe('12 · Stage Plot: one device, one name', () => {
  const NOW = 1_800_000_000_000;
  const four = (): SpProject => spFromTemplate('four-piece', { id: 'p-four', now: NOW, band: 'The Example Four' });
  const plotLabels = (p: SpProject): string[] => {
    const d = spBuildDoc(spBuildSnapshot(p, { paper: 'letter', packet: 'full' }, NOW));
    for (const s of d.sections) for (const b of s.blocks) if (b.t === 'plot') return b.plot.items.map((i: { label: string }) => i.label);
    throw new Error('no plot');
  };

  it('a rename in the monitor plan reaches the drawing, the list and the printed plot', () => {
    const p0 = four();
    const o0 = p0.objects.find((o) => o.deviceId && o.label.trim());
    assert.ok(o0, 'the example has a monitor symbol');
    const old = spDevice(p0, o0.deviceId)!.label;
    assert.equal(o0.label, old);
    const p = spUpdateDevice(p0, o0.deviceId!, { label: 'Leo’s wedge' });
    const o = p.objects.find((x) => x.id === o0.id)!;
    assert.equal(spDevice(p, o0.deviceId)!.label, 'Leo’s wedge');
    assert.equal(o.label, 'Leo’s wedge');
    assert.equal(stageName(p, o), 'Leo’s wedge');
    assert.equal(stageListName(p, o), 'Leo’s wedge');
    assert.ok(plotLabels(p).includes('Leo’s wedge'));
    assert.ok(plotLabels(p0).includes(old));
  });

  it('a symbol left with no name keeps none; an empty name renames no symbol', () => {
    const p0 = four();
    const o0 = p0.objects.find((o) => o.deviceId && o.label.trim())!;
    const blank = spUpdateObject(p0, o0.id, { label: '' });
    assert.equal(spUpdateDevice(blank, o0.deviceId!, { label: 'Leo’s wedge' }).objects.find((x) => x.id === o0.id)!.label, '');
    assert.equal(spUpdateDevice(p0, o0.deviceId!, { label: '  ' }).objects.find((x) => x.id === o0.id)!.label, o0.label);
  });

  it('a change that is not a name leaves every symbol as it was', () => {
    const p0 = four();
    const o0 = p0.objects.find((o) => o.deviceId)!;
    const p = spUpdateDevice(p0, o0.deviceId!, { supplier: 'band', note: 'x' });
    assert.deepEqual(p.objects, p0.objects);
  });

  it('every rename path goes through spUpdateDevice (Monitors sheet, Setup performer rename, Stage)', () => {
    assert.match(read('src/screens/lab/stageplot/monitors/DeviceSheets.tsx'), /onCommit=\{\(label\) => set\(\{ label \}\)\}/);
    assert.match(read('src/screens/lab/stageplot/monitors/DeviceSheets.tsx'), /const set = \(patch: Partial<Omit<SpDevice, 'id'>>\) => ed\.apply\(\(cur\) => spUpdateDevice\(cur, id, patch\)\);/);
    assert.match(read('src/screens/lab/stageplot/SetupArea.tsx'), /if \(label !== d\.label\) next = spUpdateDevice\(next, d\.id, \{ label \}\);/);
  });
});
