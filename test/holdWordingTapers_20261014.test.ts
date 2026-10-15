/**
 * Slider audit HOLD items the owner approved on 2026-10-14 (defaults taken):
 *
 *   #6  Bass Guitar Physics NODE fader → tap buttons (an options tray with the
 *       same four touch points and the same effect).
 *   #8  Drum Tuning pitch faders move in MUSICAL steps: the lane rides
 *       log(Hz), so equal travel = an equal pitch interval; endpoints and
 *       home values unchanged; the TENSION fader rides the pitch its N/m
 *       makes, and its words / N/m readouts still come from the page's value.
 *   #21 Lanes that showed words only now show the number beside the word:
 *       Foundations M3 STRENGTH + M4 AMPLITUDE, Start Here AMPLITUDE, and the
 *       Speaker Coverage lanes (POSITION, HEIGHT, the ROOM tray sliders).
 *   #22 Speaker Coverage POSITION / AIM dock keys carry their value again.
 *   #28 Tuning chapter 7: the NOTES key keeps one fixed slot — every key is in
 *       the dock from the first note, the not-yet-usable ones LOCKED with a
 *       reason, so nothing reflows as the mapping is revealed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// drumEngine's import chain is extensionless — resolve `.ts` the way
// test/drumTuningEngine.test.ts does.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { hzToLane, laneToHz, laneSemitones, pitchFaderParam } = await import('../src/screens/lab/drumtuning/pitchTaper.ts');
const { DRUMS, fundamentalHz, tensionForHz } = await import('../src/screens/lab/drumtuning/drumEngine.ts');

const read = (p: string) => readFileSync(p, 'utf8');
const semis = (a: number, b: number) => 12 * Math.log2(b / a);

/* ── #8 the musical taper (pure) ─────────────────────────────────────────── */

