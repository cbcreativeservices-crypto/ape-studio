/**
 * Wiring round 5, DJ Systems Lab (round-3 grading, owner decisions
 * 2026-10-21) — each fix's ratchet: the wrong model, wording or drawing
 * fails here if it comes back.
 *   R3-DJ-01  Screen 21, TAP = BOOTH OUT (owner chose: unplug the booth
 *             monitors). The recorder's split lead takes both BOOTH OUT
 *             jacks, so the monitors' BOOTH cables come OUT of them (one
 *             plug per jack): drawn hanging loose under gravity in their own
 *             lanes, the monitors silent in the engine (LISTEN → BOOTH plays
 *             nothing), the tap's blurb says so; another tap restores them.
 *             The split lead's legs show their plugs seated, and BOOTH L's
 *             leg no longer drops across BOOTH R's plug.
 *   R3-DJ-02  Screen 20 SYSTEM, PASSIVE + AMP: no powered front with a lit
 *             LED labelled "PASSIVE TOP" — the passive top and the amp are
 *             drawn from BEHIND, a Speakon speaker lead (NL4 at both ends,
 *             heavy two-core, true size) from the amp's CH A OUTPUT to the
 *             top's INPUT in its own lane (rule book L3, L4, R1).
 *   R3-DJ-03  Screen 4: "balanced cables … which cancel hum" → what a
 *             balanced line really does.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { builtBooth, connect, type Booth } from '../src/screens/lab/dj/model/djModel.ts';
import { REC_TAPS, freshEvent, recHoldsBoothOut, withRec, type RecTap } from '../src/screens/lab/dj/model/djEvent.ts';
import { renderEvent } from '../src/screens/lab/dj/engine/djEventRender.ts';
import { MIXER_REAR, MIXER_REAR_JACKS as J } from '../src/screens/lab/dj/geometry/boothGeometry.ts';
import {
  AMP_REAR,
  BOOTH_LOOSE,
  BOOTH_SPLIT_JOG,
  LOOSE_TRS_LEN,
  MIXER_REAR_EXTRA as E,
  NL4,
  PASSIVE_REAR,
  REC_BOOTH_FRAME,
  SYS_AMP_AT,
  SYS_TOP_AT,
  boothLooseHang,
  speakerLeadPts,
} from '../src/screens/lab/dj/geometry/eventGeometry.ts';
import { SPEAKER_H, SPEAKER_W } from '../src/screens/lab/dj/geometry/gearGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
/** Source text, line endings normalised (a Windows checkout writes CRLF). */
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DJ = 'src/screens/lab/dj/';
const peak = (a: Float32Array) => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
/** A function's (or memo component's) source, from its declaration to the next top-level declaration. */
function block(src: string, head: RegExp): string {
  const m = head.exec(src);
  assert.ok(m, `${head} not found`);
  const rest = src.slice(m.index);
  const end = rest.slice(1).search(/\n(export )?(function|const|type) /);
  return end < 0 ? rest : rest.slice(0, end + 1);
}

/** Deck A playing into the built booth, the event rig fresh, the recorder on `tap`. */
function recBooth(tap: RecTap, perspective: 'BOOTH' | 'CROWD', base: Booth = builtBooth()): Booth {
  let b: Booth = { ...base, ev: freshEvent(), perspective };
  b = { ...b, decks: { ...b.decks, A: { ...b.decks.A, playing: true, at: 0, posSec: 40 } }, ch: { ...b.ch, 1: { ...b.ch[1], fader: 0.85 } } };
  return withRec(b, { tap, armedAt: 0 });
}

