/**
 * FIGURE V2 — WAVE 3, PIECE 2 STEP B: B02 NEWS DESK CONVERTED WHOLE (must-do
 * D78; coordinator GO 2026-11-23). Checked here:
 *   • every figure of the lesson in the new look, by one switch (V2): the
 *     anchor Kofi in his jacket (side and top, whole and headless), the guest
 *     Mei as the old lesson showed her (no jacket); the turned heads new; the
 *     cut-away of MEET IT dressed as the anchor, jacket and all; the old jacket
 *     overlay drawn only in the old look; label covers from the new outlines;
 *   • THE CLIP: the drawn clip's grip sits on Kofi's shirt in the jacket's V
 *     (jacketPlan.clipOnCloth), at the lesson's own height; the CAPSULE — the
 *     point every printed distance, angle and zone is read from — is unchanged,
 *     so no learner-facing number changes;
 *   • the cost at the lesson's size: no more than the old anchor in the old jacket.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const G = R(await import('../src/screens/lab/miking/lessons/b02NewsAnchor/geometry.ts'));
const SC = R(await import('../src/screens/lab/miking/lessons/b02NewsAnchor/scene.tsx'));
const BW = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts'));
const TK = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts'));
const BA = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/BroadcastArt.tsx'));
const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const PV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/personV2.tsx'));
const JP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/jacketPlan.ts'));
const CFG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts'));

/* (the wave 1 counter, as in figureV2Cast_20261123) */
type El = { type: unknown; props: { children?: unknown; [k: string]: unknown } };
const React = createRequire(import.meta.url)('react');
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const fnOf = (e: El) => (typeof e.type === 'function' ? e.type : (e.type as { type?: unknown })?.type) as ((p: object) => unknown) | undefined;
let ctxValue: unknown;
function expand(node: unknown, out: El[] = []): El[] {
  if (Array.isArray(node)) {
    for (const n of node) expand(n, out);
    return out;
  }
  if (!node || typeof node !== 'object' || !('props' in (node as object))) return out;
  const e = node as El;
  const f = fnOf(e);
  const name = (f as { name?: unknown } | undefined)?.name;
  if (f && typeof name === 'string' && name !== 'stub') {
    const prev = internals.H;
    internals.H = { useMemo: (g: () => unknown) => g(), useCallback: (g: unknown) => g, useRef: (v: unknown) => ({ current: v }), useContext: () => ctxValue };
    try {
      expand(f({ ...e.props }), out);
    } finally {
      internals.H = prev;
    }
    return out;
  }
  out.push(e);
  expand(e.props.children, out);
  if (e.props.layer) expand(e.props.layer, out);
  return out;
}
const costOf = (node: unknown, scale?: { ptPerMm: number | null }) => {
  ctxValue = scale;
  const els = expand(node);
  ctxValue = undefined;
  return { nodes: els.length, blurs: els.filter((e) => 'blur' in e.props && 'style' in e.props).length };
};

