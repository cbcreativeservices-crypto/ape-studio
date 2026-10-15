/**
 * Slider audit HOLDs approved by the owner 2026-10-14 (defaults in brackets):
 *  #2  Harmonograph — a fader move wiped the figure and the redraw takes up
 *      to a minute [faint GHOST of the old figure until the new one completes].
 *  #17 Foundations Playground — STEREO BALANCE changed the sound only
 *      [an L–R indicator on the display that follows the fader].
 *  #18 Cable lab — STORED SLACK still moved after CONFIRM [lock it, with a reason].
 *  #19 Cymatics plate + membrane — still unless driven ["press play to drive the plate"].
 *  #20 Mastering DRIVE + Mixing gear fader — no picture while dragging [a live preview].
 *
 * Pure pieces are imported and exercised; screen wiring is pinned to source.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { drivePreview, overview, peakLimiter, linToDb } from '../src/screens/lab/mastering/masteringEngine.ts';
import { createLaneFeed } from '../src/screens/lab/rack/laneFeed.ts';
import { SR, makeRng, pinkNoise, sine, type Stereo } from '../src/features/ear/earDsp.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
/** Code only: block, JSX and whole-line comments out. */
const code = (s: string) =>
  s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

const HARMO = read('src/screens/lab/HarmonographMachine.tsx');
const PLAY = read('src/screens/lab/foundations/FoundationsPlaygroundScreen.tsx');
const LABEL = read('src/screens/lab/cableinstall/scenes/LabelScene.tsx');
const HINT = read('src/screens/lab/cymatics/DriveHint.tsx');
const PLATE = read('src/screens/lab/cymatics/PlateStudioScreen.tsx');
const MEMB = read('src/screens/lab/cymatics/MembraneStudioScreen.tsx');
const MOD6 = read('src/screens/lab/mastering/modules/mod6Loudness.tsx');
const STAGES = read('src/screens/lab/mastering/stages.tsx');
const MIXKIT = read('src/screens/lab/mixing/kit.tsx');