describe('R3-DJ-01 — the model: BOOTH OUT as the tap takes the monitors’ jacks', () => {
  it('only the BOOTH tap holds BOOTH OUT', () => {
    const at = (tap: RecTap) => recHoldsBoothOut(recBooth(tap, 'CROWD').ev!);
    assert.equal(at('BOOTH'), true);
    for (const t of ['NONE', 'REC_OUT', 'LOOPBACK'] as const) assert.equal(at(t), false, t);
  });
  it('LISTEN → BOOTH is silent while the recorder takes BOOTH OUT — and BOOTH OUT still feeds the recorder', () => {
    const r = renderEvent(recBooth('BOOTH', 'BOOTH'), 0, 2, null);
    assert.equal(peak(r.playback.l), 0, 'the booth monitors are unplugged');
    assert.equal(peak(r.playback.r), 0);
    assert.ok(r.ext.feedRms.booth > -60, `BOOTH OUT carries the mix (${r.ext.feedRms.booth})`);
    assert.ok(r.ext.feedRms.rec > -60, `…into the recorder (${r.ext.feedRms.rec})`);
  });
  it('another tap puts the cables back: the monitors play again', () => {
    for (const t of ['NONE', 'REC_OUT', 'LOOPBACK'] as const) {
      const r = renderEvent(recBooth(t, 'BOOTH'), 0, 2, null);
      assert.ok(peak(r.playback.l) > 0 && peak(r.playback.r) > 0, t);
    }
  });
  it('the modelled level at the decks loses the monitors while they are unplugged', () => {
    const on = renderEvent(recBooth('REC_OUT', 'CROWD'), 0, 2, null).ext.djDba!;
    const off = renderEvent(recBooth('BOOTH', 'CROWD'), 0, 2, null).ext.djDba!;
    assert.ok(off < on - 1, `${off} vs ${on}`);
  });
  it('a BOOTH cable whose mixer end is in PHONES is not in BOOTH OUT: that monitor keeps playing', () => {
    let ph = connect(builtBooth(), 'bth.trsL', 'mix.phones')!;
    // split cue makes the ears differ, so the L − R a balanced input hears is not zero
    ph = { ...ph, mixer: { ...ph.mixer, splitCue: true } };
    const r = renderEvent(recBooth('BOOTH', 'BOOTH', ph), 0, 2, null);
    assert.ok(peak(r.playback.l) > 0, 'the PHONES-fed monitor (L) plays');
    assert.equal(peak(r.playback.r), 0, 'the BOOTH-fed monitor (R) is unplugged');
  });
  it('the engine gates only BOOTH-fed monitors, through the one helper', () => {
    const src = read(DJ + 'engine/djEventRender.ts');
    assert.match(src, /const boothOutTaken = recHoldsBoothOut\(ev\);/);
    assert.match(src, /if \(f && f\.out === 'BOOTH' && boothOutTaken\) return null;/);
  });
  it('the tap’s blurb says it in plain words', () => {
    assert.match(REC_TAPS.BOOTH.blurb, /BOOTH OUT now feeds the recorder, so the booth monitors are unplugged and silent — one plug per jack\./);
    assert.match(REC_TAPS.BOOTH.blurb, /every booth move is in the take/, 'the tap’s own lesson stays');
  });
});

