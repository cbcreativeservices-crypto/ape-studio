/**
 * STICK TECHNIQUE — the sticks, mallets and beaters of the concert,
 * keyboard-percussion, small-percussion and drum-tuning pictures, as NUMBERS.
 *
 * Owner 2026-11-22, on Miking → Concert Snare → "Meet it", step 3 (screenshot
 * "drumstickhasunrealisticangle"): "look for other labs with drum sticks and
 * make sure they are not all crazy like this example. It should look like
 * normal stick tech. usage".
 *
 * Every pose is computed from the same constants and functions the art
 * draws from (nothing re-typed here), and held to the standard of normal
 * technique: a drawn striker is never longer than the real one; it meets the
 * struck surface at a playing angle; a hand sits at a playing height; a pair
 * of hands sits about shoulder width apart with the sticks in a V toward the
 * playing spot; the side and top views draw the SAME striker; a raised
 * striker shows its head above its hand and turns about the hand. The
 * concert snare's part names are laid out as the phone lays them out, with
 * and without the other view's inset, and must keep the lesson's own rule:
 * each name in free space, every leader landing on its part, no leader
 * crossing another, the drum or a stick.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R_ = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const L = 'file:///' + process.cwd().replace(/\\/g, '/') + '/src/screens/lab/';
const imp = async (p: string) => R_(await import(L + p));

const DEG = 180 / Math.PI;
type P3 = { x: number; y: number; z: number };
type P2 = { x: number; y: number };
const d3 = (a: P3, b: P3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const d2 = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
const src = (p: string) => readFileSync('src/screens/lab/' + p, 'utf8').replace(/\r\n/g, '\n');

/* ═══════════════ the concert snare (M07b) ═══════════════ */

const CSN_G = await imp('miking/lessons/m07bConcertSnare/geometry.ts');
const CSN_M = await imp('miking/lessons/m07bConcertSnare/model.ts');
const CSN_A = await imp('miking/lessons/m07bConcertSnare/art.tsx');
const { sdf } = await imp('miking/engine/geometry/sdf.ts');
const { lessonById } = await imp('miking/data/lessons.ts');
const { lessonArt } = await imp('miking/data/lessonArt.ts');
const { fitXform } = await imp('miking/engine/geometry/frame.ts');
const { viewsOf } = await imp('miking/engine/model/types.ts');
const { sceneFrame } = await imp('miking/engine/geometry/contentFrame.ts');
const { layoutArtLabels } = await imp('miking/engine/scene/artLabels.ts');
const { labelRect, leaderLine, segsCross } = await imp('miking/engine/scene/labelLayout.ts');

