/**
 * FIGURE V2 — KEYS AND GUITARS, THE REVIEW'S FIXES (KeysGuitar2, 2026-11-24).
 * The pianist's hands as a pianist checks them: five curved fingers, each pad
 * a third of the way into its own white key (never at the front edge, short of
 * the black keys), the knuckle row the arch's top, no finger hooked back under
 * its middle joint, the thumb lying along its key (its end joint over the key,
 * low — never hanging over the key's front face); the reed-piano player leaning
 * in from the hips so the elbows are not reaching, the hips where the lesson has
 * them.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const PP = await import('../src/screens/lab/miking/lessons/shared/piano/pianistPlanV2.ts');
const PS = await import('../src/screens/lab/miking/lessons/shared/piano/pianoSpec.ts');
const G = await import('../src/screens/lab/miking/lessons/c11Piano/geometry.ts');
const WP = await import('../src/screens/lab/miking/lessons/shared/keys/wurliPlayerV2.tsx');
const WM = await import('../src/screens/lab/miking/lessons/shared/keys/wurliModel.ts');
const WPL = await import('../src/screens/lab/miking/lessons/shared/keys/wurliPlayer.ts');
const HM = await import('../src/screens/lab/miking/lessons/shared/players/handModel.ts');

type V = { x: number; y: number; z: number };
type Arm = { side: 'R' | 'L'; shoulder: V; elbow: V; sk: { fingers: { joints: V[] }[]; thumb: { joints: V[] }; frame: { o: V } } };

/** `inn(q)`: how far into the keys (mm); `up(q)`: how high over the key tops. */
const checkKeysHand = (a: Arm, inn: (q: V) => number, up: (q: V) => number, name: string) => {
  for (const d of a.sk.fingers) {
    const [mcp, pip, dip, tip] = d.joints;
    // (the pad on the white key's playing surface, its ≈ 8 mm round edge short of the black keys' fronts at 55)
    assert.ok(inn(tip) >= 20 && inn(tip) + 8 <= 55, `${name}: a pad ${inn(tip).toFixed(0)} mm into its key, clear of the black keys`);
    assert.ok(up(mcp) >= up(pip) - 4, `${name}: the knuckle the arch's top (no collapsed knuckle)`);
    // (the end bone stands on its pad, never curled back toward the palm: no loop seen from above)
    assert.ok(inn(dip) - inn(tip) < 2.5, `${name}: the end bone not hooked back (${(inn(dip) - inn(tip)).toFixed(1)} mm)`);
    const fl = HM.fingerFlexDeg(a.sk.frame as never, d as never);
    assert.ok(fl.dip <= 38, `${name}: the end joint gently bent (${fl.dip.toFixed(0)}°)`);
    assert.ok(fl.pip <= 68, `${name}: the middle joint not clenched (${fl.pip.toFixed(0)}°)`);
  }
  const [, , ip, ttip] = a.sk.thumb.joints;
  assert.ok(up(ip) >= 8 && up(ip) < 24, `${name}: the thumb low along its key, never below its top (${up(ip).toFixed(0)} mm up)`);
  assert.ok(inn(ttip) > -4, `${name}: the thumb's tip on the key`);
  // (the wrist about level with the knuckles or a little below)
  const wristUp = up(a.sk.frame.o);
  const kn = up(a.sk.fingers[1].joints[0]);
  assert.ok(wristUp <= kn + 7 && wristUp >= kn - 28, `${name}: the wrist (${wristUp.toFixed(0)}) about level with the knuckles (${kn.toFixed(0)})`);
};

describe('figure V2, keys: the review fixes (KeysGuitar2)', () => {
  it('C11 (grand and upright): five curved fingers on five keys, the thumb along its key', () => {
    for (const k of ['grand', 'upright'] as const) {
      const at = G.PIANIST_AT[k];
      const p = PP.pianist3(at.xKey, at.pedalX);
      for (const a of [p.R, p.L] as unknown as Arm[]) checkKeysHand(a, (q) => q.x - at.xKey, (q) => PS.KEY_TOP_Y - q.y, `${k} ${a.side}`);
    }
  });

  it('I11b: the same hands; the upper body leaning in, the elbows not reaching; the hips the lesson’s', () => {
    const A = WP.wurliArms() as unknown as { R: Arm; L: Arm };
    for (const a of [A.R, A.L]) {
      checkKeysHand(a, (q) => WM.W.keyFrontX - q.x, (q) => WM.W.keyTopY - q.y, `wurli ${a.side}`);
      // (facing −x: the elbow no more than ≈ 16 cm in front of its shoulder)
      assert.ok(a.shoulder.x - a.elbow.x < 165, `wurli ${a.side}: the elbow ${(a.shoulder.x - a.elbow.x).toFixed(0)} mm in front of the shoulder`);
    }
    const S = WP.wurliSideV2().plan as unknown as { pose?: { hipR: { u: number; v: number } } };
    if (S.pose) assert.deepEqual(S.pose.hipR, WPL.WURLI_PLAYER_SIDE.hipR);
  });
});
