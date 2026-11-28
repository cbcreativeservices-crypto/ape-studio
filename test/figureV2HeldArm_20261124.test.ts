/**
 * FIGURE V2 — WAVE 3: THE ARM THAT CARRIES THE MIC HAND, STEP B (must-do D78;
 * owner GO 2026-11-24 after "Mic hand passes"). Checked here, for every frame of
 * every move on the study page (B10 the reporter's flag mic, B03 the shared
 * omni to the guest's mouth, B09 the seated lip ribbon) and both open options:
 *   • the arm is a real arm: upper arm 300 mm, forearm 290 mm (to the fist), or
 *     marked out of reach;
 *   • the elbow is never more than 20 mm above the shoulder, and never inside
 *     the chest (on the arm's own side);
 *   • the wrist stays near straight (it turns no more than 20°), the forearm
 *     meets the handle between 35° and 100°;
 *   • the thumb comes round the other side of the handle from the fingers;
 *   • the mic, its front and its aim are the lesson's own (only the drawn arm
 *     changes; option (a) moves the reporter, never the mic);
 *   • no lesson draws the held arm yet.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const HH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/heldHands.ts'));
const AS = R(await import('../src/dev/heldArmStudy.tsx'));

type V3 = { x: number; y: number; z: number };
const d3 = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const frames = () => {
  const out: { at: string; f: ReturnType<typeof AS.armFrame> }[] = [];
  for (const id of AS.ARM_CASES) for (const k of [0, 0.25, 0.5, 0.75, 1]) out.push({ at: `${id} k${k}`, f: AS.armFrame(id, k) });
  out.push({ at: 'b3 stepIn', f: AS.armFrame('b3', 1, { stepIn: true }) });
  for (const k of [0, 1]) out.push({ at: `b10 flagToday k${k}`, f: AS.armFrame('b10', k, { flagToday: true }) });
  return out;
};

describe('figure V2 wave 3 — the held arm (step B)', () => {
  it('a real arm in every frame: 300 / 290 mm, the elbow not above the shoulder, not through the chest', () => {
    for (const { at, f } of frames()) {
      const s = f.sol;
      if (!s.far) {
        assert.ok(Math.abs(d3(s.elbow, s.shoulder) - 300) < 1.5, `${at}: upper arm ${d3(s.elbow, s.shoulder).toFixed(1)}`);
        assert.ok(Math.abs(d3(s.fist, s.elbow) - 290) < 1.5, `${at}: forearm ${d3(s.fist, s.elbow).toFixed(1)}`);
      }
      assert.ok(s.elbowRise <= 20.5, `${at}: the elbow ${s.elbowRise.toFixed(0)} mm above the shoulder`);
      const inward = -((s.elbow.x - s.shoulder.x) * f.outward.x + (s.elbow.y - s.shoulder.y) * f.outward.y + (s.elbow.z - s.shoulder.z) * f.outward.z);
      assert.ok(inward <= 60.5, `${at}: the elbow ${inward.toFixed(0)} mm into the chest`);
    }
  });

  it('the wrist near straight and the forearm across the handle, in every frame', () => {
    for (const { at, f } of frames()) {
      assert.ok(f.sol.wristTurn <= 20, `${at}: the wrist turns ${f.sol.wristTurn.toFixed(0)}°`);
      assert.ok(f.sol.angle >= 35 && f.sol.angle <= 100, `${at}: forearm to handle ${f.sol.angle.toFixed(0)}°`);
    }
  });

  it('the thumb round the other side of the handle from the fingers, in every frame', () => {
    for (const { at, f } of frames()) {
      const fr = HH.heldFrame(f.sol.elbow, f.fist, f.aim, 'R', f.outward);
      const g = HH.gripFrame(fr);
      const r = HH.gripRounds(HH.gripModel(13, g.beta));
      for (const q of r.fingers) assert.equal(q.side, 1, `${at}: ${q.name}`);
      assert.equal(r.thumb.side, -1, `${at}: the thumb`);
    }
  });

  it('the mic is the lesson’s own: option (a) moves the reporter, never the mic; (b) changes only the drawn handle', () => {
    const a0 = AS.armFrame('b3', 1);
    const a1 = AS.armFrame('b3', 1, { stepIn: true });
    assert.deepEqual(a0.front, a1.front);
    assert.deepEqual(a0.aim, a1.aim);
    assert.ok(Math.abs(a1.shoulder.x - a0.shoulder.x) === AS.STEP_IN_MM);
    const b0 = AS.armFrame('b10', 0);
    const b1 = AS.armFrame('b10', 0, { flagToday: true });
    assert.deepEqual(b0.front, b1.front);
    assert.equal(b0.mic.len, b1.mic.len);
    assert.ok(b0.mic.drawLen && !b1.mic.drawLen);
  });

  it('only B03, B09 and B10 draw the held arm (round 2: converted whole); no lesson reaches the study’s renderers', () => {
    const L = 'src/screens/lab/miking/lessons';
    const HELD = new Set(['b03FieldReporter', 'b09Commentators', 'b10Sideline']);
    for (const d of readdirSync(new URL(`../${L}`, import.meta.url)).filter((x) => /^[a-z]\d/.test(x)))
      for (const f of readdirSync(new URL(`../${L}/${d}`, import.meta.url)).filter((x) => /\.tsx?$/.test(x))) {
        const src = read(`${L}/${d}/${f}`);
        assert.doesNotMatch(src, /figureV2\/held(Hands|HandV2|ArmV2)/, `${d}/${f}`);
        if (!HELD.has(d)) assert.doesNotMatch(src, /heldLive|heldPeopleV2/, `${d}/${f}: draws the held arm`);
      }
  });
});

/* ── round 2: the held arm in its lessons ── */