describe('R3-DJ-01 — the drawing: the BOOTH cables hang loose, the split lead in its own lanes', () => {
  const p21 = read(DJ + 'pages/p21Rec.tsx');
  it('Screen 21 draws the loose cables exactly while the recorder holds BOOTH OUT, and frames them', () => {
    assert.match(p21, /const boothTaken = recHoldsBoothOut\(ev\);/);
    assert.match(p21, /\{boothTaken \? <LooseBoothCables \/> : null\}/);
    assert.match(p21, /tap === 'BOOTH' \? REC_BOOTH_FRAME/);
    assert.match(p21, /plugged: false, live: false, noFixedPlug: true/);
    assert.match(p21, /'BOOTH MONITORS', 'UNPLUGGED'/);
  });
  for (const side of ['L', 'R'] as const) {
    it(`BOOTH ${side}: comes down from above the picture, always down, ends exactly vertical, its plug inside the frame and off the mixer`, () => {
      const h = boothLooseHang(side);
      assert.ok(h[0][1] < REC_BOOTH_FRAME.y, 'enters from above the frame (from its monitor)');
      for (let i = 1; i < h.length; i++) assert.ok(h[i][1] > h[i - 1][1], 'always down');
      const last = h.slice(-Math.ceil(h.length * 0.3));
      for (const p of last) assert.equal(p[0], BOOTH_LOOSE[side].x, 'its last stretch is vertical: the plug hangs pins-down');
      const tip = h[h.length - 1][1] + LOOSE_TRS_LEN;
      assert.ok(tip <= REC_BOOTH_FRAME.y + REC_BOOTH_FRAME.h - 4, `plug tip ${tip} inside the frame`);
      for (const p of h) {
        assert.ok(p[0] + 6.4 < 0, 'never over the mixer’s panel');
        assert.ok(p[0] - 6.4 > REC_BOOTH_FRAME.x, 'inside the frame');
      }
    });
  }
  it('the two loose cables keep their own lanes and their plugs never touch', () => {
    const L = boothLooseHang('L');
    const R = boothLooseHang('R');
    for (let i = 0; i < L.length; i++) assert.ok(Math.abs(L[i][0] - R[i][0]) >= 20, 'lanes ≥ 20 mm apart');
    assert.ok(Math.abs(BOOTH_LOOSE.L.boot - BOOTH_LOOSE.R.boot) >= 10, 'the plugs hang at different heights');
  });
  it('the split lead: each leg starts at its own jack with its plug drawn; BOOTH L leaves sideways and never crosses BOOTH R', () => {
    const rg = read(DJ + 'art/RecorderGear.tsx');
    assert.doesNotMatch(rg, /translateY: i \* 5/, 'no leg is shifted off its jack');
    assert.match(rg, /<PlugFace key=\{`p\$\{i\}`\} cx=\{f\.x\} cy=\{f\.y\} kind=\{trs \? 'trs' : 'rca'\}/);
    assert.match(p21, /jog=\{tap === 'BOOTH' \? BOOTH_SPLIT_JOG : undefined\}/);
    const lx = BOOTH_SPLIT_JOG[0]!;
    assert.equal(J['booth.L'].x, J['booth.R'].x, 'BOOTH L sits straight above BOOTH R (why it must jog)');
    assert.ok(lx - J['booth.R'].x >= 6.5 + 6.4 + 2, 'its lane clears BOOTH R’s socket and plug');
    assert.ok(J['master.R'].x - 9.5 - lx >= 1.6 + 2, 'and MASTER R’s flange');
    assert.equal(BOOTH_SPLIT_JOG[1], null, 'BOOTH R drops straight');
  });
  it('the frame is only widened for BOOTH; the mixer and recorder keep their places', () => {
    assert.ok(REC_BOOTH_FRAME.x < BOOTH_LOOSE.R.x + BOOTH_LOOSE.lean - 8);
    assert.equal(REC_BOOTH_FRAME.x + REC_BOOTH_FRAME.w, -14 + 432, 'right edge as the other taps');
    assert.ok(E['rec.L'].y < MIXER_REAR.h);
  });
});