describe('M07b concert snare: matched grip, one stick at the stroke, one raised', () => {
  const S = CSN_G.CSN_STICK;
  const [stroke, raised] = CSN_G.CSN_STICKS as P3[] & { butt: P3; hand: P3; bead: P3 }[];
  const rest = CSN_G.csnStick(1, -S.strokeDeg);
  const head = 0; // the batter head plane, y (up is −y)
  it('a 16 in (406 mm) stick, held about a third of the way up from the butt', () => {
    for (const s of [stroke, raised]) {
      assert.ok(near(d3(s.butt, s.bead), 406, 0.5), `stick ${d3(s.butt, s.bead).toFixed(1)} mm`);
      assert.ok(d3(s.butt, s.hand) >= 100 && d3(s.butt, s.hand) <= 135, `butt behind the hand ${d3(s.butt, s.hand).toFixed(0)}`);
      assert.ok(d3(s.hand, s.bead) >= 270 && d3(s.hand, s.bead) <= 300, `hand to bead ${d3(s.hand, s.bead).toFixed(0)}`);
    }
  });
  it('the stroke: the bead on the head, the stick 5–20° to it, the hand a few cm above the rim', () => {
    const ang = Math.asin((stroke.bead.y - stroke.butt.y) / d3(stroke.butt, stroke.bead)) * DEG;
    assert.ok(ang >= 5 && ang <= 20, `stroke ${ang.toFixed(1)}°`);
    assert.ok(stroke.bead.y >= head - 8 && stroke.bead.y <= head - 2, 'the bead rests on the head');
    assert.ok(Math.hypot(stroke.bead.x, stroke.bead.z) < CSN_M.R * 0.5 && stroke.bead.x < 0, 'a little toward the player from the centre');
    const aboveRim = CSN_M.RIM_Y - stroke.hand.y;
    assert.ok(aboveRim >= 20 && aboveRim <= 80, `hand ${aboveRim.toFixed(0)} mm above the rim`);
    // It clears the near rim where it passes over it (the shaft is 7.5 mm round).
    for (let t = 0; t <= 1; t += 0.01) {
      const p = { x: stroke.butt.x + (stroke.bead.x - stroke.butt.x) * t, y: stroke.butt.y + (stroke.bead.y - stroke.butt.y) * t, z: stroke.butt.z + (stroke.bead.z - stroke.butt.z) * t };
      const r = Math.hypot(p.x, p.z);
      if (r >= CSN_M.R - 6 && r <= CSN_M.HOOP.rOut + 6) assert.ok(p.y + 7.5 < CSN_M.RIM_Y, `over the rim at ${p.y.toFixed(0)}`);
    }
  });
  it('the pair: hands side by side, a 60–90° V from above, the beads a few cm apart', () => {
    assert.ok(Math.abs(stroke.hand.x - raised.hand.x) <= 30 && Math.abs(stroke.hand.y - raised.hand.y) <= 30, 'the raised hand stays beside the other');
    const gap = Math.hypot(stroke.hand.x - raised.hand.x, stroke.hand.z - raised.hand.z);
    assert.ok(gap >= 250 && gap <= 400, `hands ${gap.toFixed(0)} mm apart`);
    const head1 = (s: { hand: P3; bead: P3 }) => Math.atan2(s.bead.z - s.hand.z, s.bead.x - s.hand.x) * DEG;
    const V = Math.abs(head1(stroke) - head1(rest));
    assert.ok(V >= 60 && V <= 90, `V ${V.toFixed(0)}°`);
    const beads = Math.hypot(stroke.bead.x - rest.bead.x, stroke.bead.z - rest.bead.z);
    assert.ok(beads >= 20 && beads <= 60, `beads ${beads.toFixed(0)} mm apart`);
  });
  it('the raised stick turns about its hand: the same hand as its stroke, the tip 20–45° up, above the hand', () => {
    assert.ok(d3(raised.hand, rest.hand) < 1e-6, 'pivot at the hand');
    assert.ok(near(d3(raised.hand, raised.bead), d3(rest.hand, rest.bead), 1e-6));
    const up = Math.asin((raised.hand.y - raised.bead.y) / d3(raised.hand, raised.bead)) * DEG;
    assert.ok(up >= 20 && up <= 45, `tip up ${up.toFixed(0)}°`);
    assert.ok(raised.bead.y < raised.hand.y, 'the tip above the hand');
  });
  it('the side and top views draw the same two sticks, never longer than 406 mm', () => {
    CSN_A.STICKS.side.forEach((s: { grip: P2; head: P2 }, i: number) => {
      const t = CSN_G.CSN_STICKS[i];
      assert.deepEqual([s.grip.x, s.grip.y, s.head.x, s.head.y], [t.butt.x, t.butt.y, t.bead.x, t.bead.y]);
      assert.ok(d2(s.grip, s.head) <= 406 + 1e-6);
    });
    CSN_A.STICKS.top.forEach((s: { grip: P2; head: P2 }, i: number) => {
      const t = CSN_G.CSN_STICKS[i];
      assert.deepEqual([s.grip.x, s.grip.y, s.head.x, s.head.y], [t.butt.x, t.butt.z, t.bead.x, t.bead.z]);
      assert.ok(d2(s.grip, s.head) <= 406 + 1e-6);
    });
  });
  it('the sticks lie inside the keep-outs (the sticks’ reach, the forearms, the player); no starting point near them', () => {
    const l = lessonById('M07b');
    const envs = l.model.envelopes.filter((e: { id: string }) => ['env.sticks', 'env.player', 'env.forearms'].includes(e.id));
    assert.equal(envs.length, 3);
    for (const s of [stroke, raised])
      for (let t = 0; t <= 1; t += 0.05) {
        const p = { x: s.butt.x + (s.bead.x - s.butt.x) * t, y: s.butt.y + (s.bead.y - s.butt.y) * t, z: s.butt.z + (s.bead.z - s.butt.z) * t };
        assert.ok(envs.some((e: { shape: unknown }) => sdf(e.shape, p) <= 1), `(${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}) outside every keep-out`);
      }
    for (const z of l.zones)
      for (const s of [stroke, raised]) {
        const p = z.start.p;
        const ab = { x: s.bead.x - s.butt.x, y: s.bead.y - s.butt.y, z: s.bead.z - s.butt.z };
        const t = Math.max(0, Math.min(1, ((p.x - s.butt.x) * ab.x + (p.y - s.butt.y) * ab.y + (p.z - s.butt.z) * ab.z) / (ab.x ** 2 + ab.y ** 2 + ab.z ** 2)));
        assert.ok(d3(p, { x: s.butt.x + ab.x * t, y: s.butt.y + ab.y * t, z: s.butt.z + ab.z * t }) > 60, `${z.id} start on a stick`);
      }
  });
});