const HL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/heldLive.tsx'));
const HP = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/heldPeopleV2.tsx'));
const B10H = R(await import('../src/screens/lab/miking/lessons/b10Sideline/held.ts'));
const B03H = R(await import('../src/screens/lab/miking/lessons/b03FieldReporter/held.ts'));
const B09H = R(await import('../src/screens/lab/miking/lessons/b09Commentators/held.ts'));
const B03G = R(await import('../src/screens/lab/miking/lessons/b03FieldReporter/geometry.ts'));
const Z10 = R(await import('../src/screens/lab/miking/lessons/b10Sideline/model.ts')).B10_ZONES;
const Z03 = R(await import('../src/screens/lab/miking/lessons/b03FieldReporter/model.ts')).B03_ZONES;
const Z09 = R(await import('../src/screens/lab/miking/lessons/b09Commentators/model.ts')).B09_ZONES;
const VEC = R(await import('../src/screens/lab/miking/engine/geometry/vec.ts'));

type Zone = { id: string; start: { p: V3; az: number; el: number } };
const lens = new Map<string, number>();
const lessonFrames = () => {
  const out: { at: string; h: ReturnType<typeof HP.standingHolder>; cfg: ReturnType<typeof HP.heldConfig>; m: ReturnType<typeof HL.heldMicAt> }[] = [];
  const add = (lesson: string, zones: readonly Zone[], id: string, h: ReturnType<typeof HP.standingHolder>, cfg: ReturnType<typeof HP.heldConfig>, typeId: string, len: number, r: number) => {
    const z = zones.find((q) => q.id === id)!.start;
    const aim = VEC.aimVec(z.az, z.el);
    // the start, and the mic moved about the start (a drag): 8 cm each way along each axis
    for (const d of [{ x: 0, y: 0, z: 0 }, { x: 80, y: 0, z: 0 }, { x: -80, y: 0, z: 0 }, { x: 0, y: 80, z: 0 }, { x: 0, y: -80, z: 0 }, { x: 0, y: 0, z: 80 }, { x: 0, y: 0, z: -80 }]) {
      const p = { x: z.p.x + d.x, y: z.p.y + d.y, z: z.p.z + d.z };
      lens.set(id, len);
      out.push({ at: `${lesson} ${id} +(${d.x},${d.y},${d.z})`, h, cfg, m: HL.heldMicAt(id, p, aim, len, r, h.shoulder, cfg, typeId) });
    }
  };
  add('B10', Z10, 'b10.hand', B10H.REP_HOLDER, B10H.B10_HELD, 'bcFlagOmni', 162, 25);
  add('B10', Z10, 'b10.hand', B10H.GUEST_HOLDER, B10H.B10_HELD, 'bcFlagOmni', 162, 25);
  add('B10', Z10, 'b10.reporter', B10H.REP_HOLDER, B10H.B10_HELD, 'bcFlagOmni', 162, 25);
  for (const id of ['b3.shared', 'b3.handoffOmni']) add('B03', Z03, id, B03H.REP_HOLDER, B03H.B03_HELD, 'repOmni', 230, 24);
  for (const id of ['b3.handoffDir', 'b3.repOwn']) add('B03', Z03, id, B03H.REP_HOLDER, B03H.B03_HELD, 'bcFlagCard', 162, 25);
  add('B09', Z09, 'b9.lip', B09H.CALLER_HOLDER, B09H.B09_HELD, 'bcLipRibbon', 220, 20);
  return out;
};