describe('#8 drum pitch lanes ride a semitone (log-Hz) taper', () => {
  const RANGES: [string, number, number][] = [
    ['kick batter', DRUMS.kick.usefulHz[0], DRUMS.kick.usefulHz[1]],
    ['snare batter', DRUMS.snare.usefulHz[0], DRUMS.snare.usefulHz[1]],
    ['rack tom', 100, 300],
    ['floor tom', 70, 220],
  ];

  it('endpoints are unchanged: lane 0 = min Hz, lane 1 = max Hz', () => {
    for (const [name, lo, hi] of RANGES) {
      assert.ok(Math.abs(laneToHz(0, lo, hi) - lo) < 1e-9, name);
      assert.ok(Math.abs(laneToHz(1, lo, hi) - hi) < 1e-9, name);
      assert.equal(hzToLane(lo, lo, hi), 0, name);
      assert.ok(Math.abs(hzToLane(hi, lo, hi) - 1) < 1e-12, name);
    }
  });

  it('is strictly monotonic and clamps outside the lane', () => {
    for (const [name, lo, hi] of RANGES) {
      let prev = -Infinity;
      for (let i = 0; i <= 200; i++) {
        const hz = laneToHz(i / 200, lo, hi);
        assert.ok(hz > prev, `${name}: not rising at ${i}`);
        prev = hz;
      }
      assert.equal(laneToHz(-0.5, lo, hi), lo);
      assert.equal(laneToHz(1.5, lo, hi), hi);
      assert.equal(hzToLane(lo / 2, lo, hi), 0);
      assert.equal(hzToLane(hi * 2, lo, hi), 1);
    }
  });

  it('round-trips lane → Hz → lane and Hz → lane → Hz', () => {
    for (const [name, lo, hi] of RANGES) {
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        assert.ok(Math.abs(hzToLane(laneToHz(t, lo, hi), lo, hi) - t) < 1e-9, `${name} lane ${t}`);
        const hz = lo + ((hi - lo) * i) / 50;
        assert.ok(Math.abs(laneToHz(hzToLane(hz, lo, hi), lo, hi) - hz) < 1e-9, `${name} ${hz} Hz`);
      }
    }
  });

  it('equal travel = an equal number of semitones, anywhere on the lane', () => {
    for (const [name, lo, hi] of RANGES) {
      const span = laneSemitones(lo, hi);
      const tenth = span / 10;
      for (let i = 0; i < 10; i++) {
        const st = semis(laneToHz(i / 10, lo, hi), laneToHz((i + 1) / 10, lo, hi));
        assert.ok(Math.abs(st - tenth) < 1e-9, `${name}: tenth ${i} spans ${st} st, want ${tenth}`);
      }
    }
    // The old straight-Hz lane did not: on the 45–90 Hz kick the first tenth
    // was ~1.6 st and the last ~0.9 st.
    const lo = DRUMS.kick.usefulHz[0], hi = DRUMS.kick.usefulHz[1];
    const linFirst = semis(lo, lo + (hi - lo) / 10);
    const linLast = semis(hi - (hi - lo) / 10, hi);
    assert.ok(linFirst / linLast > 1.6, 'the straight-Hz lane was uneven (the bug)');
  });

  it('pitchFaderParam: lane value, home and endpoints on the taper; snaps to whole Hz; no call for no change', () => {
    const calls: number[] = [];
    const p = pitchFaderParam({ id: 'kb', label: 'BATTER', value: 60, min: 45, max: 90, step: 1, format: (v: number) => `${v} Hz`, onChange: (v: number) => calls.push(v), home: 60 });
    assert.equal(p.kind, 'fader');
    if (p.kind !== 'fader') return;
    assert.ok(Math.abs(p.value - hzToLane(60, 45, 90)) < 1e-12);
    assert.ok(Math.abs((p.home ?? -1) - hzToLane(60, 45, 90)) < 1e-12, 'home value kept, placed on the taper');
    p.onChange(0);
    p.onChange(1);
    p.onChange(0.5);
    p.onChange(p.value); // the current position → no call
    assert.deepEqual(calls, [45, 90, 64]); // 45·√2 = 63.6 → 64 Hz: the musical middle, not 67.5
  });

  it('TENSION rides the pitch its N/m makes; tension stays the page value (words / N/m still derive from it)', () => {
    const S = DRUMS.rack;
    const toHz = (v: number) => fundamentalHz(S.diameterIn, v, S.sigmaBatter);
    const fromHz = (hz: number) => tensionForHz(S.diameterIn, hz, S.sigmaBatter);
    const [tLo, tHi] = S.tensionRange;
    const calls: number[] = [];
    const p = pitchFaderParam({ id: 'tension', label: 'TENSION', value: 3000, min: tLo, max: tHi, step: 50, toHz, fromHz, format: (v: number) => `${v} N/m`, onChange: (v: number) => calls.push(v), home: 3000 });
    if (p.kind !== 'fader') throw new Error('fader expected');
    assert.ok(Math.abs(p.value - hzToLane(toHz(3000), toHz(tLo), toHz(tHi))) < 1e-12);
    p.onChange(0);
    p.onChange(1);
    assert.deepEqual(calls.slice(0, 2), [tLo, tHi], 'endpoints are the same N/m as before');
    for (const c of calls) assert.equal(c % 50, 0, 'N/m still snaps to the 50 N/m step');
    // fromHz is the exact inverse of toHz.
    for (const t of [tLo, 2500, 4000, tHi]) assert.ok(Math.abs(fromHz(toHz(t)) - t) < 1e-6);
  });

  it('every Drum Tuning Hz pitch fader (and TENSION) uses the musical taper', () => {
    const D = 'src/screens/lab/drumtuning/modules/';
    const want: [string, string[]][] = [
      ['ch1Sound.tsx', ['tension']],
      ['ch4Whole.tsx', ['batter', 'reso']],
      ['ch5Types.tsx', ['snb', 'kb', 'gb', 'gr']],
      ['ch6Kit.tsx', ['rack', 'floor']],
    ];
    for (const [f, ids] of want) {
      const s = read(D + f);
      for (const id of ids) assert.match(s, new RegExp(`pitchFaderParam\\(\\{ id: '${id}'`), `${f} ${id}`);
      // No Hz fader left on the straight scale.
      for (const m of s.matchAll(/(?<![A-Za-z])faderParam\(\{[^\n]*/g)) assert.doesNotMatch(m[0], /formatShort: \(v\) => `\$\{v\.toFixed\(0\)\} Hz`/, `${f}: a straight-Hz fader remains`);
    }
    assert.match(read(D + 'ch1Sound.tsx'), /toHz: \(v\) => fundamentalHz\(SPEC\.diameterIn, v, SPEC\.sigmaBatter\), fromHz: \(hz\) => tensionForHz\(SPEC\.diameterIn, hz, SPEC\.sigmaBatter\)/);
    assert.match(read('src/screens/lab/drumtuning/DrumRack.tsx'), /export \{ pitchFaderParam \} from '\.\/pitchTaper';/);
  });
});

/* ── #6 Bass NODE → tap buttons ──────────────────────────────────────────── */

describe('#6 Bass NODE is tap buttons, not a fader', () => {
  const s = read('src/screens/lab/BassLabScreen.tsx');
  const node = s.slice(s.indexOf("id: 'node'") - 400, s.indexOf("id: 'node'") + 900);
  it('the NODE key is an options tray over the same four nodes, selecting the same state', () => {
    assert.match(node, /kind: 'options',\s*id: 'node',\s*label: 'NODE'/);
    assert.match(node, /options: NODES\.map\(\(nd\) => \(\{\s*id: String\(nd\.n\)/);
    assert.match(node, /selectedId: String\(node\.n\)/);
    assert.match(node, /const i = NODES\.findIndex\(\(nd\) => String\(nd\.n\) === id\);\s*if \(i >= 0\) setNodeIdx\(i\);/);
    assert.match(node, /sticky: true/);
    assert.doesNotMatch(s, /kind: 'fader',\s*id: 'node'/, 'no NODE fader left');
  });
  it('FRET stays a fader', () => {
    assert.match(s, /kind: 'fader',\s*id: 'fret'/);
  });
});

/* ── #21 / #22 numbers beside the words ──────────────────────────────────── */

describe('#21 word-only lanes now carry their number', () => {
  it('Foundations M3 STRENGTH and M4 AMPLITUDE', () => {
    const s = read('src/screens/lab/foundations/FoundationsCourseScreen.tsx');
    const m3 = s.slice(s.indexOf('function M3Rack'), s.indexOf('function M3Stage'));
    const m4 = s.slice(s.indexOf('function M4Rack'), s.indexOf('function M5Rack'));
    for (const [name, m] of [['M3', m3], ['M4', m4]] as const) {
      assert.match(m, /format: \(\) => `\$\{readout\} · \$\{Math\.round\(amt \* 100\)\} %`/, name);
      assert.match(m, /formatShort: \(\) => `\$\{Math\.round\(amt \* 100\)\}%`/, name);
      assert.doesNotMatch(m, /format: \(\) => readout,/, `${name}: words-only lane`);
    }
  });
  it('Start Here AMPLITUDE', () => {
    const s = read('src/screens/startHere/pages.tsx');
    const amp = s.slice(s.indexOf('function L3Amp'), s.indexOf('function L3Amp') + 2000);
    assert.match(amp, /'large → sounds loud'\} · \$\{Math\.round\(v \* 100\)\} %`/);
  });
  it('Speaker Coverage POSITION, HEIGHT and the ROOM tray sliders', () => {
    const s = read('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx');
    assert.match(s, /`fills · \$\{spreadWord\(fillSpread\)\} · \$\{pct\(fillSpread\)\} — in ↔ out from center`/);
    assert.match(s, /`spk \$\{spkEditable2 \? 2 : 1\} · \$\{posWord\(active\.x\)\} · \$\{pct\(active\.x\)\}`/);
    assert.match(s, /format: \(\) => `\$\{heightWord\(h01\)\} · \$\{pct\(h01\)\}`/);
    assert.match(s, /readout=\{`\$\{lowMidHigh\(stage01\)\} · \$\{pct\(stage01\)\}`\}/);
    assert.match(s, /readout=\{`\$\{lowMidHigh\(ceil01\)\} · \$\{pct\(ceil01\)\}`\}/);
    assert.match(s, /'far from stage' : 'mid'\} · \$\{pct\(depth01\)\}`\}/);
  });
});

describe('#22 Speaker Coverage dock keys show their value', () => {
  const s = read('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx');
  it('no empty key value; POSITION shows its %, AIM its degrees', () => {
    assert.doesNotMatch(s, /formatShort: \(\) => ''/);
    assert.match(s, /formatShort: \(\) => pctShort\(fillsTarget \? fillSpread : active\.x\)/);
    assert.match(s, /formatShort: \(\) => `\$\{active\.aim\}°`/);
  });
});

/* ── #28 Tuning ch7 NOTES keeps its slot ─────────────────────────────────── */

describe('#28 Tuning chapter 7: the dock never reflows around NOTES', () => {
  const s = read('src/screens/lab/tuning/chapters/ch7Just.tsx');
  const params = s.slice(s.indexOf('const params: DockParam[] = ['), s.indexOf('stopKey(ctx.player),\n  ];'));
  it('NOTES is first; PLAY, TONIC, RETUNE always hold a slot (LOCKED until usable)', () => {
    assert.ok(params.indexOf("id: 'notes'") > 0 && params.indexOf("id: 'notes'") < params.indexOf('playTray('), 'NOTES first');
    assert.match(params, /clips\.length\s*\? playTray\([^\n]*\)\s*: lockedKey\('play', 'PLAY', '[^']+'\)/);
    assert.match(params, /: \[\s*lockedKey\('tonic', 'TONIC', `[^`]+`\),\s*lockedKey\('retune', 'RETUNE', `[^`]+`\),\s*\]\)/);
    assert.doesNotMatch(params, /clips\.length \? \[playTray/, 'PLAY no longer appears/disappears');
    assert.match(s, /function lockedKey\(id: string, label: string, reason: string\): DockParam \{\s*return \{ kind: 'fader', id, label, locked: reason,/);
  });
  it('chapter 13 range is untouched (owner: stays as is)', () => {
    assert.match(read('src/screens/lab/tuning/chapters/ch13Apply.tsx'), /const MIN = 370, MAX = 430;/);
  });
});