describe('M07b concert snare: the part names at phone width (the parts page, with and without the TOP inset)', () => {
  const l = lessonById('M07b');
  const A = lessonArt('M07b');
  const OWN: Record<string, string[]> = { batter: ['csn.batter'], snareHead: ['csn.snareHead'], snares: ['csn.snaresOn', 'csn.snaresOff'], throw: ['csn.strainer'], stand: ['csn.stand'], rods: ['csn.lugs'] };
  // Glass widths: the 375 pt phone's (the owner's), a 390 pt phone's, the
  // whole 390; heights: the Miking glass on a short phone (200, 250) and on
  // tall ones (274 … 340, glassHeight.ts).
  const sizes: [number, number][] = [];
  for (const w of [356, 370, 390]) for (const h of [200, 250, 274, 292, 304, 329, 340]) sizes.push([w, h]);
  for (const variant of ['on', 'off'])
    for (const view of ['side', 'top'] as const)
      it(`${variant} ${view}`, () => {
        const authored = viewsOf(l.model, variant)[view];
        const box = sceneFrame(l.model, variant, view, false);
        const ob = sceneFrame(l.model, variant, view === 'side' ? 'top' : 'side', false);
        const bad: string[] = [];
        for (const [w, h] of sizes)
          for (const inset of [false, true]) {
            const xf = fitXform(view, box, w, h, 8);
            const iw = Math.round(Math.min(w * 0.27, 150));
            const ih = Math.round(Math.min(h * 0.34, iw / ((ob.u1 - ob.u0) / (ob.v1 - ob.v0))));
            const avoid = inset ? { x0: w - 4 - iw, y0: 2, x1: w - 4, y1: 2 + ih + 14 } : undefined;
            const tagText = l.model.viewTags?.[view] ?? 'SIDE · CUTAWAY';
            const tag = { x0: 0, y0: h - 9 * 1.4 - 4, x1: 8 + tagText.length * (9 * 0.6 + 1.2), y1: h };
            const laid = layoutArtLabels(A, view, variant, authored, xf, 1, w, h, { avoid, obstacles: [tag], minY: 1, model: l.model });
            const at = `${w}×${h}${inset ? ' +inset' : ''}`;
            const want = A.labels(view, variant).length;
            if (laid.length !== want) bad.push(`${at}: ${laid.length} of ${want} names`);
            const mm = (x: number, y: number) => ({ u: (x - xf.ox) / xf.s, v: (y - xf.oy) / xf.s });
            const rects = laid.map((q: { id: string }) => ({ l: q, r: labelRect(q, xf, 1, w) }));
            const segs: { id: string; ln: { x1: number; y1: number; x2: number; y2: number } }[] = [];
            for (const { l: q, r } of rects as { l: { id: string; text: string; at?: { u: number; v: number }; leader?: { u: number; v: number } }; r: { x0: number; x1: number; y0: number; y1: number } }[]) {
              for (let i = 0; i <= 8; i++)
                for (let j = 0; j <= 3; j++) {
                  const p = mm(r.x0 + ((r.x1 - r.x0) * i) / 8, r.y0 + ((r.y1 - r.y0) * j) / 3);
                  const hit = A.hitTest(view, variant, p.u, p.v, 0);
                  if (hit) bad.push(`${at}: ${q.text} over ${hit}`);
                  if (CSN_A.concertSnareDrawnAt(view, variant, p.u, p.v, 0)) bad.push(`${at}: ${q.text} over a stick`);
                }
              if (avoid && r.x0 < avoid.x1 && r.x1 > avoid.x0 && r.y0 < avoid.y1 && r.y1 > avoid.y0) bad.push(`${at}: ${q.text} under the inset`);
              const part = q.leader ?? q.at;
              if (part && OWN[q.id] && !OWN[q.id].includes(A.hitTest(view, variant, part.u, part.v, 2))) bad.push(`${at}: ${q.text}'s leader lands on ${A.hitTest(view, variant, part.u, part.v, 2)}`);
              if (part && q.id === 'sticks' && !CSN_A.concertSnareDrawnAt(view, variant, part.u, part.v, 0)) bad.push(`${at}: STICKS' leader off the sticks`);
              if (q.leader) {
                const ln = leaderLine(r, xf, q.leader);
                if (ln) segs.push({ id: q.id, ln });
              }
            }
            // No two names overlap (the layout's own allowance: 2 pt across, 1 pt down).
            for (let i = 0; i < rects.length; i++)
              for (let j = i + 1; j < rects.length; j++) {
                const a = rects[i].r;
                const b = rects[j].r;
                if (a.x0 < b.x1 - 2 && a.x1 > b.x0 + 2 && a.y0 < b.y1 - 1 && a.y1 > b.y0 + 1) bad.push(`${at}: ${rects[i].l.text} over ${rects[j].l.text}`);
              }
            const sticks = (view === 'top' ? CSN_A.STICKS.top : CSN_A.STICKS.side).map((s: { grip: P2; head: P2 }) => ({ x1: xf.ox + s.grip.x * xf.s, y1: xf.oy + s.grip.y * xf.s, x2: xf.ox + s.head.x * xf.s, y2: xf.oy + s.head.y * xf.s }));
            for (let i = 0; i < segs.length; i++) {
              const { id, ln } = segs[i];
              for (let j = i + 1; j < segs.length; j++) if (segsCross(ln, segs[j].ln)) bad.push(`${at}: leaders ${id} × ${segs[j].id}`);
              if (id !== 'sticks' && sticks.some((s: typeof ln) => segsCross(s, ln))) bad.push(`${at}: ${id}'s leader crosses a stick`);
              for (const { l: q, r } of rects as { l: { id: string; text: string }; r: { x0: number; x1: number; y0: number; y1: number } }[])
                if (q.id !== id)
                  for (let k = 0; k <= 40; k++) {
                    const x = ln.x1 + ((ln.x2 - ln.x1) * k) / 40;
                    const y = ln.y1 + ((ln.y2 - ln.y1) * k) / 40;
                    if (x > r.x0 + 1 && x < r.x1 - 1 && y > r.y0 + 1 && y < r.y1 - 1) {
                      bad.push(`${at}: ${id}'s leader through ${q.text}`);
                      break;
                    }
                  }
              if (view === 'side') {
                // …and never through the drum: beyond its last 8 pt at the part.
                const len = Math.hypot(ln.x2 - ln.x1, ln.y2 - ln.y1);
                for (let k = 0; k <= 60; k++) {
                  if ((len * k) / 60 < 8) continue;
                  const p = mm(ln.x1 + ((ln.x2 - ln.x1) * k) / 60, ln.y1 + ((ln.y2 - ln.y1) * k) / 60);
                  if (Math.abs(p.u) < CSN_M.R - 6 && p.v > 6 && p.v < CSN_M.D - 6) {
                    bad.push(`${at}: ${id}'s leader crosses the drum`);
                    break;
                  }
                }
              }
            }
          }
        assert.deepEqual([...new Set(bad)], []);
      });
});

