/**
 * Wiring round 2, DJ Systems Lab (grade B → fixes, owner 2026-10-20): each
 * fix's ratchet — the wrong wording or drawing fails here if it comes back.
 *   DJ-R2-01 an output goes into an INPUT, never another output (screen 3)
 *   DJ-R2-02 the 20 m fault lead: XLR ends, unbalanced wiring; the hum's cause
 *   DJ-R2-03 the booth line in PHONES: two outputs of the same mixer
 *   DJ-R2-04 "many" powered speakers have a MIC/LINE switch
 *   DJ-R2-05 the receiver's overload: "on this lab's mixer (and many)"
 *   DJ-R2-06 the stage box's title and channel numbers off the runs' lines
 *   DJ-R2-07 output cables leave sideways before they climb (screens 4, 20)
 *   DJ-R2-08 the wrong-job routes keep ≥ 3.5 mm from every other run
 *   DJ-R2-09 screen 3's CH 1 / CH 2 printed under the inputs
 *   DJ-R2-10 the booth monitors drawn from behind on screen 4's room band
 *   DJ-R2-11 a freed MASTER R hangs clear of deck A's leads
 *   DJ-R2-12 PA R's LIMIT (clip) light, lit under PA_INPUT_MIC
 *   DJ-R2-13 levels differ by tens to hundreds of times, not thousands
 *   DJ-R2-14 the stage box inputs are mic preamps
 *   DJ-R2-15 this controller carries no audio (many have an interface)
 *   DJ-R2-16 LANE4's doc and ROOM_SCALE's comment
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILT_PLUGS, LEVELS, PHONO_GAIN_DB, wrongJob, type JackId, type PlugId } from '../src/screens/lab/dj/model/djModel.ts';
import { FAULTS as CAPSTONE_FAULTS } from '../src/screens/lab/dj/model/djCapstone.ts';
import { MAP_BODIES, MAP_PLUGS, WRONG_JOB_LANE, fixedEnd } from '../src/screens/lab/dj/geometry/mapGeometry.ts';
import { MIXER_REAR_JACKS } from '../src/screens/lab/dj/geometry/boothGeometry.ts';
import * as D from '../src/screens/lab/dj/geometry/dressGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DJ = 'src/screens/lab/dj/';
type State = Partial<Record<PlugId, JackId | null>>;
type P = readonly [number, number];
const WIRED: State = Object.fromEntries(MAP_PLUGS.map((p) => [p, BUILT_PLUGS[p]]));
const moved = (p: PlugId, j: JackId): State => {
  const st: State = { ...WIRED };
  for (const q of MAP_PLUGS) if (q !== p && st[q] === j) st[q] = null;
  st[p] = j;
  return st;
};

describe('wiring round 2 — DJ copy', () => {
  it('DJ-R2-01: MASTER OUT is an output too — an output goes into an input', () => {
    const p03 = read(`${DJ}pages/p03Connect.tsx`);
    assert.doesNotMatch(p03, /inputs and outputs never connect directly/);
    assert.match(p03, /MASTER OUT is an output too: an output always goes into an INPUT, never into another output\./);
  });
  it('DJ-R2-02: the fault lead is named honestly: XLR ends, unbalanced wiring, and the hum is ground current on its shield', () => {
    const p20 = read(`${DJ}pages/p20Pa.tsx`);
    assert.doesNotMatch(p20, /label="UNBALANCED LEAD"/);
    // DJ-R3-ADAPTER (owner 2026-10-21) renamed it: a jack lead with an XLR adapter (test/wiringFix_r3_dj_20261021.test.ts)
    assert.match(p20, /label="JACK LEAD \+ XLR ADAPTER"/);
    assert.match(p20, /the TS jack ties pin 3 to pin 1/);
    assert.match(p20, /over 20 m its shield also carries ground current between the booth’s earth and the stage’s earth: that is the hum/);
    assert.doesNotMatch(p20, /why="Over a long run, an unbalanced lead picks up hum/);
  });
  it('DJ-R2-03 (replaced by DJ-R3-PHONES, owner 2026-10-21): the "two outputs joined" move is gone — the booth cable’s mixer end goes to PHONES', () => {
    const t = wrongJob('bth.trsL', 'mix.phones')!;
    assert.doesNotMatch(t, /joined two outputs/);
    assert.match(t, /^It fits, and it plays — but thin and hollow\./); // DJ-R4-PHONES wording
    assert.equal(wrongJob('bth.trsR', 'mix.phones'), t);
  });
  it('DJ-R2-04: "many" powered speakers have a MIC/LINE switch, not every one', () => {
    const p04 = read(`${DJ}pages/p04Build.tsx`);
    assert.doesNotMatch(p04, /Its rear has an input switch \(set LINE, not MIC\)/);
    assert.match(p04, /Many have an input switch \(MIC\/LINE\): set LINE\./);
  });
  it('DJ-R2-05: the receiver overload is this mixer’s (and many), and the cure stays "set the receiver to MIC"', () => {
    const p19 = read(`${DJ}pages/p19Mic.tsx`);
    assert.match(p19, /On this lab’s mixer \(and many\), the receiver’s LINE output overloads the mic input before the GAIN knob — turning GAIN down cannot clean it\. Set the receiver to MIC\./);
    assert.match(p19, /On this lab’s mixer \(and many\), it overloads the mic input’s first stage, before the GAIN knob can do anything/);
    assert.doesNotMatch(p19, /The receiver’s LINE output is overloading the mic input/);
  });
  it('DJ-R2-12: the capstone names the drawn light — LIMIT (clip)', () => {
    const f = CAPSTONE_FAULTS.PA_INPUT_MIC;
    assert.match(f.evidence, /PA R’s own LIMIT \(clip\) light was red/);
    assert.ok(f.wrong.cause.some((c) => /LIMIT \(clip\) light/.test(c.why)));
    assert.doesNotMatch(read(`${DJ}model/djCapstone.ts`), /own clip light/);
  });
  it('DJ-R2-13: the level ladder’s own numbers: tens to hundreds of times (about 36–56 dB), never "thousands"', () => {
    const p03 = read(`${DJ}pages/p03Connect.tsx`);
    assert.doesNotMatch(p03, /Levels differ by thousands of times/);
    assert.match(p03, /Levels differ by tens to hundreds of times \(about 36–56 dB, from a cartridge or a mic up to line level\)/);
    const db = (a: number, b: number) => 20 * Math.log10(b / a);
    assert.equal(Math.round(db(LEVELS.phono.volts, LEVELS.consumerLine.volts)), 36, 'cartridge → consumer line');
    assert.equal(Math.round(db(LEVELS.phono.volts, LEVELS.consumerLine.volts)), PHONO_GAIN_DB, 'the same 36 dB the phono stage adds');
    assert.equal(Math.round(db(LEVELS.mic.volts, LEVELS.proLine.volts)), 56, 'mic → pro line');
  });
  it('DJ-R2-14: the stage box inputs are mic preamps, padded or set low for a line feed', () => {
    assert.match(read(`${DJ}pages/p20Pa.tsx`), /The stage box inputs are mic preamps: the engineer pads them or sets the gain low for your line feed\./);
  });
  it('DJ-R2-15: THIS controller carries no audio — many have their own interface', () => {
    const p16 = read(`${DJ}pages/p16Laptop.tsx`);
    assert.doesNotMatch(p16, /no audio at all/);
    assert.match(p16, /this controller carries no audio \(many have their own interface\)/);
  });
  it('DJ-R2-16: LANE4’s doc names the heights LANE4 really uses; ROOM_SCALE says it is no longer drawn', () => {
    const dg = read(`${DJ}geometry/dressGeometry.ts`);
    assert.doesNotMatch(dg, /BOOTH R 514 under it|BOOTH L 520 under it/);
    assert.match(dg, /right-going BOOTH L 487 and MASTER R 498, the left-going BOOTH R 498 and\n \* MASTER L 509/);
    assert.equal(D.LANE4['bth.trsL'], 487);
    assert.equal(D.LANE4['mst.xlrR'], 498);
    assert.equal(D.LANE4['bth.trsR'], 498);
    assert.equal(D.LANE4['mst.xlrL'], 509);
    const mg = read(`${DJ}geometry/mapGeometry.ts`);
    assert.doesNotMatch(mg, /The room band's one scale: speakers, stands and table at 15 %/);
    assert.match(mg, /no longer drawn: Screen 4 draws\n \*  its room at dressGeometry\.ROOM_F \(1:5, 20 %\)/);
    assert.equal(D.ROOM_F, 0.2);
  });
});

describe('wiring round 2 — DJ drawings', () => {
  it('DJ-R2-06: the stage box title is right-aligned and the channel numbers sit off the socket centre lines', () => {
    const vg = read(`${DJ}art/VenueGear.tsx`);
    assert.match(vg, /<SceneText x=\{SB_W - 12\} y=\{20\} size=\{6\} text="STAGE BOX · TO FOH" color=\{INK\.amber\} face="label" align="right" \/>/);
    assert.match(vg, /<SceneText x=\{j\.x - SB_NUM_DX\} y=\{j\.y - 18\}/);
    assert.match(vg, /export const SB_NUM_DX = 9;/);
    assert.doesNotMatch(vg, /<SceneText x=\{12\} y=\{20\} size=\{6\} text="STAGE BOX/);
  });
  it('DJ-R2-07: screen 20’s runs leave their plugs sideways before they climb or drop', () => {
    const p20 = read(`${DJ}pages/p20Pa.tsx`);
    assert.match(p20, /const JOG = \{ R: -16, L: 8 \} as const;/);
    assert.match(p20, /return \[\[a\.x, a\.y\], \[x, a\.y\], \[x, lane\], \[b\.x, lane\], \[b\.x, b\.y\]\];/);
    // MASTER R climbs between the BOOTH "L" legend (x + 11) and the MASTER bracket's foot (x − 12)
    const xR = MIXER_REAR_JACKS['master.R'].x - 16;
    assert.ok(xR - 2.3 > MIXER_REAR_JACKS['booth.L'].x + 11 + 1.2 && xR + 2.3 < MIXER_REAR_JACKS['master.R'].x - 12);
  });
  it('DJ-R2-07: screen 4’s BOOTH L and MASTER L leave sideways (first stretch only); the MASTER words move off MASTER R', () => {
    const J = MIXER_REAR_JACKS;
    const mx = MAP_BODIES[1].x;
    for (const p of ['bth.trsL', 'mst.xlrL'] as const) {
      const r = D.lane4(p, BUILT_PLUGS[p]);
      const a = fixedEnd(p)!;
      assert.deepEqual(r[0], [a.x, a.y]);
      assert.equal(r[1][0], a.x + D.JOG4[p]!.dx, `${p} steps sideways first`);
      assert.equal(r[2][0], r[1][0], `${p} then climbs`);
      assert.equal(r[2][1], D.LANE4[p], `${p} on its own lane, as before`);
    }
    // BOOTH L climbs between the BOOTH bracket's foot and the MASTER bracket's
    const bx = D.lane4('bth.trsL', 'boothL.in')[1][0] - mx;
    assert.ok(bx - 2.1 > J['booth.L'].x + 9 && bx + 2.1 < J['master.R'].x - 12);
    // MASTER L climbs right of the MASTER bracket's foot, short of the AC inlet
    const lx = D.lane4('mst.xlrL', 'paL.in')[1][0] - mx;
    assert.ok(lx - 2.3 > J['master.L'].x + 12 && lx + 2.3 < J.ac.x - 12);
    // the words (about 33 mm of 4 mm type) clear MASTER R's straight climb
    const cx = (J['master.R'].x + J['master.L'].x) / 2 + D.MASTER_WORDS_DX4;
    assert.ok(cx - 17 > J['master.R'].x + 2.3 && cx + 17 < lx - 2.3);
    assert.match(read(`${DJ}art/SystemMap.tsx`), /masterWordsDx=\{MASTER_WORDS_DX4\}/);
    assert.match(read(`${DJ}art/RearPanels.tsx`), /t="MASTER OUT \(BAL\)" tx=\{\(J\['master\.R'\]\.x \+ J\['master\.L'\]\.x\) \/ 2 \+ masterWordsDx\}/);
  });
  it('DJ-R2-08: the wrong-job moves keep ≥ 3.5 mm (edge to edge) from every other dressed run, except where they cross', () => {
    assert.equal(WRONG_JOB_LANE, 520);
    const MOVES: [PlugId, JackId][] = [['bth.trsL', 'mix.phones'], ['bth.trsR', 'mix.phones'], ['phones', 'paL.in'], ['phones', 'paR.in'], ['phones', 'boothL.in'], ['phones', 'boothR.in']];
    const crossings = (a: readonly P[], b: readonly P[]): P[] => {
      const out: P[] = [];
      for (let i = 1; i < a.length; i++) for (let k = 1; k < b.length; k++) {
        const [x1, y1] = a[i - 1], [x2, y2] = a[i], [x3, y3] = b[k - 1], [x4, y4] = b[k];
        const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
        if (Math.abs(d) < 1e-9) continue;
        const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
        const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        // a real crossing is steep (over 30°); a graze is not one
        if (Math.abs(d) / (Math.hypot(x2 - x1, y2 - y1) * Math.hypot(x4 - x3, y4 - y3)) < 0.5) continue;
        out.push([x1 + t * (x2 - x1), y1 + t * (y2 - y1)]);
      }
      return out;
    };
    const bad: string[] = [];
    for (const [p, j] of MOVES) {
      const st = moved(p, j);
      const r = D.drawnRun4(p, st);
      for (const q of MAP_PLUGS) {
        if (q === p) continue;
        const o = D.drawnRun4(q, st);
        const xs = crossings(r, o);
        let worst = Infinity;
        for (const pt of r) {
          if (xs.some((c) => Math.hypot(c[0] - pt[0], c[1] - pt[1]) < 14)) continue;
          worst = Math.min(worst, D.distToPolyline(o, pt[0], pt[1]) - D.cableHalf4(p) - D.cableHalf4(q));
        }
        if (worst < 3.5) bad.push(`${p} → ${j}: ${worst.toFixed(2)} mm from ${q}`);
      }
    }
    assert.deepEqual(bad, []);
  });
  it('DJ-R2-09: screen 3 prints CH 1 / CH 2 under the inputs, and parked leads keep off those words', () => {
    assert.match(read(`${DJ}pages/p03Connect.tsx`), /<MixerRear x=\{S3\.mix\.x\} y=\{S3\.mix\.y\} on channelsBelow \/>/);
    const rp = read(`${DJ}art/RearPanels.tsx`);
    assert.match(rp, /<BracketUnder x0=\{J\['ch1\.phono\.L'\]\.x - 7\} x1=\{J\['ch1\.line\.L'\]\.x \+ 7\} y=\{MIXER_CH_UNDER_Y\} t="CH 1" \/>/);
    const legends = D.legends3();
    assert.ok(legends.some((b) => b.y > D.S3.mix.y + 80 && b.w >= 8), 'the CH words below are in the parked leads’ keep-off list');
    // and no lead into CH 1 runs over the words: they all come down from above
    for (const src of ['A', 'TT'] as const) for (const k of ['line', 'phono'] as const) for (const side of ['L', 'R'] as const) {
      const r = D.run3(src, side, `ch1.${k}.${side}` as JackId);
      for (const [, y] of r) assert.ok(y < D.S3.mix.y + 79, `${src} ${k} ${side} reaches the CH 1 words`);
    }
  });
  it('DJ-R2-10: the room band draws the booth monitors from behind (no grille), the PA from the front', () => {
    const sm = read(`${DJ}art/SystemMap.tsx`);
    assert.match(sm, /<MonitorBack x=\{b\.x\} y=\{b\.y\} s=\{F\} on=\{spkOn\(k\)\} \/>/);
    assert.doesNotMatch(sm, /<PowerSpeaker x=\{b\.x\} y=\{b\.y\} s=\{F\} on=\{spkOn\(k\)\} small/);
    assert.match(sm, /<PowerSpeaker x=\{b\.x\} y=\{b\.y\} s=\{F\} on=\{spkOn\(k\)\} signal=\{lit\(k\)\} pole \/>/);
  });
  it('DJ-R2-11: a freed MASTER R hangs clear of deck A’s leads, the mixer and the strip; unpatched, it hangs as before', () => {
    const ov = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    for (const [p, j] of [['mst.xlrL', 'paR.in'], ['phones', 'paR.in'], ['bth.trsL', 'paR.in']] as [PlugId, JackId][]) {
      const st = moved(p, j);
      assert.equal(st['mst.xlrR'], null);
      const box = D.loosePlugBox4('mst.xlrR', st);
      for (const q of MAP_PLUGS) {
        if (q === 'mst.xlrR' || !st[q]) continue;
        assert.equal(D.cableInBox(D.drawnRun4(q, st), { x: box.x - 1, y: box.y - 1, w: box.w + 2, h: box.h + 2 }, D.cableHalf4(q)), 0, `${p} → ${j}: the MASTER R plug lies on ${q}`);
      }
      for (const b of [...MAP_BODIES, D.FRONT4]) assert.equal(ov(box, b), 0, `${p} → ${j}: the MASTER R plug lies on the gear`);
      // drawn where the geometry says: the run ends at the plug's boot
      const h = D.drawnRun4('mst.xlrR', st);
      assert.ok(Math.abs(h[h.length - 1][1] - box.y) < 1e-9);
    }
    // with nothing patched, the round-3 hang is unchanged (under its own socket)
    const un = D.loosePlugBox4('mst.xlrR');
    assert.ok(Math.abs(un.x + un.w / 2 - fixedEnd('mst.xlrR')!.x) < 1);
    assert.match(read(`${DJ}art/SystemMap.tsx`), /pts: plugged \? lane4\(p, booth\.plugs\[p\] \?\? null\) : geo\[p\]!,/);
  });
  it('DJ-R2-12: the speaker rear lights its LIMIT LED red when its switch is on MIC', () => {
    const g = read(`${DJ}art/gear.tsx`);
    assert.match(g, /<Led cx=\{170\} cy=\{140\} r=\{3\} on=\{on && mic\} colour=\{INK\.peak\} \/>/);
    assert.doesNotMatch(g, /<Led cx=\{170\} cy=\{140\} r=\{3\} on=\{false\}/);
  });
});
