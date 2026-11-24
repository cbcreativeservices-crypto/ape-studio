/**
 * FIGURE V2 — THE MALLET KEYBOARDS' PLAYER (I07 vibraphone, I08 marimba, I09
 * xylophone, I10 glockenspiel; the Players builder, 2026-11-24). Pins: each
 * hand is the approved stick grip closed on the lesson's own grip point with
 * its mallet's own head (no mallet, bar or measured point moves; the old
 * fists' anchors are still the lesson's malletPoses); both arms reach without
 * over-stretching from the cast member's shoulders, the elbows hanging below
 * the shoulders near the sides; one person per lesson; the lessons opt in
 * under `sidePlayers` at the family's one call site.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const near = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, tol = 0.5) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= tol;

const MA = await import('../src/screens/lab/miking/lessons/shared/mallets/MalletArt.tsx');
const MM = await import('../src/screens/lab/miking/lessons/shared/mallets/malletModel.ts');
const MP = await import('../src/screens/lab/miking/lessons/shared/mallets/malletPlayerV2.ts');
const CAST = await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts');
const FAMS = [
  (await import('../src/screens/lab/miking/lessons/i07Vibraphone/model.ts')).VIBE_FAM,
  (await import('../src/screens/lab/miking/lessons/i08Marimba/model.ts')).MARIMBA_FAM,
  (await import('../src/screens/lab/miking/lessons/i09Xylophone/model.ts')).XYLO_FAM,
  (await import('../src/screens/lab/miking/lessons/i10Glockenspiel/model.ts')).GLOCK_FAM,
];

describe('figure V2 — the mallet keyboards’ player', () => {
  it('one cast member per lesson', () => {
    const ids = ['player.vibe', 'player.marimba', 'player.xylo', 'player.glock'].map((k) => CAST.ROLES[k as keyof typeof CAST.ROLES]);
    assert.deepEqual(ids, ['kofi', 'ana', 'ruth', 'mei']);
  });

  it('every variant: each hand closes on the lesson’s own grip point and mallet, the arm within reach, the elbow hanging', () => {
    for (const fam of FAMS) {
      const G = MM.malletGeom(fam);
      for (const vv of fam.variants) {
        const v = vv.row.id;
        const L = G.layouts[v];
        const yF = G.floor[v];
        const poses = MA.malletPoses(L);
        const arms = MP.malletArms(L, yF, poses);
        arms.forEach((a, i) => {
          const m = poses[i];
          const tag = `${fam.p} ${v} ${a.side}`;
          assert.ok(near(a.hold.fulcrum, m.hand), `${tag}: the fulcrum is the lesson's grip point`);
          assert.ok(near(a.head, m.head), `${tag}: the mallet's head is the lesson's`);
          assert.ok(a.reach < 1, `${tag}: reach ${a.reach}`);
          // (follow-up round 2026-11-24: the wrist held to ≈ 30° — malletHold.ts — and no arm past 88% of its reach)
          assert.ok(a.hold.bend <= 30.6, `${tag}: wrist bend ${a.hold.bend}`);
          assert.ok(a.reach <= 0.88, `${tag}: reach ${a.reach}`);
          assert.ok(a.elbow.y > a.shoulder.y + 150, `${tag}: the elbow hangs below the shoulder`);
          assert.ok(Math.abs(a.elbow.x - a.shoulder.x) < 90, `${tag}: the elbow near the side (${a.elbow.x - a.shoulder.x})`);
        });
        assert.equal(arms[0].side, 'R');
        assert.equal(arms[1].side, 'L');
      }
    }
  });

  it('(KeysGuitar3) the mallet HELD: each hand the approved held grip closed on the lesson’s own grip point, the shaft toward the lesson’s head, the arm reaching, the elbow hanging near the side', () => {
    for (const fam of FAMS) {
      const G = MM.malletGeom(fam);
      for (const vv of fam.variants) {
        const v = vv.row.id;
        const L = G.layouts[v];
        const yF = G.floor[v];
        const poses = MA.malletPoses(L);
        const grips = MP.malletGrips(L, yF, poses);
        grips.forEach((g, i) => {
          const m = poses[i];
          const tag = `${fam.p} ${v} ${g.hand}`;
          assert.ok(near(g.fist, m.hand), `${tag}: the fist is the lesson's grip point`);
          const d = { x: m.head.x - m.hand.x, y: m.head.y - m.hand.y, z: m.head.z - m.hand.z };
          const k = Math.hypot(d.x, d.y, d.z);
          assert.ok(Math.abs((g.rod.x * d.x + g.rod.y * d.y + g.rod.z * d.z) / k - 1) < 1e-6, `${tag}: the shaft runs to the lesson's head`);
          assert.equal(g.far, false, `${tag}: within reach`);
          assert.ok(g.elbow.y > g.shoulder.y + 140, `${tag}: the elbow hangs below the shoulder`);
          assert.ok(Math.abs(g.elbow.x - g.shoulder.x) < 110, `${tag}: the elbow near the side (${g.elbow.x - g.shoulder.x})`);
          // (from above the upper arm hangs forward, foreshortened: well under its 310 mm on the plan)
          const plan = Math.hypot(g.elbow.x - g.shoulder.x, g.elbow.z - g.shoulder.z);
          assert.ok(plan < 160, `${tag}: the upper arm from above ${plan.toFixed(0)} mm`);
        });
        assert.deepEqual(grips.map((g) => g.hand), ['R', 'L']);
      }
    }
    // the art draws these hands (the held grip's painter), the shaft's end inside the palm
    const art = read('src/screens/lab/miking/lessons/shared/mallets/MalletPlayerArtV2.tsx');
    assert.match(art, /<GripHand grip=\{ap\.hand\} rod=\{rod\}/);
    assert.match(art, /malletGripPlans\(L, yF, poses, who, view\)/);
  });

  it('(KeysGuitar3) I07 labels keep off the new figure from the front: its outline is the occupancy; BARS on a bar toward the high end (text unchanged)', () => {
    const src = read('src/screens/lab/miking/lessons/shared/mallets/MalletArt.tsx');
    assert.match(src, /return frontFigureAt\(G\.layouts\[vs\], G\.floor\[vs\], u, v, tol\);/);
    assert.match(src, /out\.push\(\{ id: 'bars', text: 'BARS', u: nb\.x, v: L\.yAcc - 120, align: 'center', at: \{ u: nb\.x, v: L\.yNat \+ 2 \} \}\);/);
  });

  it('the damper pedal: the right foot on it (from the front its shoe on the pedal’s top), the pedal itself the lesson’s', () => {
    for (const fam of FAMS) {
      const G = MM.malletGeom(fam);
      for (const vv of fam.variants) {
        const v = vv.row.id;
        const L = G.layouts[v];
        const yF = G.floor[v];
        const body = MP.malletBodyPoses(L, yF, MA.malletPoses(L));
        const ped = G.extras[v]?.pedal;
        if (L.row.extras.damper === 'pedal') {
          assert.ok(ped && ped.kind === 'box', `${fam.p} ${v}: the lesson's pedal`);
          if (ped && ped.kind === 'box') {
            assert.ok(body.front.footR.u > ped.min.x && body.front.footR.u < ped.max.x, `${fam.p} ${v}: the right foot over the pedal`);
            assert.deepEqual([ped.min.x, ped.max.x, ped.max.y - ped.min.y], [-150, 150, 100]);
          }
          assert.equal(Math.round(yF - body.front.footR.v), MP.PEDAL_TOP);
        } else assert.ok(Math.abs(body.front.footR.v - yF) < 1, `${fam.p} ${v}: both feet on the floor`);
      }
    }
  });

  it('a low keyboard (the case glockenspiel): the player sinks a little at the knees — never a bow out over the bars', () => {
    const G = MM.malletGeom(FAMS[3]);
    const L = G.layouts.case;
    const le = MP.malletLean(L, G.floor.case, MA.malletPoses(L));
    assert.ok(le.drop > 0 && le.drop <= 90 && le.fwd === 0, `sink ${le.drop}`);
  });

  it('the family opts in once, under sidePlayers, the old drawing kept for v2 = false', () => {
    const src = read('src/screens/lab/miking/lessons/shared/mallets/MalletArt.tsx');
    assert.match(src, /export const V2 = figureV2On\('sidePlayers'\);/);
    assert.match(src, /v2 = V2/);
    assert.match(src, /<PlayerBehind pose=\{b\.player\.pose\} dim=\{0\.42\} \/>/);
    // (the labels, the hit test and the plan's player box are the lesson's own, unchanged)
    assert.match(src, /out\.push\(\{ id: 'player', text: 'PLAYER \(BEHIND\)', short: 'PLAYER', u: 0, v: yF - 1820/);
  });
});