/* ═══════════════ the timpani (M06) ═══════════════ */

const TP = await imp('miking/lessons/m06Timpani/malletPose.ts');
const TP_M = await imp('miking/lessons/m06Timpani/model.ts');
const TP_A = await imp('miking/lessons/m06Timpani/art.tsx');
const TP_S = await imp('miking/lessons/m06Timpani/soundArt.tsx');
const { BODY } = await imp('miking/lessons/shared/players/playerPose.ts');
const { METAL_ARM } = await imp('miking/lessons/shared/metal/metalFigure.ts');

/** The figure standard for a standing pose (figureAnatomy's canon, the parts
 *  a stick pose can break): bones of adult length, the hand within reach,
 *  the wrist bent ≤ 45°, no hand in front of the pelvis (side view). */
function poseIssues(pose: { view: string; shoulderR: { u: number; v: number }; shoulderL: { u: number; v: number }; elbowR: { u: number; v: number }; elbowL: { u: number; v: number }; handR: { wrist: { u: number; v: number }; dir: number }; handL: { wrist: { u: number; v: number }; dir: number }; hipR: { u: number; v: number }; hipL: { u: number; v: number } }): string[] {
  const out: string[] = [];
  const dd = (a: { u: number; v: number }, b: { u: number; v: number }) => Math.hypot(a.u - b.u, a.v - b.v);
  const hip = { u: (pose.hipR.u + pose.hipL.u) / 2, v: (pose.hipR.v + pose.hipL.v) / 2 };
  for (const [s, sh, el, h] of [['R', pose.shoulderR, pose.elbowR, pose.handR], ['L', pose.shoulderL, pose.elbowL, pose.handL]] as const) {
    if (dd(sh, el) > METAL_ARM.upper * 1.15) out.push(`${s} upper arm ${dd(sh, el).toFixed(0)}`);
    if (dd(el, h.wrist) > METAL_ARM.fore * 1.15) out.push(`${s} forearm ${dd(el, h.wrist).toFixed(0)}`);
    if (dd(sh, h.wrist) > (METAL_ARM.upper + METAL_ARM.fore) * 1.02) out.push(`${s} reach ${dd(sh, h.wrist).toFixed(0)}`);
    if (pose.view !== 'side') continue;
    const fore = Math.atan2(h.wrist.v - el.v, h.wrist.u - el.u);
    const bend = Math.abs(Math.atan2(Math.sin(h.dir - fore), Math.cos(h.dir - fore))) * DEG;
    if (dd(el, h.wrist) > 40 && bend > 45) out.push(`${s} wrist bent ${bend.toFixed(0)}°`);
    const tip = { u: h.wrist.u + Math.cos(h.dir) * BODY.handLen * 0.8, v: h.wrist.v + Math.sin(h.dir) * BODY.handLen * 0.8 };
    for (const [w, q] of [['elbow', el], ['wrist', h.wrist], ['hand', tip]] as const) {
      const fwd = q.u - hip.u;
      if (fwd > 75 && fwd < 340 && q.v > hip.v - 60 && q.v < hip.v + 230) out.push(`${s} ${w} in front of the pelvis`);
    }
  }
  return out;
}