// ── #2 Harmonograph ghost ───────────────────────────────────────────────────
describe('#2 Harmonograph: the old figure stays faintly under the new pen', () => {
  const c = code(HARMO);
  it('a fresh sheet from a SETTINGS change keeps a ghost of the outgoing figure, read before the reset write', () => {
    // the outgoing fraction is read BEFORE progress is written (a JS write
    // lands on the UI runtime later; reading it back would return the old one)
    const read = c.indexOf('const outFrac = Math.min(1, Math.max(0, progress.value));');
    const write = c.indexOf('progress.value = 0;', read);
    assert.ok(read > 0 && write > read, 'outFrac read precedes the progress reset');
    assert.match(c, /setGhostBoth\(ghostOf\(prevKey\[0\] as InkRun, outFrac\)\)/);
    // a NEW DRAWING (epoch bump) is a deliberate clean sheet — no ghost
    assert.match(c, /prevKey\[2\] !== epoch\) setGhostBoth\(null\)/);
  });
  it('the ghost is dropped when the NEW figure completes (first timing finished), per run token', () => {
    assert.match(c, /withTiming\(1, \{ duration: \(1 - cur\) \* dDrawMs, easing: Easing\.linear \}, \(finished\) => \{\s*'worklet';\s*if \(finished\) scheduleOnRN\(dropGhost, token\);/);
    assert.match(c, /if \(token === runTokenRef\.current && ghostRef\.current\) setGhostBoth\(null\)/);
    assert.match(c, /import \{ scheduleOnRN \} from 'react-native-worklets';/);
  });
  it('drawn on the paper AND the DRAWING inset, faint, only the part that had been drawn', () => {
    assert.equal((c.match(/strokeOpacity=\{GHOST_ALPHA\}/g) ?? []).length, 2);
    assert.match(c, /strokeDasharray=\{`\$\{ghost\.lenP\.toFixed\(1\)\} \$\{ghost\.totP\.toFixed\(1\)\}`\}/);
    assert.match(c, /strokeDasharray=\{`\$\{ghost\.lenI\.toFixed\(1\)\} \$\{ghost\.totI\.toFixed\(1\)\}`\}/);
    const alpha = Number(/export const GHOST_ALPHA = ([\d.]+);/.exec(c)?.[1]);
    assert.ok(alpha > 0.05 && alpha <= 0.25, `ghost alpha ${alpha} must be faint but visible`);
  });
  it('the drawn length at a fraction interpolates the cumulative table (restated + pinned)', () => {
    const lenAt = (s: number[], N: number, frac: number) => {
      const f = Math.min(N - 0.001, Math.max(0, frac * N));
      const i = Math.floor(f);
      return s[i] + (s[i + 1] - s[i]) * (f - i);
    };
    assert.match(c, /const f = Math\.min\(N - 0\.001, Math\.max\(0, frac \* N\)\);/);
    const s = [0, 1, 3, 6, 10];
    assert.equal(lenAt(s, 4, 0), 0);
    assert.equal(lenAt(s, 4, 0.5), 3);
    assert.ok(Math.abs(lenAt(s, 4, 1) - 10) < 0.01);
    assert.ok(lenAt(s, 4, 0.6) > lenAt(s, 4, 0.5));
  });
});

// ── #17 Foundations Playground balance strip ────────────────────────────────
describe('#17 Foundations Playground: STEREO BALANCE has a drawn twin', () => {
  const c = code(PLAY);
  it('the stage draws a BalanceStrip from the same `balance` the fader sets', () => {
    assert.match(c, /balance=\{balance\}/);
    assert.match(c, /<BalanceStrip balance=\{balance\} ts=\{ts\} height=\{BAL_H\} gap=\{GAP\} \/>/);
    // the strip's height comes out of the panes — nothing overflows the glass
    assert.match(c, /- \(BAL_H \+ GAP\)\) \/ 2\)\)/);
    assert.match(c, /height: h - rowH - \(BAL_H \+ GAP\)/);
  });
  it('the marker sits at the balance fraction; the lean fills toward the louder side', () => {
    assert.match(c, /left: `\$\{b \* 100\}%`/);
    assert.match(c, /b < 0\.5 \? \{ right: '50%', width: `\$\{\(0\.5 - b\) \* 100\}%` \} : \{ left: '50%', width: `\$\{\(b - 0\.5\) \* 100\}%` \}/);
  });
  it('the readout uses the fader’s own words and the 9 pt floor (fitValue)', () => {
    assert.match(c, /readout=\{balanceWords\(balance\)\}/);
    assert.match(c, /\{\.\.\.fitValue\(fs\)\}/);
    assert.match(c, /const fs = 9 \* ts;/);
    const words = (b: number) => (b < 0.48 ? `L ${Math.round((0.5 - b) * 200)}%` : b > 0.52 ? `R ${Math.round((b - 0.5) * 200)}%` : 'CENTER');
    assert.equal(words(0), 'L 100%');
    assert.equal(words(0.5), 'CENTER');
    assert.equal(words(0.75), 'R 50%');
  });
  it('the caption no longer says BALANCE has no drawn twin', () => {
    assert.doesNotMatch(PLAY, /BALANCE and DELAY change what you HEAR only/);
    assert.match(PLAY, /BALANCE moves the L–R strip/);
  });
});

// ── #18 Cable lab STORED SLACK lock ─────────────────────────────────────────
describe('#18 Cable lab: STORED SLACK is locked after CONFIRM, with a reason', () => {
  const c = code(LABEL);
  it('the slider takes no touch once confirmed, is dimmed and marked disabled', () => {
    assert.match(c, /pointerEvents=\{dDone \? 'none' : 'auto'\}/);
    assert.match(c, /style=\{dDone \? styles\.slackLocked : null\}/);
    assert.match(c, /accessibilityState=\{\{ disabled: dDone \}\}/);
    // and the page still refuses a late value
    assert.match(c, /if \(!dDone\) setSlack\(v\);/);
  });
  it('the reason prints in the rack idiom "LABEL — locked: reason"', () => {
    assert.match(c, /STORED SLACK — locked: \{SLACK_LOCK_REASON\}/);
    assert.match(c, /const SLACK_LOCK_REASON = 'confirmed — [^']+';/);
  });
});