describe('R3-DJ-02 — Screen 20 SYSTEM, PASSIVE + AMP', () => {
  const p20 = read(DJ + 'pages/p20Pa.tsx');
  const vg = read(DJ + 'art/VenueGear.tsx');
  it('a passive top is never drawn as the powered front (no lit LED), only when the tops are POWERED', () => {
    const sv = block(p20, /export function SystemView\(/);
    assert.match(sv, /v\.tops === 'PASSIVE' \? \(\s*<Group>\s*<PowerAmpRear[\s\S]*<PassiveTopRear[\s\S]*<SpeakerLead pts=\{LEAD\} live=\{live\}/);
    assert.match(sv, /\) : \(\s*<PowerSpeaker x=\{SYS_TOP_AT\.x\} y=\{SYS_TOP_AT\.y\} s=\{1\} on signal=\{live\} \/>\s*\)\}/);
    assert.equal((sv.match(/<PowerSpeaker/g) ?? []).length, 1);
    const top = block(vg, /export const PassiveTopRear = memo\(/);
    assert.doesNotMatch(top, /<Led\b/, 'a passive box has no power LED');
    assert.match(top, /PASSIVE · 8 OHMS/);
    assert.match(p20, /'PASSIVE TOP \(BACK\)'/);
    assert.match(p20, /'POWER AMP \(BACK\)'/);
  });
  it('the speaker lead: Speakon at BOTH ends, a heavy two-core cable at true size (L4)', () => {
    const lead = block(vg, /export function SpeakerLead\(/);
    assert.equal((lead.match(/<Nl4PlugFace /g) ?? []).length, 2, 'an NL4FC at each end');
    assert.match(lead, /width: NL4\.cableD, pattern: 'plain'/, 'unshielded two-core: no balanced line’s stripe');
    assert.deepEqual({ ...NL4 }, { flangeW: 26, flangeH: 31, insertD: 24, plugD: 30, bootD: 15, cableD: 10 });
    assert.ok(NL4.cableD >= 2 * 4.6, 'about twice a mic/line cable’s drawn width');
    // the amp's outputs and the top's input are Speakon chassis sockets; its inputs XLR female (line, from the processor)
    const amp = block(vg, /export const PowerAmpRear = memo\(/);
    assert.match(amp, /<Nl4Socket cx=\{R\[k\]\.x\} cy=\{R\[k\]\.y\} \/>/);
    assert.match(amp, /<XlrSocket cx=\{R\[k\]\.x\} cy=\{R\[k\]\.y\} d=\{19\} male=\{false\} \/>/);
    assert.match(vg, /<Nl4Socket cx=\{PASSIVE_REAR\[k\]\.x\} cy=\{PASSIVE_REAR\[k\]\.y\} \/>/);
  });
  it('the lead runs from the amp’s CH A OUTPUT to the top’s INPUT, always down, in its own lane (R1)', () => {
    const pts = speakerLeadPts();
    const a = pts[0];
    const b = pts[pts.length - 1];
    assert.deepEqual(a, [SYS_AMP_AT.x + AMP_REAR.outA.x, SYS_AMP_AT.y + AMP_REAR.outA.y]);
    assert.deepEqual(b.map((v) => Math.round(v * 1e6) / 1e6), [SYS_TOP_AT.x + PASSIVE_REAR.input.x, SYS_TOP_AT.y + PASSIVE_REAR.input.y]);
    for (let i = 1; i < pts.length; i++) assert.ok(pts[i][1] > pts[i - 1][1], 'always down');
    // its own lane: clear of every other socket on both panels
    const others = [
      { x: SYS_AMP_AT.x + AMP_REAR.outB.x, y: SYS_AMP_AT.y + AMP_REAR.outB.y },
      { x: SYS_AMP_AT.x + AMP_REAR.inA.x, y: SYS_AMP_AT.y + AMP_REAR.inA.y },
      { x: SYS_AMP_AT.x + AMP_REAR.inB.x, y: SYS_AMP_AT.y + AMP_REAR.inB.y },
      { x: SYS_AMP_AT.x + AMP_REAR.ac.x, y: SYS_AMP_AT.y + AMP_REAR.ac.y },
      { x: SYS_TOP_AT.x + PASSIVE_REAR.link.x, y: SYS_TOP_AT.y + PASSIVE_REAR.link.y },
    ];
    for (const o of others) for (const p of pts) assert.ok(Math.hypot(p[0] - o.x, p[1] - o.y) > NL4.flangeH / 2 + NL4.cableD / 2, `clear of the socket at ${o.x},${o.y}`);
    // the top's INPUT sits in its cup, on the cabinet; the amp's outputs on its chassis
    const c = PASSIVE_REAR.cup;
    assert.ok(PASSIVE_REAR.input.y - NL4.flangeH / 2 > c.y && PASSIVE_REAR.link.y + NL4.flangeH / 2 < c.y + c.h);
    assert.ok(c.x > 0 && c.x + c.w < SPEAKER_W && c.y + c.h < SPEAKER_H);
    assert.ok(AMP_REAR.outA.y + NL4.flangeH / 2 < 88 && AMP_REAR.outA.x > 24);
  });
  it('the amp’s CH A INPUT is fed (the processor’s XLR line), so the live lead has a source', () => {
    assert.match(p20, /<CableRun r=\{\{ id: 'ampInA', kind: 'xlr', colour: '#3d4046', pts: AMP_IN_A, plugged: true, live, label: 'FROM PROCESSOR' \}\} \/>/);
  });
});

describe('R3-DJ-03 — Screen 4 says what a balanced line does', () => {
  const p04 = read(DJ + 'pages/p04Build.tsx');
  it('the input rejects hum picked up equally on both wires', () => {
    assert.match(p04, /balanced lines: the input rejects hum picked up equally on both wires, which matters on long runs\./);
    assert.doesNotMatch(p04, /balanced cables, XLR and TRS, which cancel hum on long runs/);
  });
});