describe('M06 timpani: two real mallets on the 29 in drum, the hands on their grips', () => {
  const [stroke, raised] = TP.TIMP_MALLETS as { butt: P3; hand: P3; ball: P3 }[];
  const D29 = TP_M.TIMPANI.find((t: { id: string }) => t.id === 't29');
  const len = TP.TIMP_MALLET.len;
  it('a timpani mallet’s real length (≈ 35–38 cm with its ball), held near the butt', () => {
    for (const m of [stroke, raised]) {
      assert.ok(near(d3(m.butt, m.ball), len, 0.5));
      assert.ok(len + TP.TIMP_MALLET.ballR >= 350 && len + TP.TIMP_MALLET.ballR <= 380, 'overall');
      assert.ok(near(d3(m.butt, m.hand), TP.TIMP_MALLET.butt, 0.5));
    }
    for (const view of ['side', 'top'] as const) for (const s of TP_A.MALLETS[view]) assert.ok(d2(s.grip, s.head) <= len + 1e-6, `${view} drawn ${d2(s.grip, s.head).toFixed(0)}`);
  });
  it('the ball strikes a hand-width in from the rim nearest the player, never the centre', () => {
    assert.ok(near(stroke.ball.y, TP_M.HEAD_Y - TP.TIMP_MALLET.ballR, 1e-6), 'the ball on the head');
    const inFromRim = TP_M.R29 - Math.hypot(stroke.ball.x - D29.c.x, stroke.ball.z - D29.c.z);
    assert.ok(inFromRim >= 70 && inFromRim <= 120, `${inFromRim.toFixed(0)} mm in from the rim`);
    assert.ok(stroke.ball.x < D29.c.x, 'on the player’s side');
  });
  it('the stroke: the shaft low over the head, the hands low over it (as low as the standing figure reaches)', () => {
    // The standard is a 10–20° shaft with the hands 10–15 cm over the head.
    // A STANDING figure cannot hold its hands that low that far forward
    // without over-reaching or bringing them in front of its pelvis (the
    // figure standard): 18–19 cm and 31° is its limit, held here until the
    // owner chooses a seated timpanist (report 2026-11-22).
    // (owner 2026-11-24, "Raise the hands" and, on the left arm, "look like a broken arm": the stroke hand is where the
    // drummer's palm-side fist takes a straight wrist on a relaxed arm — the playing standard itself, 20° and 12 cm;
    // the RAISED hand is lifted with its forearm to elbow height: malletPose.ts RAISED_HANDS)
    // (owner 2026-11-24, "Palm mallet passes", then "Accept 41°" when shown the numbers: the stroke hand now carries the approved palm-side
    // mallet hand — a straight wrist, the shaft 15° below the forearm. From this standing figure's shoulder the lowest
    // grip that drawing sits on with a straight wrist is 41° / 22 cm (malletGripFor; lower grips need a 9–50° bent
    // wrist or leave the arm's reach: test/figureV2MalletPlaced_20261124.test.ts) — steeper and higher than the
    // 10–20° / 10–15 cm standard above. Held here at what it is, not widened further.)
    const ang = Math.asin((stroke.ball.y - stroke.hand.y) / d3(stroke.hand, stroke.ball)) * DEG;
    assert.ok(ang >= 10 && ang <= 42, `stroke ${ang.toFixed(1)}°`);
    const above = TP_M.HEAD_Y - stroke.hand.y;
    assert.ok(above >= 100 && above <= 225, `stroke hand ${above.toFixed(0)} mm over the head`);
    const lifted = TP_M.HEAD_Y - raised.hand.y;
    assert.ok(lifted >= 350 && lifted <= 450, `raised hand ${lifted.toFixed(0)} mm over the head (at elbow height)`);
  });
  it('the pair: hands about shoulder width apart, the mallets slightly converging', () => {
    const gap = Math.hypot(stroke.hand.x - raised.hand.x, stroke.hand.z - raised.hand.z);
    assert.ok(gap >= 250 && gap <= 400, `hands ${gap.toFixed(0)} mm apart`);
    const hd = (m: { hand: P3; ball: P3 }) => Math.atan2(m.ball.z - m.hand.z, m.ball.x - m.hand.x) * DEG;
    const V = hd(stroke) - hd(raised);
    assert.ok(V >= 0 && V <= 45, `V ${V.toFixed(0)}° (converging)`);
  });
  it('the raised mallet: its ball where the raise put it (25° up about the old hand), the same reach; the hand lifted with the forearm', () => {
    const low = TP.TIMP_MALLETS_LOW[1] as { hand: P3; ball: P3 };
    const up = Math.asin((low.hand.y - low.ball.y) / d3(low.hand, low.ball)) * DEG;
    assert.ok(near(up, TP.TIMP_MALLET.raisedDeg, 1e-6));
    assert.deepEqual(raised.ball, low.ball, 'the ball unchanged');
    assert.ok(near(d3(raised.hand, raised.ball), d3(stroke.hand, stroke.ball), 1e-6));
    // (owner 2026-11-24: the whole forearm lifted — the shaft now runs gently DOWN from the hand to the raised ball)
    const down = Math.asin((raised.ball.y - raised.hand.y) / d3(raised.hand, raised.ball)) * DEG;
    assert.ok(down > 0 && down < 25, `shaft ${down.toFixed(1)}° down from the lifted hand`);
  });
  it('the side and top views draw the same mallets; the sound page draws the stroke’s mallet', () => {
    TP.TIMP_MALLETS.forEach((m: { butt: P3; ball: P3 }, i: number) => {
      assert.deepEqual([TP_A.MALLETS.side[i].grip, TP_A.MALLETS.side[i].head], [{ x: m.butt.x, y: m.butt.y }, { x: m.ball.x, y: m.ball.y }]);
      assert.deepEqual([TP_A.MALLETS.top[i].grip, TP_A.MALLETS.top[i].head], [{ x: m.butt.x, y: m.butt.z }, { x: m.ball.x, y: m.ball.z }]);
    });
    const s = TP_S.MALLET;
    const a = TP_A.MALLETS.side[0];
    assert.ok(near(d2(s.grip, s.head), d2(a.grip, a.head), 1e-6));
    assert.ok(near(Math.atan2(s.head.y - s.grip.y, s.head.x - s.grip.x), Math.atan2(a.head.y - a.grip.y, a.head.x - a.grip.x), 1e-9));
  });
  it('the timpanist’s fists close on the grips; the figure keeps its standard', () => {
    const side = TP_A.SIDE_POSE;
    const fist = (h: { wrist: { u: number; v: number }; dir: number }) => ({ u: h.wrist.u + Math.cos(h.dir) * 70, v: h.wrist.v + Math.sin(h.dir) * 70 });
    for (const [h, m] of [[side.handL, stroke], [side.handR, raised]] as const) {
      const f = fist(h);
      assert.ok(Math.hypot(f.u + TP.PLAYER_SHIFT - m.hand.x, f.v - m.hand.y) <= 15, 'the fist on the grip (side)');
    }
    // (2026-11-24: with the stand-in palm-side fist the stroke hand sat 12 cm over the head, at hip height in front of
    // the hip, and the "no hand in front of the pelvis" check was allowed for it. With the approved palm-side mallet
    // hand the stroke hand is 10 cm higher and clear of the pelvis: the allowance is dropped.)
    assert.deepEqual(poseIssues(side), []);
    assert.deepEqual(poseIssues(TP_A.TOP_POSE), []);
  });
  it('the hands are inside a keep-out; no starting point sits on a mallet or a hand', () => {
    const l = lessonById('M06');
    for (const variant of ['two', 'four']) {
      const envs = l.model.envelopes.filter((e: { variants?: string[] }) => !e.variants || e.variants.includes(variant));
      for (const m of [stroke, raised]) assert.ok(envs.some((e: { shape: unknown }) => sdf(e.shape, m.hand) <= 0), `${variant}: a hand outside every keep-out`);
    }
    for (const z of l.zones)
      for (const m of [stroke, raised]) {
        const p = z.start.p;
        for (let t = 0; t <= 1; t += 0.05) {
          const q = { x: m.butt.x + (m.ball.x - m.butt.x) * t, y: m.butt.y + (m.ball.y - m.butt.y) * t, z: m.butt.z + (m.ball.z - m.butt.z) * t };
          assert.ok(d3(p, q) > 80, `${z.id} start on a mallet`);
        }
      }
  });
});