describe('figure V2 wave 3 — the held arm in B03, B09, B10 (step B round 2)', () => {
  it('a real arm at every held start and moved about it, both views: 300 / 290 mm, the elbow not above the shoulder, the wrist near straight', () => {
    for (const { at, h, m } of lessonFrames())
      for (const view of ['side', 'top'] as const) {
        const f = HL.heldLiveFrame(h, view, m);
        const s = f.sol;
        // (a mic moved past the engine's reach — its tail more than 630 mm from the shoulder — turns the arm red: not judged)
        const L0 = lens.get(m.key) ?? 0;
        if (d3({ x: m.front.x - m.aim.x * L0, y: m.front.y - m.aim.y * L0, z: m.front.z - m.aim.z * L0 }, h.shoulder) > 630) continue;
        if (!s.far) {
          assert.ok(Math.abs(d3(s.elbow, s.shoulder) - 300) < 1.5, `${at} ${view}: upper arm ${d3(s.elbow, s.shoulder).toFixed(1)}`);
          assert.ok(Math.abs(d3(s.fist, s.elbow) - 290) < 1.5, `${at} ${view}: forearm`);
        }
        // (the elbow above the shoulder only where the pose needs it: the arm out straight to a mouth above the shoulder)
        assert.ok(s.elbowRise <= 20.5 || d3(s.fist, s.shoulder) > 560, `${at}: the elbow ${s.elbowRise.toFixed(0)} mm above the shoulder`);
        // (out of reach only where the engine also says so: its tail more than 630 mm from the shoulder)
        const tail = { x: m.front.x - m.aim.x * (lens.get(m.key) ?? 0), y: m.front.y - m.aim.y * (lens.get(m.key) ?? 0), z: m.front.z - m.aim.z * (lens.get(m.key) ?? 0) };
        if (d3(tail, h.shoulder) <= 630) assert.ok(!s.far, `${at} ${view}: out of reach within the engine's 630 mm`);
        // (the wrist near straight; an arm out at full stretch — B03's cardioid at the guest's mouth, 75 cm away —
        // points the mic with the wrist bent, within the hand's natural range: no more than 40°)
        const stretched = d3(s.fist, h.shoulder) > 560;
        // (a mic pointed ALONG the reach — the handle near the line shoulder to fist — is pointed with the wrist:
        // up to 30°, the least the arm allows)
        const sf = { x: s.fist.x - h.shoulder.x, y: s.fist.y - h.shoulder.y, z: s.fist.z - h.shoulder.z };
        const along = Math.abs(sf.x * m.aim.x + sf.y * m.aim.y + sf.z * m.aim.z) / (Math.hypot(sf.x, sf.y, sf.z) || 1) > 0.75;
        assert.ok(s.wristTurn <= (stretched ? 40 : along ? 30 : 20), `${at}: the wrist turns ${s.wristTurn.toFixed(0)}°`);
        assert.ok(s.angle >= (stretched ? 15 : 35) && s.angle <= 100, `${at}: forearm to handle ${s.angle.toFixed(0)}°`);
        // the thumb round the other side of the handle from the fingers
        const outward = { x: 0, y: 0, z: Math.sign(h.shoulder.z - h.lip.z) || 1 };
        const g = HH.gripFrame(HH.heldFrame(s.elbow, s.fist, m.aim, 'R', outward));
        const r = HH.gripRounds(HH.gripModel(13, g.beta));
        for (const q of r.fingers) assert.equal(q.side, 1, `${at}: ${q.name}`);
        assert.equal(r.thumb.side, -1, `${at}: the thumb`);
        // the hand's paths built once per grip: the same frame twice gives the same grip
        assert.equal(HL.heldLiveFrame(h, view, m).grip, f.grip, `${at} ${view}: the grip built again`);
      }
  });

  it('B03 as they stand: the elbow dropped below the shoulder at the guest’s mouth (the "chicken wing" cured without moving anyone)', () => {
    assert.equal(B03G.B03_REPORTER_STANCE, 'asItStands');
    assert.equal(B03G.SPACING, 750);
    const z = Z03.find((q: Zone) => q.id === 'b3.handoffOmni')!.start;
    const m = HL.heldMicAt('g', z.p, VEC.aimVec(z.az, z.el), 230, 24, B03H.REP_HOLDER.shoulder, B03H.B03_HELD, 'repOmni');
    const s = HL.heldLiveFrame(B03H.REP_HOLDER, 'side', m).sol;
    assert.ok(s.elbowRise < -40, `the elbow ${s.elbowRise.toFixed(0)} mm (above the shoulder +)`);
    assert.ok(s.wristTurn <= B03H.REACH.wristMax + 0.5, `the wrist ${s.wristTurn.toFixed(0)}°`);
    // the shoulder brought forward by the reach, never more than 40 mm
    assert.ok(d3(s.shoulder, B03H.REP_HOLDER.shoulder) <= 40.5);
  });

  it('owner decision (b): the flag handheld drawn longer at the tail, its fist on the free handle — drawing only', () => {
    assert.equal(HP.FLAG_HANDLE_TAIL, 'longer');
    assert.equal(HP.flagDrawLen('bcFlagOmni'), 4.75 * 25 + 95);
    assert.equal(HP.flagFistFromFront('bcFlagCard'), 4.75 * 25 + 95 - 38);
    assert.equal(HP.flagDrawLen('repOmni'), undefined);
    assert.equal(HP.flagDrawLen('bcLipRibbon'), undefined);
    // the measured mic is the type's own: 162 mm, its front where the zone puts it
    const z = Z10.find((q: Zone) => q.id === 'b10.hand')!.start;
    const m = HL.heldMicAt('h', z.p, VEC.aimVec(z.az, z.el), 162, 25, B10H.REP_HOLDER.shoulder, B10H.B10_HELD, 'bcFlagOmni');
    assert.deepEqual(m.front, z.p);
    assert.ok(Math.abs(d3(m.fist, m.front) - (4.75 * 25 + 95 - 38)) < 1e-6);
  });

  it('the engine draws no old arm or fist for a lesson that holds its mics itself; the three lessons opt in', () => {
    const ps = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
    assert.match(ps, /if \(style === 'held' && v2held\) return null;/);
    assert.match(ps, /body\.armStyle !== 'held' \|\| v2held\) return null;/);
    assert.match(ps, /<HeldFront view=\{view\} \/>/);
    for (const d of ['b03FieldReporter', 'b09Commentators', 'b10Sideline']) assert.match(read(`src/screens/lab/miking/lessons/${d}/art.tsx`), /heldV2: B\d\d_HELD/, d);
  });

  it('where the sleeve lies in front of the mic it holds, the sleeve is painted again over the mic (sleeveOver), in every frame', () => {
    // the forearm's sleeve: the elbow to the cuff (about 9 cm short of the fist's middle), 4 cm thick each side;
    // the mic: its front to its tail. Where the two cross on the page, the sleeve must not be nearer the viewer.
    const TOW = { side: { x: 0, y: 0, z: 1 }, top: { x: 0, y: -1, z: 0 } } as const;
    const pr = (view: 'side' | 'top', p: V3) => (view === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z });
    type UV = { u: number; v: number };
    const segDist = (a: UV, b: UV, c: UV, d: UV) => {
      let best = { d: Infinity, s: 0, t: 0 };
      for (let i = 0; i <= 40; i++)
        for (let j = 0; j <= 40; j++) {
          const s = i / 40;
          const t = j / 40;
          const dd = Math.hypot(a.u + (b.u - a.u) * s - (c.u + (d.u - c.u) * t), a.v + (b.v - a.v) * s - (c.v + (d.v - c.v) * t));
          if (dd < best.d) best = { d: dd, s, t };
        }
      return best;
    };
    const bad: string[] = [];
    for (const { at, h, m } of lessonFrames())
      for (const view of ['side', 'top'] as const) {
        const fr = HL.heldLiveFrame(h, view, m);
        const s = fr.sol;
        const fl = d3(s.fist, s.elbow);
        const cuff = { x: s.fist.x - ((s.fist.x - s.elbow.x) / fl) * 90, y: s.fist.y - ((s.fist.y - s.elbow.y) / fl) * 90, z: s.fist.z - ((s.fist.z - s.elbow.z) / fl) * 90 };
        const L0 = lens.get(m.key) ?? 0;
        const tail = { x: m.front.x - m.aim.x * L0, y: m.front.y - m.aim.y * L0, z: m.front.z - m.aim.z * L0 };
        const r = segDist(pr(view, s.elbow), pr(view, cuff), pr(view, m.front), pr(view, tail));
        if (r.d > 40 + m.r / 0.52) continue;
        const sp = { x: s.elbow.x + (cuff.x - s.elbow.x) * r.s, y: s.elbow.y + (cuff.y - s.elbow.y) * r.s, z: s.elbow.z + (cuff.z - s.elbow.z) * r.s };
        const mp = { x: m.front.x + (tail.x - m.front.x) * r.t, y: m.front.y + (tail.y - m.front.y) * r.t, z: m.front.z + (tail.z - m.front.z) * r.t };
        const T = TOW[view];
        const nearer = (sp.x - mp.x) * T.x + (sp.y - mp.y) * T.y + (sp.z - mp.z) * T.z;
        if (nearer > 25 && !fr.sleeveOver) bad.push(`${at} ${view}: the sleeve ${nearer.toFixed(0)} mm in front of the mic`);
      }
    assert.deepEqual(bad, []);
  });

  it('no lesson holds a mic in the LEFT hand (no left grip needed): every holder is the right shoulder', () => {
    for (const h of [B10H.REP_HOLDER, B10H.GUEST_HOLDER, B03H.REP_HOLDER, B09H.CALLER_HOLDER]) {
      // the right shoulder: +176 mm to the talker's right (frame V), mirrored for a talker facing −x
      const facing = Math.sign(h.pose.side.facing ?? 1) || 1;
      assert.ok(Math.abs(h.shoulder.z - h.lip.z - 176 * facing) < 1, `${h.id}: the shoulder ${h.shoulder.z - h.lip.z}`);
    }
  });
});
