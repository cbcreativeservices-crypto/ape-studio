/**
 * Emulator pass 2026-10-14 (411×731 Android, three-button bar):
 *   1. Ear Training gets the house "what's left" end screen (hub + drill),
 *      on the lab's EXISTING credit rule (mastered ≥ REQUIRED_EAR_LEVEL).
 *   2. M13 Comb: SEE IT adds a measured combed ÷ dry plot — the notches show.
 *   3. Speech "Check Yourself" can no longer be marked done by FINISH.
 *   4. Speech "Popping breath" caption says what is drawn.
 *   5. Chooser tray: a swipe from a chip scrolls; the card holds its height.
 *   6. Lab lists clear the three-button bar.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { earCreditedIds, earEndUnits, earModuleCredited } from '../src/screens/lab/eartraining/earLabEnd.ts';
import { powerRatioDb, welchPower } from '../src/screens/lab/eartraining/seeItMath.ts';
import { fadeEdges, makeRng, mixDelayed, normalizeRms, SR } from '../src/features/ear/earDsp.ts';
import { REQUIRED_EAR_LEVEL } from '../src/features/lab/trainingLabKeys.ts';
import { TRAY_TAP_SLOP, trayReleaseIsTap } from '../src/screens/lab/rack/trayTap.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const prog = (o: Partial<{ level: number; mastered: number; total: number }>) => ({
  level: 1, trials: [], bestStreak: 0, streak: 0, total: 0, totalScore: 0, mastered: 0, ...o,
});
const MODS = [
  { id: 'frequency', title: 'Frequency', levels: 5 },
  { id: 'eq', title: 'EQ', levels: 4 },
  { id: 'comb', title: 'Comb Filtering', levels: 4 },
];

describe('1 · Ear Training what’s-left', () => {
  it('credits exactly the existing rule — mastered, never the current level', () => {
    assert.equal(earModuleCredited(prog({ mastered: REQUIRED_EAR_LEVEL })), true);
    assert.equal(earModuleCredited(prog({ mastered: REQUIRED_EAR_LEVEL - 1, level: 4 })), false);
    // A step down after crediting never takes the row back.
    assert.equal(earModuleCredited(prog({ mastered: REQUIRED_EAR_LEVEL, level: 1 })), true);
    assert.equal(earModuleCredited(undefined), false);
  });

  it('rows say credited / tried / not tried, in lab order', () => {
    const p = { frequency: prog({ mastered: 2, level: 3, total: 60 }), eq: prog({ level: 1, total: 7 }) };
    const units = earEndUnits(MODS, p);
    assert.deepEqual(units.map((u) => u.id), ['frequency', 'eq', 'comb']);
    assert.match(units[0].detail!, /^Level 2 of 5 cleared/);
    assert.match(units[1].detail!, /^Tried · level 1 of 4 · 7 answers · clear level 2 at 80 % over 20 answers to count$/);
    assert.match(units[2].detail!, /^Not tried yet/);
    assert.deepEqual([...earCreditedIds(MODS, p)], ['frequency']);
  });

  it('the hub and the drill both open the shared end screen, nothing auto-opens', () => {
    const hub = read('src/screens/lab/eartraining/EarTrainingLabScreen.tsx');
    assert.match(hub, /<LabEndLink onPress=\{\(\) => setEnding\(true\)\} \/>/);
    assert.match(hub, /<LabEndScreen[\s\S]*mode="credit"[\s\S]*onDone=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.match(hub, /done=\{earModuleCredited\(p\)\}/);
    assert.match(hub, /useBackWhileFocused\(ending, closeEnd\)/);
    const drill = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
    assert.match(drill, /<LabEndLink onPress=\{openEnd\} \/>/);
    assert.match(drill, /<LabEndScreen[\s\S]*cleared=\{unread \? new Set<string>\(\) : earCreditedIds\(EAR_MODULES, s\.modules\)\}/);
    assert.match(drill, /useBackWhileFocused\(ending, closeEnd\)/);
    // The credit report is untouched.
    assert.match(drill, /if \(next\.mastered >= REQUIRED_EAR_LEVEL\) reportTrainingComplete\(earModuleKey\(mod\.id\)\);/);
  });
});

describe('2 · M13 comb: the measured difference shows the notches', () => {
  // A drum-like source: decaying noise bursts and a low thump — sparse, like
  // the module's drum surrogate, which is where the overlay alone failed.
  function drumish(): Float32Array {
    const rng = makeRng(7);
    const out = new Float32Array(Math.round(2.4 * SR));
    for (const at of [0, 0.6, 1.2, 1.5, 1.8]) {
      const n0 = Math.round(at * SR);
      for (let i = 0; i < 0.25 * SR && n0 + i < out.length; i++) {
        const t = i / SR;
        out[n0 + i] += (rng() * 2 - 1) * 0.6 * Math.exp(-t * 30) + Math.sin(2 * Math.PI * 60 * t) * 0.8 * Math.exp(-t * 14);
      }
    }
    return out;
  }
  const src = drumish();
  const dry = fadeEdges(normalizeRms(src, -20), 8);
  const delayMs = 4.6; // ≈ 218 Hz spacing — the emulator report
  const combed = fadeEdges(normalizeRms(mixDelayed(src, delayMs, 1), -20), 8);
  const a = welchPower(combed, 48);
  const b = welchPower(dry, 48);
  const r = powerRatioDb(a.acc, b.acc, 5000);
  const at = (hz: number) => {
    let best = 0;
    for (let k = 1; k < r.hz.length; k++) if (Math.abs(r.hz[k] - hz) < Math.abs(r.hz[best] - hz)) best = k;
    return r.db[best];
  };
  const median = (xs: number[]) => xs.sort((p, q) => p - q)[Math.floor(xs.length / 2)];

  it('uses many frames on a 2.4 s clip (8 left it grassy)', () => {
    assert.ok(a.nFrames >= 40, `frames ${a.nFrames}`);
  });

  it('notches sit well below the peaks, every 1/delay', () => {
    const d = Math.round((delayMs / 1000) * SR) / SR; // mixDelayed rounds to a sample
    const notches: number[] = [];
    const peaks: number[] = [];
    for (let k = 0; (k + 1) / d < 4800; k++) {
      const n = at((k + 0.5) / d);
      const p = at((k + 1) / d);
      if (n != null) notches.push(n);
      if (p != null) peaks.push(p);
    }
    assert.ok(notches.length >= 15);
    assert.ok(median(notches) < -8, `median notch ${median(notches)}`);
    assert.ok(median(peaks) > 2, `median peak ${median(peaks)}`);
  });

  it('a bin with no energy in the reference is a gap, never a number', () => {
    const ref = new Float64Array(2048);
    const of = new Float64Array(2048);
    ref[10] = 1;
    of[10] = 0.5;
    const g = powerRatioDb(of, ref, 5000);
    assert.equal(g.db[20], null);
    assert.ok(Math.abs((g.db[9] as number) + 3.01) < 0.01);
  });

  it('the comb trials ask for the difference plot, combed over dry', () => {
    const t = read('src/features/ear/modules/time.ts');
    assert.match(t, /difference: \{ of: aIsDry \? 1 : 0, ref: aIsDry \? 0 : 1, maxHz: 5000 \}/);
    assert.match(t, /difference: \{ of: combFirst \? 0 : 1, ref: combFirst \? 1 : 0, maxHz: 5000 \}/);
  });
});

describe('3/4 · Speech', () => {
  it('Check Yourself marks itself — FINISH no longer marks it with 0 answered', () => {
    const s = read('src/screens/lab/speech/SpeechLabScreen.tsx');
    assert.match(s, /\{ title: 'Check Yourself', short: 'Check', Component: PageSpeechChecks, manualDone: true \}/);
    const p = read('src/screens/lab/speech/speechPagesB.tsx');
    assert.match(p, /if \(n >= PASS_MARK && !isDone\) markDone\(\);/);
    assert.match(p, /correct this visit\{ctx\.isDone \? ' · page complete'/);
  });

  it('Popping breath caption describes the drawn trace (noise past the middle, voice returns)', () => {
    const m = read('src/features/speech/speechModel.ts');
    assert.doesNotMatch(m, /The tail of the trace fills/);
    assert.match(m, /Past the middle the voice stops and a shapeless rush swells and fades/);
    // The drawing is unchanged: the rush spans 55–90 % of the trace.
    assert.match(m, /if \(id === 'breath'\) \{ if \(t > 0\.55 && t < 0\.9\)/);
  });
});

describe('5 · Chooser tray', () => {
  const down = { x: 100, y: 200, at: 1000 };
  it('a still release is a tap; a moved one or one after a scroll is not', () => {
    assert.equal(trayReleaseIsTap(down, { x: 104, y: 205 }, 0), true);
    assert.equal(trayReleaseIsTap(down, { x: 100, y: 200 + TRAY_TAP_SLOP + 1 }, 0), false);
    assert.equal(trayReleaseIsTap(down, { x: 100, y: 200 }, 1001), false);
    assert.equal(trayReleaseIsTap(null, { x: 0, y: 0 }, 5000), true);
    assert.equal(trayReleaseIsTap(down, { x: Number.NaN, y: Number.NaN }, 0), true);
  });

  it('the card never shrinks while open and keeps its overflow order', () => {
    const t = read('src/screens/lab/rack/DockTray.tsx');
    assert.match(t, /if \(h > tallestH\) setTallestH\(h\);/);
    assert.match(t, /const overflows = overflowsNow \|\| overflowLatched;/);
    assert.match(t, /setTallestH\(0\);\s*setOverflowLatched\(false\);\s*\}, \[trayId\]\);/);
    assert.match(t, /lastScrollAt=\{lastScrollAt\}/);
    // The 10-14 rise rule is untouched.
    const r = read('src/screens/lab/rack/RackUnit.tsx');
    assert.match(r, /const TRAY_MIN = 168;/);
  });
});

describe('6 · Lab lists clear the three-button bar', () => {
  for (const f of ['src/screens/lab/EarLabScreen.tsx', 'src/screens/lab/LabCategoryScreen.tsx']) {
    it(f, () => {
      // A spacer at the end of the list (the scroll style stays
      // `[styles.scroll, cardColumn, wide]` — the tablet ratchets read it).
      assert.match(read(f), /<View style=\{\{ height: insets\.bottom \}\} \/>\s*<\/ScrollView>/);
    });
  }
});
