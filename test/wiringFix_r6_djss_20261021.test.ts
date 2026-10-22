/**
 * Wiring round 6 — DJ Systems Lab + Sound Systems (round-5 grading,
 * 2026-10-21). Each fix's ratchet: the wrong drawing or wording fails here.
 *   R5-DJ-01  Screen 20 SYSTEM, PASSIVE + AMP: CH B OUTPUT drove "TO TOP R"
 *             but CH B INPUT was empty. A second processor XLR ("FROM
 *             PROCESSOR R") is now seated in CH B INPUT, rising out of the
 *             frame in its own lane, clear of every lead and label (a stereo
 *             amp: one input per channel — L into A, R into B).
 *   R5-SS-01  The processor → in-ear transmitter reason offered only the
 *             stereo pair; it now offers Aux 8 on one cable (mono) too.
 *   R5-SS-02  The twin-cable plates printed AUX 10 left of AUX 9. They now
 *             read in output order, each leader landing on its own cable's
 *             long leg, between other runs, never crossing its twin's.
 */
import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AMP_REAR, NL4, SYS_AMP_AT, SYS_TOP_AT } from '../src/screens/lab/dj/geometry/eventGeometry.ts';
import { fitView } from '../src/screens/lab/dj/geometry/boothGeometry.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DJ = 'src/screens/lab/dj/';