/* ═══════════════ the kick pedal (M01, and the drum-tuning lab's kick) ═══════════════ */

const K = await imp('miking/lessons/m01Kick/geometry.ts');
const DT = await imp('drumtuning/stagesDrum.tsx');

describe('kick beaters: the shaft nearly parallel to the head at the strike, the face flat on it', () => {
  it('M01: the shaft ≤ 10° off the head plane; the face on the head; a real pedal’s length and axle height', () => {
    const b = K.KICK_GEOM.beater;
    const off = Math.abs(90 - Math.abs(b.strikeAngle * DEG));
    assert.ok(off <= 10, `${off.toFixed(1)}° off the head plane`);
    const h = K.KICK_ANCHORS['pedal.beater.headAtStrike'];
    assert.ok(near(h.x + b.headR, 0, 1e-9), 'the felt face on the head');
    const p = K.KICK_GEOM.pedal;
    assert.ok(p.x1 - p.x0 >= 300 && p.x1 - p.x0 <= 400, `pedal ${(p.x1 - p.x0).toFixed(0)} mm`);
    const axleUp = K.KICK_GEOM.yFloor - b.axle.y;
    assert.ok(axleUp >= 90 && axleUp <= 200, `axle ${axleUp.toFixed(0)} mm off the floor`);
    assert.ok(b.axle.x < K.KICK_GEOM.hoopX.batter[0] - 30, 'the axle (and its frame) behind the batter hoop');
  });
  it('the drum-tuning kick: the shaft ≤ 10° off the head plane, from its own axle', () => {
    assert.ok(DT.KICK_SHAFT_DEG <= 10);
    const bc = { x: 200, y: 90 };
    const ax = DT.kickAxleX(bc, 16, 128);
    assert.ok(near(Math.atan2(ax - bc.x, 128 - (bc.y + 8 - 1)) * DEG, DT.KICK_SHAFT_DEG, 1e-9));
    assert.match(src('drumtuning/stagesDrum.tsx'), /const ax = kickAxleX\(bc, bh, ay\);/);
  });
});

/* ═══════════════ the drum-tuning lab's sticks ═══════════════ */

describe('drum-tuning sticks', () => {
  it('the tom anatomy: the stick 10–20° to the head', () => {
    assert.ok(DT.ANAT_STICK_DEG >= 10 && DT.ANAT_STICK_DEG <= 20);
    assert.match(src('drumtuning/stagesDrum.tsx'), /<StickSvg x=\{x1 - 44\} y=\{yT - 3\} deg=\{-ANAT_STICK_DEG\}/);
  });
  it('the snare: the stroke height lifts the tip while the grip end stays put; a ghost note rests on the head', () => {
    const k = 240 / 355.6;
    const s0 = DT.snareStick(0);
    let lastY = Infinity;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const s = DT.snareStick(t);
      assert.ok(near(s.grip[0], s0.grip[0], 1e-9) && near(s.grip[1], s0.grip[1], 1e-9), `the grip end moved at ${t}`);
      assert.ok(near(Math.hypot(s.grip[0] - s.bead[0], s.grip[1] - s.bead[1]), s.len, 1e-9));
      assert.ok(s.bead[1] < lastY, `the tip lifts at ${t}`);
      lastY = s.bead[1];
      assert.ok(s.len / k <= 406, 'never longer than a 406 mm stick');
    }
    const ang0 = Math.atan2(s0.bead[1] - s0.grip[1], s0.grip[0] - s0.bead[0]) * DEG;
    assert.ok(ang0 >= 5 && ang0 <= 20, `ghost-note stick ${ang0.toFixed(0)}° to the head`);
    assert.ok(DT.snareStick(1).bead[1] < s0.bead[1] - 25, 'a rimshot starts high');
    assert.ok(DT.snareStick(1).bead[1] > 0, 'on the picture');
  });
});