describe('figure V2 wave 3 — B02 news desk, whole', () => {
  it('one switch for the whole lesson; the anchor Kofi in his jacket, the guest Mei without one', () => {
    assert.equal(SC.V2, CFG.figureV2On('sideDeskTalker'));
    assert.equal(CAST.castFor(CAST.talkerRole(G.ANCHOR.id)).id, 'kofi');
    assert.equal(CAST.castFor(CAST.talkerRole(G.GUEST.id)).id, 'mei');
    const scene = read(`${L}/b02NewsAnchor/scene.tsx`);
    // every SeatedTalker carries the lesson's v2; the anchor's (and only the anchor's) the jacket
    const talkers = scene.match(/<SeatedTalker [^>]*\/>/g) ?? [];
    assert.equal(talkers.length, 5);
    for (const t of talkers) {
      assert.match(t, /v2=\{v2\}/, t);
      if (/t=\{ANCHOR\}/.test(t)) assert.match(t, /jacket=\{ANCHOR_JACKET\}/, t);
      else assert.doesNotMatch(t, /jacket/, t);
    }
    // the old jacket overlay only in the old look
    assert.match(scene, /\{v2 \? null : <Jacket view="side" standing=\{false\} \/>\}/);
    // the label covers: the new outlines (the jacket's too)
    assert.match(scene, /talkerCovers\(view, ANCHOR, u, v, tol, V2, ANCHOR_JACKET\)/);
    assert.match(scene, /talkerCovers\(view, GUEST, u, v, tol, V2\)/);
    const pages = read(`${L}/b02NewsAnchor/pages.tsx`);
    assert.match(pages, /useBodyTurnStep\(\{\n\s+v2: V2,/);
    assert.match(pages, /makeBroadcastSound\(\{\n\s+v2: V2,\n\s+jacket: true,/);
  });

  it('the cut-away and the turned heads follow the lesson: the cut-away in the jacket only when asked', () => {
    assert.match(read(`${L}/shared/broadcast/broadcastPages.tsx`), /who=\{spec\.v2 \? castFor\(spec\.who \?\? 'talker\.host'\) : undefined\} jacket=\{!!spec\.jacket\}/);
    const cut = read(`${L}/shared/voice/VoiceCutaway.tsx`);
    assert.match(cut, /export function VoiceCutaway\(\{ tint, who, jacket = false \}/);
    assert.match(cut, /\{jacket && L\.JACKET \? \(/);
    assert.match(read(`${L}/shared/broadcast/bodyWornPages.tsx`), /<TurnedHeadSide pitchDeg=\{pitch\} v2=\{spec\.v2\}( who=\{spec\.who\})? \/>/);
  });

  it('the anchor in the jacket covers its own outline for labels; the guest is two people away', () => {
    const pose = BA.talkerPose('side', G.ANCHOR);
    const opts = { lip: { u: 0, v: 0 }, rest: 'restFlat' as const, seatV: TK.SEAT_Y, jacket: true };
    const plan = PV.personPlan(pose, CAST.CAST.kofi, opts);
    const J = JP.jacketSidePlan(plan, CAST.CAST.kofi.body, false);
    // a point on the jacket's back, outside the shirt: covered (labels keep off it)
    const back = J.body.reduce((a: { u: number; v: number }, b: { u: number; v: number }) => (b.u < a.u ? b : a));
    assert.ok(BA.talkerCovers('side', G.ANCHOR, back.u + 1, back.v, 0, true, true));
    assert.ok(G.GUEST.lip.z >= 600, 'the guest sits beside, not behind');
  });

  it('THE CLIP: its grip drawn on the shirt in the V at the lesson height; the capsule (every printed number) unchanged', () => {
    // the capsule — the measured point — is the shared sternum mount's, untouched
    assert.deepEqual(G.LAV_A.at, BW.BODY_MOUNTS.sternum.at);
    assert.equal(Math.round(Math.hypot(G.LAV_A.at.x, G.LAV_A.at.y) / 10), 21, 'the printed 21 cm');
    // the grip on the cloth: the lesson's height, Kofi's shirt front (1 mm off) in his jacket
    const g = G.LAV_A_GRIP_ON_CLOTH;
    assert.equal(g.y, BW.BODY_MOUNTS.sternum.grip.y);
    const pose = BA.talkerPose('side', G.ANCHOR);
    const plan = PV.personPlan(pose, CAST.CAST.kofi, { lip: { u: 0, v: 0 }, rest: 'restFlat', seatV: TK.SEAT_Y, jacket: true });
    const J = JP.jacketSidePlan(plan, CAST.CAST.kofi.body, false);
    const c = JP.clipOnCloth(plan, J, BW.BODY_MOUNTS.sternum.grip, 'shirt');
    assert.ok(Math.abs(c.u - g.x) < 0.3, `the grip ${g.x} vs the cloth ${c.u.toFixed(2)}`);
    // the rim the clip clips to is that grip (new look); its cable route moved with it
    const rim = (G.B02_MODEL.rims ?? []).find((r: { id: string }) => r.id === 'clip.sternum');
    assert.ok(rim);
    if (SC.V2) {
      assert.ok(Math.abs(rim.c.x - g.x) < 1e-9);
      assert.ok(Math.abs(rim.lead[0].x - (BW.lavLead(BW.BODY_MOUNTS.sternum.grip, true)[0].x + g.x - BW.BODY_MOUNTS.sternum.grip.x)) < 1e-9);
    }
    // the zones and the turn step read the capsule
    assert.match(read(`${L}/b02NewsAnchor/model.ts`), /LAV_A\.at\)/);
    assert.match(read(`${L}/b02NewsAnchor/pages.tsx`), /p: LAV_A\.at, rides: 'chest'/);
  });

  it('the cost at the lesson size: no more than the old anchor (old figure and old jacket), side and top', () => {
    for (const [view, variant] of [['side', 'close'], ['top', 'twoShot']] as const) {
      const oldC = costOf(React.createElement(SC.B02Scene, { view, variant, camera: false, v2: false }));
      const newC = costOf(React.createElement(SC.B02Scene, { view, variant, camera: false, v2: true }), { ptPerMm: 0.1 });
      assert.ok(newC.nodes <= oldC.nodes, `${view}: ${newC.nodes} vs old ${oldC.nodes}`);
      assert.ok(newC.blurs <= oldC.blurs, `${view}: blurs ${newC.blurs} vs ${oldC.blurs}`);
    }
  });
});