describe('R5-DJ-01 — Screen 20 SYSTEM: CH B INPUT is fed by the processor’s R line', () => {
  const p20 = read(DJ + 'pages/p20Pa.tsx');
  const vg = read(DJ + 'art/VenueGear.tsx');
  const S_FRAME = { x: -40, y: -270, w: 1180, h: 1030 };
  const AMP_W = 482;
  const inA = { x: SYS_AMP_AT.x + AMP_REAR.inA.x, y: SYS_AMP_AT.y + AMP_REAR.inA.y };
  const inB = { x: SYS_AMP_AT.x + AMP_REAR.inB.x, y: SYS_AMP_AT.y + AMP_REAR.inB.y };
  const outA = { x: SYS_AMP_AT.x + AMP_REAR.outA.x, y: SYS_AMP_AT.y + AMP_REAR.outA.y };
  const outB = { x: SYS_AMP_AT.x + AMP_REAR.outB.x, y: SYS_AMP_AT.y + AMP_REAR.outB.y };
  const XLR_FACE = 21; // an XLR plug's shell (PlugFace 'xlr')
  const XLR_CORD = 4.6; // cables.tsx WIDTH.xlr
  const LANE_HALF = 12; // the lane's label obstacle, each side

  it('the geometry the test assumes is the source’s', () => {
    assert.match(p20, /export const S_FRAME: Box = \{ x: -40, y: -270, w: 1180, h: 1030 \};/);
    assert.match(vg, /export const AMP_W = 482;\nexport const AMP_H = 88;/);
    assert.match(vg, /const LEG = 4\.2;/);
    assert.match(read(DJ + 'art/cables.tsx'), /xlr: 4\.6,/);
    assert.match(p20, /export const AMP_LEAD_RUN_OFF = 1200;/);
  });

  it('a second XLR is drawn into CH B INPUT: plugged (seated in the socket), live with the music, named FROM PROCESSOR R', () => {
    assert.match(p20, /export const AMP_IN_B: \[number, number\]\[\] = \[\n {2}\[SYS_AMP_AT\.x \+ AMP_REAR\.inB\.x, SYS_AMP_AT\.y \+ AMP_REAR\.inB\.y\],\n {2}\[SYS_AMP_AT\.x \+ AMP_REAR\.inB\.x, S_FRAME\.y - AMP_LEAD_RUN_OFF\],\n\];/);
    assert.match(p20, /<CableRun r=\{\{ id: 'ampInA', kind: 'xlr', colour: '#3d4046', pts: AMP_IN_A, plugged: true, live, label: 'FROM PROCESSOR' \}\} \/>\n\s*<CableRun r=\{\{ id: 'ampInB', kind: 'xlr', colour: '#3d4046', pts: AMP_IN_B, plugged: true, live, label: 'FROM PROCESSOR R' \}\} \/>/);
    // the amp's CH B INPUT socket is a female XLR on the chassis (the plug seats there)
    assert.match(vg, /\(\[\['inB', 'CH B'\], \['inA', 'CH A'\]\] as const\)/);
    assert.match(vg, /<XlrSocket cx=\{R\[k\]\.x\} cy=\{R\[k\]\.y\} d=\{19\} male=\{false\} \/>/);
    assert.ok(AMP_REAR.inB.x - XLR_FACE / 2 > 24 && AMP_REAR.inB.x + XLR_FACE / 2 < AMP_W - 24, 'the plug sits on the chassis, between the rack ears');
    assert.ok(AMP_REAR.inB.y - XLR_FACE / 2 > 0 && AMP_REAR.inB.y + XLR_FACE / 2 < 88, 'within the panel’s height');
  });

  it('its own lane: straight up, off the frame, clear of CH A’s XLR, CH A’s speaker plug, the INPUT (BAL) legend and the mains', () => {
    // straight up and gone past the glass at every size
    assert.ok(S_FRAME.y - 1200 < S_FRAME.y - 100);
    // CH A's XLR lane: the two lanes' label obstacles do not even meet
    assert.ok(inA.x - inB.x > 2 * LANE_HALF, `${inA.x - inB.x} mm between the input leads`);
    assert.ok(inB.x + XLR_FACE / 2 < inA.x - XLR_FACE / 2, 'the two XLR plugs never touch');
    // CH A's NL4 speaker plug and its lead hang below; CH B's speaker lead rises at outB
    assert.ok(outA.x + NL4.plugD / 2 < inB.x - XLR_FACE / 2, 'clear of CH A’s Speakon plug');
    assert.ok(outB.x + NL4.plugD / 2 < inB.x - LANE_HALF, 'clear of CH B’s rising speaker lead');
    // the INPUT (BAL) legend (LEG+1 = 5.2 mm, generous 0.62 em a letter) stays right of the cord
    const legW = 'INPUT (BAL)'.length * 0.62 * 5.2;
    assert.match(vg, /<SceneText x=\{\(R\.inB\.x \+ R\.inA\.x\) \/ 2\} y=\{14\} size=\{LEG \+ 1\} text="INPUT \(BAL\)"/);
    assert.ok(inB.x + XLR_CORD / 2 < (AMP_REAR.inB.x + AMP_REAR.inA.x) / 2 - legW / 2, 'left of the INPUT (BAL) legend');
    assert.ok(inA.x - XLR_CORD / 2 > (AMP_REAR.inB.x + AMP_REAR.inA.x) / 2 + legW / 2, 'CH A still right of it');
    // the legend and the CH B tag under the socket are clear of the plug face
    assert.ok(14 + 1 < AMP_REAR.inB.y - XLR_FACE / 2, 'the legend is above the plug');
    // the mains keeps to the left of every audio lead
    assert.ok(SYS_AMP_AT.x + AMP_REAR.ac.x + 15 < inB.x - XLR_FACE / 2);
  });

  it('labels keep off it: its lane is a label obstacle and no callout is placed at it', () => {
    assert.match(p20, /up\(AMP_IN_A, 12\),\n\s*up\(AMP_IN_B, 12\),/);
    // TO TOP R stands LEFT of CH B's speaker lead; POWER AMP (BACK) right of the amp
    assert.match(p20, /\{ id: 'cb', text: 'TO TOP R', at: \{ x: AMP_OUT_B\[0\]\[0\], y: SYS_AMP_AT\.y - 75 \}, dx: -8, dy: 0, tone: 'plain' \}/);
    assert.ok(outB.x < inB.x - LANE_HALF);
    assert.match(p20, /\{ id: 'am', text: 'POWER AMP \(BACK\)', at: \{ x: SYS_AMP_AT\.x \+ AMP_W - 11, y: SYS_AMP_AT\.y \+ AMP_H \/ 2 \}, dx: 12, dy: 0, tone: 'plain' \}/);
    assert.ok(SYS_AMP_AT.x + AMP_W - 11 > inA.x + LANE_HALF);
    // the speaker tag stands left of the top, far from the amp's inputs
    assert.ok(SYS_TOP_AT.x < inB.x - 200);
  });

  for (const [W, H] of [[360, 290], [390, 330], [820, 600]] as const) {
    it(`at ${W}×${H} both input leads are on the glass and read apart (≥ 5 pt between the cords)`, () => {
      const v = fitView(S_FRAME, W, H * 0.5, 6);
      const sx = (x: number) => v.ox + x * v.s;
      for (const x of [inA.x, inB.x]) assert.ok(sx(x) > 0 && sx(x) < W, `x ${x} on the glass`);
      assert.ok((inA.x - inB.x - XLR_CORD) * v.s >= 5, `${((inA.x - inB.x - XLR_CORD) * v.s).toFixed(1)} pt between the cords`);
      assert.ok((inB.x - outA.x) * v.s >= 10, 'well clear of CH A’s speaker lead');
      // the amp (and so both sockets) is inside the frame
      assert.ok(SYS_AMP_AT.y > S_FRAME.y && SYS_AMP_AT.y + 88 < S_FRAME.y + S_FRAME.h);
    });
  }

  it('the a11y and MODEL §15 say so; the CH B output sentence still holds', () => {
    assert.match(p20, /The processor’s right-hand line comes into the amp’s CH B input on a second XLR\. The amp’s CH B output feeds the other top, TOP R, on its own Speakon lead out of view, and the amp’s mains lead is plugged into its AC IN\./);
    const model = read('docs/labs/dj/MODEL.md');
    const s15 = model.slice(model.indexOf('## 15.'), model.indexOf('## 16.'));
    assert.match(s15, /R5-DJ-01/);
    assert.match(s15, /"FROM PROCESSOR R", `AMP_IN_B`/);
    assert.match(s15, /processor's L into CH A, its R into CH B/);
  });
});

const sys = await import('../src/features/soundsystems/system.ts');
const { IEM_FROM_PROCESSOR_WHY } = await import('../src/features/soundsystems/capstones.ts');
const { stereoFestivalBuild } = await import('./_ssReferenceBuilds.ts');
const { routeCables, placeFeedTags, placeCableTags, pathSegments, segmentHitsBox, twinOrder } = await import('../src/screens/lab/soundsystems/art/VenueView.tsx');
const { placedToBeams, twinCableTag } = await import('../src/screens/lab/soundsystems/plot.tsx');

describe('R5-SS-01 — the processor → in-ear reason offers mono and stereo', () => {
  it('Aux 8 on one cable, or for stereo Aux 9 and Aux 10 on two cables', () => {
    assert.equal(
      IEM_FROM_PROCESSOR_WHY,
      'The in-ear transmitter is fed from the loudspeaker processor — that carries the house mix with its EQ, delay and limiting for the PA, not the performer’s in-ear mix. Feed it from the stagebox: Aux 8 on one cable, or for stereo Aux 9 and Aux 10 on two cables.',
    );
  });
});

describe('R5-SS-02 — twin-cable plates read in output order, each on its own cable', () => {
  type Box = { x0: number; x1: number; y0: number; y1: number };
  const overlaps = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const layout = (a: 'aux9' | 'aux10', b: 'aux9' | 'aux10') => {
    const { s } = stereoFestivalBuild(a, b);
    const walk = sys.consoleWalk(s);
    const feed = new Map<string, string>();
    for (const [id, f] of walk.feeds) {
      const pair = walk.pairs.get(id);
      feed.set(id, pair ? `AUX\n${pair[0].slice(3)}+${pair[1].slice(3)}` : String(f));
    }
    const routes = routeCables(s.placed, s.links);
    const ft = placeFeedTags(placedToBeams(s.placed, new Set(sys.trace(s).live), feed), s.placed, routes);
    const tagged = s.links.map((l) => [l, twinCableTag(s, l, walk)] as const).filter((x): x is readonly [typeof x[0], string] => !!x[1]);
    const ct = placeCableTags(tagged, s.placed, routes, ft.values());
    const byText = new Map([...ct.values()].map((t) => [t.text, t]));
    const lane = (text: string) => {
      const l = tagged.find(([, t]) => t === text)![0];
      return pathSegments(routes.paths.get(routes.keys.get(l)!)!);
    };
    const lanes = [...routes.paths].filter(([k]) => !routes.merged.has(k)).flatMap(([, d]) => pathSegments(d));
    return { s, routes, ft, ct, byText, lane, lanes };
  };

  it('twinOrder: AUX 9 before AUX 10 (numbers as numbers), an unchosen OUT ? last', () => {
    assert.ok(twinOrder('AUX 9', 'AUX 10') < 0);
    assert.ok(twinOrder('aux9', 'aux10') < 0);
    assert.ok(twinOrder('OUT ?', 'AUX 8') > 0);
  });

  for (const order of [['aux9', 'aux10'], ['aux10', 'aux9']] as const) {
    describe(`plugged ${order.join(' then ')}`, () => {
      const L = layout(...order);
      const a9 = L.byText.get('AUX 9')!;
      const a10 = L.byText.get('AUX 10')!;

      it('the twins lie in output order whichever was plugged first: the same two lanes, AUX 9 on the inner one', () => {
        const other = layout(...(order[0] === 'aux9' ? (['aux10', 'aux9'] as const) : (['aux9', 'aux10'] as const)));
        assert.deepEqual(L.lane('AUX 9'), other.lane('AUX 9'));
        assert.deepEqual(L.lane('AUX 10'), other.lane('AUX 10'));
        // AUX 9's long leg runs below AUX 10's (both leave the stagebox to the right)
        const long = (sg: number[][]) => [...sg].sort((p, q) => Math.hypot(q[2] - q[0], q[3] - q[1]) - Math.hypot(p[2] - p[0], p[3] - p[1]))[0];
        assert.ok(long(L.lane('AUX 9'))[1] > long(L.lane('AUX 10'))[1]);
      });

      it('the plates read AUX 9, then AUX 10 — left to right on one line (or AUX 9 above)', () => {
        assert.ok(a9 && a10);
        const sameLine = a9.box.y0 < a10.box.y1 && a9.box.y1 > a10.box.y0;
        assert.ok(sameLine ? a9.box.x1 <= a10.box.x0 : a9.box.y1 <= a10.box.y0, `AUX 9 at ${a9.box.x0.toFixed(0)}, AUX 10 at ${a10.box.x0.toFixed(0)}`);
        assert.ok(!overlaps(a9.box, a10.box), 'the plates never meet');
      });

      it('each plate is clear of every lane, feed tag, device and edge', () => {
        for (const t of [a9, a10]) {
          assert.equal(t.clear, true, t.text);
          assert.ok(!L.lanes.some((sg) => segmentHitsBox(sg, t.box)), `${t.text} on a lane`);
          for (const f of L.ft.values()) assert.ok(!overlaps(t.box, f.box), `${t.text} meets a feed tag`);
          for (const p of L.s.placed) {
            const q = sys.slotDef(p.slot);
            assert.ok(!overlaps(t.box, { x0: q.x - 10, x1: q.x + 10, y0: q.y - 7.5, y1: q.y + 7.5 }), `${t.text} on ${p.kind}`);
          }
          assert.ok(t.box.x0 >= 4 && t.box.x1 <= 356 && t.box.y0 >= 4);
        }
      });

      it('each leader lands on its OWN cable’s long leg, between other runs, ≤ 110 units, and the two never cross', () => {
        for (const t of [a9, a10]) {
          const own = L.lane(t.text);
          const longLeg = [...own].sort((p, q) => Math.hypot(q[2] - q[0], q[3] - q[1]) - Math.hypot(p[2] - p[0], p[3] - p[1]))[0];
          const ld = t.leader;
          if (!ld) continue; // beside its cable, no leader needed
          const { x1, y1 } = ld;
          const on = (sg: number[]) => x1 >= Math.min(sg[0], sg[2]) - 0.1 && x1 <= Math.max(sg[0], sg[2]) + 0.1 && y1 >= Math.min(sg[1], sg[3]) - 0.1 && y1 <= Math.max(sg[1], sg[3]) + 0.1;
          assert.ok(on(longLeg), `${t.text}: the dot is on its own long leg`);
          assert.ok(Math.hypot(ld.x1 - ld.x0, ld.y1 - ld.y0) <= 110, `${t.text}: leader ${Math.hypot(ld.x1 - ld.x0, ld.y1 - ld.y0).toFixed(0)}`);
          const others = L.lanes.filter((sg) => !own.some((o) => o.every((v, i) => Math.abs(v - sg[i]) < 0.01)));
          assert.ok(!others.some((sg) => segmentHitsBox(sg, { x0: x1 - 1.5, x1: x1 + 1.5, y0: y1 - 1.5, y1: y1 + 1.5 })), `${t.text}: the dot is not where another run crosses`);
          // a leader never runs through its sibling's plate
          const sib = t === a9 ? a10 : a9;
          assert.ok(!segmentHitsBox([ld.x0, ld.y0, ld.x1, ld.y1], { x0: sib.box.x0 + 1, x1: sib.box.x1 - 1, y0: sib.box.y0 + 1, y1: sib.box.y1 - 1 }), `${t.text}'s leader under ${sib.text}`);
          // nor crosses its twin's cable
          const twin = L.lane(sib.text);
          assert.ok(!twin.some((sg) => segmentHitsBox([ld.x0, ld.y0, ld.x1, ld.y1], { x0: Math.min(sg[0], sg[2]) - 0.3, x1: Math.max(sg[0], sg[2]) + 0.3, y0: Math.min(sg[1], sg[3]) - 0.3, y1: Math.max(sg[1], sg[3]) + 0.3 })), `${t.text}'s leader crosses ${sib.text}'s cable`);
        }
        const [m, n] = [a9.leader, a10.leader];
        if (m && n) {
          const d = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
          assert.ok(!(d(m.x0, m.y0, m.x1, m.y1, n.x0, n.y0) * d(m.x0, m.y0, m.x1, m.y1, n.x1, n.y1) < 0 && d(n.x0, n.y0, n.x1, n.y1, m.x0, m.y0) * d(n.x0, n.y0, n.x1, n.y1, m.x1, m.y1) < 0), 'the leaders cross');
        }
      });
    });
  }
});