/* ═══════════════ the mallet keyboards (I07–I10) ═══════════════ */

const MA = await imp('miking/lessons/shared/mallets/MalletArt.tsx');
const MS = await imp('miking/lessons/shared/mallets/MalletSound.tsx');
const MM = await imp('miking/lessons/shared/mallets/malletModel.ts');
const { metalFrontPose } = await imp('miking/lessons/shared/metal/metalFigure.ts');
const { NODE_FRAC } = await imp('miking/lessons/shared/mallets/malletSpec.ts');

const FAMS: [string, string][] = [['I07', 'i07Vibraphone'], ['I08', 'i08Marimba'], ['I09', 'i09Xylophone'], ['I10', 'i10Glockenspiel']];
describe('mallet keyboards: two mallets from the player’s side, low over the bars', () => {
  for (const [id, dir] of FAMS)
    it(id, async () => {
      const mod = await imp(`miking/lessons/${dir}/model.ts`);
      const fam = Object.values(mod).find((v) => !!v && typeof v === 'object' && (v as { variants?: { row?: unknown }[] }).variants?.[0]?.row) as { variants: { row: { id: string; inst: string; malletH: { mm: number } } }[] };
      const G = MM.malletGeom(fam);
      for (const v of fam.variants) {
        const L = G.layouts[v.row.id];
        const yF = G.floor[v.row.id];
        const inst = L.row.inst;
        const r = MA.malletHeadR(inst);
        const real = MA.MALLET_REAL[inst];
        const at = `${id} ${v.row.id}`;
        const [a, b] = MA.malletPoses(L);
        for (const m of [a, b]) {
          // Drawn from just behind the fist to the head: never longer than the real mallet.
          const front = Math.hypot(m.head.x - m.hand.x, m.head.y - m.hand.y) + MA.MALLET_BUTT + r;
          const top = Math.hypot(m.head.x - m.hand.x, m.head.z - m.hand.z) + MA.MALLET_BUTT + r;
          assert.ok(front <= real + 1e-6 && top <= real + 1e-6, `${at}: drawn ${front.toFixed(0)} / ${top.toFixed(0)} > ${real}`);
          assert.ok(near(d3(m.hand, m.head), real - MA.MALLET_BUTT - r, 1e-6), `${at}: the mallet’s length`);
          // Its stroke: on a natural bar's centre, well clear of the cords' still points.
          assert.ok(L.naturals.includes(m.bar), `${at}: a natural bar`);
          assert.ok(near(m.strike.z, m.bar.z, 1e-9) && near(m.strike.x, m.bar.x, 1e-9) && near(m.strike.y, m.bar.yTop - r, 1e-9), `${at}: the bar’s centre`);
          for (const f of [NODE_FRAC, 1 - NODE_FRAC]) assert.ok(Math.abs(m.strike.z - (m.bar.z - m.bar.L / 2 + f * m.bar.L)) >= 0.2 * m.bar.L, `${at}: on a node`);
          const strokeDeg = Math.asin((m.strike.y - m.hand.y) / d3(m.hand, m.strike)) * DEG;
          assert.ok(strokeDeg >= 15 && strokeDeg <= 30, `${at}: ${strokeDeg.toFixed(0)}° to the bars`);
          assert.ok(m.hand.z < m.strike.z, `${at}: from the player’s side`);
        }
        assert.ok(near(a.head.y, a.strike.y, 1e-9), `${at}: the stroke’s head on its bar`);
        // The raised mallet: its head above its hand, turned about the hand, inside the mallets' travel.
        assert.ok(b.head.y < b.hand.y - 50, `${at}: the raised head above its hand`);
        assert.ok(near(d3(b.hand, b.head), d3(b.hand, b.strike), 1e-6), `${at}: turned about the hand`);
        assert.ok(L.yNat - (b.head.y - r) <= v.row.malletH.mm, `${at}: inside the mallets' travel (malletH)`);
        const gap = Math.abs(a.hand.x - b.hand.x);
        assert.ok(gap >= 300 && gap <= 450, `${at}: hands ${gap.toFixed(0)} apart`);
        // The audience's view: the fists can reach their grips, the figure's arms sound.
        const pose = metalFrontPose([[a.hand.x, a.hand.y - yF], [b.hand.x, b.hand.y - yF]]);
        assert.deepEqual(poseIssues(pose), [], at);
        // From above, the label occupancy covers both mallets.
        const drawn = MA.malletDrawnAt(fam);
        for (const m of [a, b]) assert.ok(drawn('top', v.row.id, (m.hand.x + m.head.x) / 2, (m.hand.z + m.head.z) / 2, 0), `${at}: the drawn mallet keeps the names off`);
        // The one-bar sound page: the same stroke angle, the real length.
        const one = MS.oneBarMallet(inst, r);
        assert.ok(near(Math.hypot(one.du, one.dv) + r, real, 1e-6));
        assert.ok(near(Math.atan2(-one.dv, -one.du) * DEG, MA.MALLET_STROKE_DEG, 1e-9));
      }
    });
});