// ── #19 Cymatics drive hint ─────────────────────────────────────────────────
describe('#19 Cymatics: "press play to drive the plate" while nothing drives it', () => {
  const h = code(HINT);
  it('shows only while not driving, and never in Low-Light / suppressed overlays', () => {
    assert.match(h, /if \(driving \|\| suppressed\) return null;/);
    assert.match(h, /const suppressed = useOverlaysSuppressed\(\);/);
  });
  it('never takes a touch; text ≥ 9 pt at any stage text scale', () => {
    assert.match(h, /pointerEvents="none"/);
    for (const m of h.matchAll(/fontSize: ([\d.]+) \* ts/g)) assert.ok(Number(m[1]) >= 9, `fontSize ${m[1]}`);
    assert.doesNotMatch(h, /fontSize: [0-8](\.\d+)?[,\s}]/);
  });
  it('the owner wording', () => {
    assert.match(h, /return `PRESS ▶ PLAY TO DRIVE THE \$\{what\.toUpperCase\(\)\}`;/);
  });
  it('plate and membrane read the SAME `driving` the physics is gated on (physics untouched)', () => {
    const p = code(PLATE);
    const m = code(MEMB);
    assert.match(p, /<DriveHint driving=\{driving\} canPlay=\{tone\.engineReady\} what="plate" silentKey="DRIVE › SILENT DRIVE" \/>/);
    assert.match(p, /running=\{driving\}/);
    assert.match(m, /<DriveHint driving=\{driving\} canPlay=\{tone\.engineReady\} what=\{isSpeaker \? 'cone' : 'drum head'\} silentKey="STRIKE › SILENT DRIVE" top=\{isSpeaker \? 28 : 6\} \/>/);
    assert.match(m, /running=\{driving\}/);
    for (const s of [p, m]) assert.match(s, /const driving = focused && \(tone\.running \|\| silentDrive\);/);
  });
});

// ── #20 Mastering DRIVE preview ─────────────────────────────────────────────
function mono(seconds: number, gainLin: number): Stereo {
  const rng = makeRng(11);
  const n = pinkNoise(seconds, rng);
  const s = sine(110, seconds);
  const l = new Float32Array(n.length);
  for (let i = 0; i < n.length; i++) l[i] = (n[i] * 0.8 + s[i] * 0.3) * gainLin;
  return { l, r: l.slice() };
}