/* ═══════════════ the triangle (I06a) ═══════════════ */

const TRI_A = await imp('miking/lessons/i06aTriangle/art.tsx');
const TRI_M = await imp('miking/lessons/i06aTriangle/model.ts');
const TRI_G = await imp('miking/lessons/i06aTriangle/geometry.ts');

describe('I06a triangle: one 215 mm beater, the same in every view', () => {
  const real = TRI_M.TRI.beater.mm;
  it('held and mounted: 215 mm in 3D; no view draws it longer', () => {
    for (const bt of [TRI_A.HELD_BEATER, TRI_A.MOUNTED_BEATER] as { grip: P3; tip: P3 }[]) {
      assert.ok(near(d3(bt.grip, bt.tip), real, 0.5));
      const views = [
        [bt.grip.x, bt.grip.y, bt.tip.x, bt.tip.y],
        [bt.grip.x, bt.grip.z, bt.tip.x, bt.tip.z],
        [-bt.grip.z, bt.grip.y, -bt.tip.z, bt.tip.y],
      ];
      for (const [x1, y1, x2, y2] of views) assert.ok(Math.hypot(x2 - x1, y2 - y1) <= real + 1e-6);
    }
  });
  it('the held tip on the base’s middle, the mounted tips on the lower sides', () => {
    const h = TRI_A.HELD_BEATER;
    assert.ok(near(h.tip.y, TRI_G.BASE_Y, 1e-9) && Math.abs(h.tip.z) <= TRI_M.SIDE / 2);
    assert.ok(h.grip.z > 0 && h.grip.y > h.tip.y, 'from the right hand, below');
    const m = TRI_A.MOUNTED_BEATER;
    const lo = TRI_M.MOUNTED.top;
    const y = lo[1] + ((lo[0] - Math.abs(m.tip.z)) / lo[0]) * (TRI_M.MOUNTED.open[1] - lo[1]);
    assert.ok(near(m.tip.y, y, 1e-6), 'on the lower side');
  });
  it('the front view draws the same beaters (and two when mounted)', () => {
    const h = TRI_A.HELD_BEATER;
    assert.deepEqual(TRI_A.HELD_GRIP, [-h.grip.z, h.grip.y]);
    assert.deepEqual(TRI_A.HELD_TIP, [-h.tip.z, h.tip.y]);
    assert.equal(TRI_A.MOUNTED_BEATERS.length, 2);
    assert.deepEqual(TRI_A.MOUNTED_BEATERS[0], [[-TRI_A.MOUNTED_BEATER.grip.z, TRI_A.MOUNTED_BEATER.grip.y], [-TRI_A.MOUNTED_BEATER.tip.z, TRI_A.MOUNTED_BEATER.tip.y]]);
    const art = src('miking/lessons/i06aTriangle/art.tsx');
    assert.match(art, /<Beater a=\{strikeHand\} b=\{sideOf\(HELD_BEATER\.tip\)\} \/>/);
    assert.match(art, /<Beater a=\{strikeHand\} b=\{topOf\(HELD_BEATER\.tip\)\} \/>/);
  });
});

/* ═══════════════ the claves (I05b) and the mounted tambourine (I04) ═══════════════ */

const CLV = await imp('miking/lessons/i05bClaves/model.ts');
const TMB = await imp('miking/lessons/i04Tambourine/model.ts');

describe('I05b claves: the striker reaches the clave it strikes', () => {
  for (const id of ['solid', 'hollow'] as const)
    it(id, () => {
      const s = CLV.STATES[id];
      assert.ok(near(d3(s.striker.a, s.striker.b), CLV.CL, 1e-6), 'one whole clave');
      // Its end meets the supported clave (axis along z): the two surfaces touch.
      const gap = Math.hypot(s.striker.b.x - s.rest.x, s.striker.b.y - s.rest.y) - 2 * CLV.CR;
      assert.ok(gap >= -1 && gap <= 4, `${gap.toFixed(1)} mm between the claves`);
      assert.ok(Math.abs(s.striker.b.z - s.rest.z) <= CLV.CL / 4, 'on the middle of the supported clave');
      assert.ok(near(d3(s.striker.a, s.strike.G), 45, 1), 'held near its back end');
    });
});

describe('I04 mounted tambourine: the stick held like a drum stick', () => {
  it('406 mm, the hand a quarter to a third up from the butt, 15–30° to the head', () => {
    const st = TMB.STATES.mounted.stick;
    assert.ok(near(d3(st.butt, st.b), TMB.STICK_LEN, 1e-6));
    const f = d3(st.butt, st.a) / TMB.STICK_LEN;
    assert.ok(f >= 0.25 && f <= 0.34, `hand at ${(f * 100).toFixed(0)} %`);
    const ang = Math.asin((st.b.y - st.butt.y) / d3(st.butt, st.b)) * DEG;
    assert.ok(ang >= 15 && ang <= 30, `${ang.toFixed(0)}° to the head`);
    assert.ok(near(d3(st.a, TMB.STATES.mounted.grip), 0, 1e-9), 'the hand on the stick');
  });
});