describe('#20 Mastering: the DRIVE preview estimates the limited render', () => {
  const CEIL = -1;
  const prog = mono(2, 0.35);
  const quiet = peakLimiter(prog, 0, CEIL);
  const qOv = overview(quiet.out);

  it('0 dB drive reproduces the undriven render (mono, and a stereo mix whose fold sits under the detector)', () => {
    const p = drivePreview(qOv, quiet.grDb, 0, CEIL);
    for (let c = 0; c < qOv.hi.length; c++) {
      assert.ok(Math.abs(p.ov.hi[c] - qOv.hi[c]) < 1e-6 && Math.abs(p.ov.lo[c] - qOv.lo[c]) < 1e-6, `col ${c}`);
    }
    const st = mono(2, 1.4);
    const r = new Float32Array(st.l.length);
    for (let i = 0; i < r.length; i++) r[i] = -0.6 * st.l[i] + 0.2 * Math.sin(i / 40);
    const sq = peakLimiter({ l: st.l, r }, 0, CEIL);
    const sOv = overview(sq.out);
    assert.ok(sq.maxGrDb > 0, 'the stereo fixture must make the limiter work');
    const sp = drivePreview(sOv, sq.grDb, 0, CEIL);
    for (let c = 0; c < sOv.hi.length; c++) assert.ok(Math.abs(sp.ov.hi[c] - sOv.hi[c]) < 1e-6, `stereo col ${c}`);
  });

  it('never draws past the ceiling, grows with drive, and its gain reduction is monotonic', () => {
    const ceil = Math.pow(10, CEIL / 20);
    let lastMax = -1;
    let lastArea = -1;
    for (const d of [0, 3, 6, 9, 14]) {
      const p = drivePreview(qOv, quiet.grDb, d, CEIL);
      const area = p.ov.level.reduce((a, b) => a + b, 0);
      for (const v of p.ov.level) assert.ok(v <= ceil + 1e-9, `drive ${d}: ${v} over the ceiling`);
      assert.ok(p.maxGrDb >= lastMax - 1e-9, `GR not monotonic at ${d}`);
      assert.ok(area >= lastArea - 1e-9, `picture shrank at ${d}`);
      lastMax = p.maxGrDb;
      lastArea = area;
    }
  });

  it('tracks the REAL render: per-column peaks and max GR within a static-limiter tolerance', () => {
    for (const d of [4, 8, 12]) {
      const loud = peakLimiter(prog, d, CEIL);
      const lOv = overview(loud.out);
      const p = drivePreview(qOv, quiet.grDb, d, CEIL);
      let close = 0;
      for (let c = 0; c < lOv.level.length; c++) {
        const err = Math.abs(linToDb(p.ov.level[c]) - linToDb(lOv.level[c]));
        if (err < 1.5) close++;
      }
      assert.ok(close / lOv.level.length > 0.9, `drive ${d}: only ${close}/${lOv.level.length} columns within 1.5 dB`);
      assert.ok(Math.abs(p.maxGrDb - loud.maxGrDb) < 1.5, `drive ${d}: max GR ${p.maxGrDb.toFixed(2)} vs ${loud.maxGrDb.toFixed(2)}`);
      assert.equal(p.ov.seconds, lOv.seconds);
    }
    assert.ok(prog.l.length / SR === 2);
  });

  it('the LISTEN glass shows the estimate only while LOUDER is stale, and says so', () => {
    const c = code(MOD6);
    assert.match(c, /!current && shown === 'loud' && q\?\.overview \? drivePreview\(q\.overview, q\.grDb, drive, CEILING\) : null/);
    assert.match(c, /ov=\{preview \? preview\.ov : \(m\?\.overview \?\? null\)\}/);
    assert.match(c, /previewNote=\{preview \? DRIVE_PREVIEW_NOTE : undefined\}/);
    // the note takes the match line's place while the picture is an estimate
    const s = code(STAGES);
    assert.match(s, /\{previewNote \? \(\s*<SvgText x=\{x1\} y=\{H - 4\} fontSize=\{FONT_S\}[^\n]*\n\s*\) : matchDb != null/);
  });
});

// ── #20 Mixing gear fader preview ───────────────────────────────────────────
describe('#20 Mixing: the channel fader draws the finger at once, the page gets ≤ 1 value per tick', () => {
  const c = code(MIXKIT);
  it('the strip draws its preview and feeds the page through the rack laneFeed', () => {
    assert.match(c, /import \{ createLaneFeed, type LaneFeed \} from '\.\.\/rack\/laneFeed';/);
    assert.match(c, /valueDb=\{fader\.shownDb\}/);
    assert.match(c, /onChangeDb=\{\(db\) => fader\.onDrag\(stepValue\(db, 0, -60, 12\)\)\}/);
    assert.match(c, /schedule: \(cb\) => setTimeout\(cb, STRIP_FADER_TICK_MS\)/);
    assert.match(c, /export const STRIP_FADER_TICK_MS = 16;/);
    assert.match(c, /useEffect\(\(\) => \(\) => feedRef\.current\?\.end\(\), \[\]\);/);
    // hands back on catch-up, or when the PAGE changes the value itself
    assert.match(c, /if \(pageDb === previewDb \|\| pageDb !== sentRef\.current\) setPreviewDb\(null\);/);
  });
  it('a fast drag reaches the page once per tick, newest value, last one never lost', () => {
    const got: number[] = [];
    const timers: (() => void)[] = [];
    const feed = createLaneFeed({
      deliver: (v) => got.push(v),
      schedule: (cb) => (timers.push(cb), timers.length),
      cancel: () => {},
    });
    for (const db of [-1, -2, -3, -4]) feed.move(db); // one frame of moves
    assert.deepEqual(got, []);
    timers.shift()!();
    assert.deepEqual(got, [-4]);
    feed.move(-6);
    feed.end(); // unmount mid-drag
    assert.deepEqual(got, [-4, -6]);
  });
});
