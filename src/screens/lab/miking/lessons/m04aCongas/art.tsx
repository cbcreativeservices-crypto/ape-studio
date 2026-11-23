/**
 * M04a CONGAS — the look (charter §2 layer 3), drawn ONLY from the anchors in
 * model.ts / geometry.ts with the hand-drum family's parts
 * (shared/handdrums/handDrumArt.tsx).
 *
 * A SET OF THREE (owner 2026-11-22, on his iPhone: "center conga is conga w
 * tumba and quinto on sides"; decision "Three drums"). The old side view
 * looked ALONG the row from the player's right, so the conga hid behind the
 * tumba. In frame C (model.ts) the 'side' view is the FRONT elevation, from
 * the audience: tumba on the left of the picture, the conga in the middle,
 * the quinto on the right — side by side, none hidden. Top view: the three
 * heads from above, the audience at the bottom. On THE SETTING's band plan
 * (`planTurn`) the same heads are drawn turned into the plan's frame (the
 * audience to the right), each head still lit from the upper left.
 *
 * Every drum's name sits in clear space with a leader that lands on its own
 * drum (tested: test/mikingCongaSet_20261122.test.ts). In the front view the
 * player's hands and body (the model's keep-outs) stand over and behind the
 * drums, so the names sit in a row UNDER the floor line, one under each drum.
 * Lug counts, the rim, the belly and the stands are drawing defaults
 * (model.ts), never stated in words.
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ContactShadow, FloorSide, HeadTop, ShellSide, StandLegs, shellR } from '../shared/handdrums/handDrumArt';
import { planDist, rimTopY, type HandDrum } from '../shared/handdrums/handDrumModel.ts';
import { BELLY, CONGA_DIMS as D, HEAD_Y, TUMBA } from './model.ts';
import { CONGA_MODEL, DRUMS, LEG_R, STAND_RING_Y, standLegs } from './geometry.ts';

export { BELLY };

const LUGS = D.lugs.mm;
const STAVES = 14;
/** The rim band's depth below the head (ShellSide's default). */
const RIM_DEPTH = 24;
/** The lug tabs reach this far past the rim from above (HeadTop: rr + 20). */
const TABS = 20;
/* Real-object reference (drawing only, never app text): a 30 in (762 mm)
 * staved quinto / conga / tumba set, heads 11, 11-3/4 and 12-1/2 in (279, 298
 * and 318 mm). The shell is BELLIED, not a cone: it swells to about 1.11 × the
 * head roughly a third of the way down, then narrows to a lower opening of
 * about 0.8 × the head (the model's taper). Hardware: a chrome crown rim, an
 * L-hook per lug over it, a tension rod down to a nut on a side plate
 * (~110 mm long) bolted to the shell. */

/** Where the first lug sits from above (deg; HeadTop's phase): the tumba and
 *  the quinto turned a half lug pitch from the conga, so no two lug tabs meet
 *  across a gap and no tab of the outer drums points at the audience row of
 *  names (clash sweep 2026-11-22). */
const PHASE: Record<string, number> = { tumba: 90 + 180 / LUGS, conga: 90, quinto: 90 + 180 / LUGS };
const SEED: Record<string, number> = { tumba: 29, conga: 11, quinto: 43 };

const floorOf = (variant: VariantId) => CONGA_MODEL.floorByVariant?.[variant] ?? 0;

/** A drum moved into THE SETTING's plan frame: (u, v) = (z, −x) — the
 *  audience toward +u, the player's right toward +v (handPlanModel). */
function toPlan(d: HandDrum): HandDrum {
  return { ...d, c: { x: d.c.z, z: -d.c.x } };
}
const planPt = (p: { x: number; y: number; z: number }) => ({ x: p.z, y: p.y, z: -p.x });

export function CongaArt({ view, variant, planTurn }: { view: ViewId; variant: VariantId; planTurn?: boolean }) {
  const raised = variant === 'raised';
  const floorY = floorOf(variant);
  if (view === 'side') {
    // Front elevation: a leg toward the audience (+z) stands in front of its
    // shell, one toward the player behind it.
    return (
      <Group>
        <FloorSide y={floorY} u0={CONGA_MODEL.views.side!.u0} u1={CONGA_MODEL.views.side!.u1} />
        {DRUMS.map((d) => (
          <ContactShadow key={`sh-${d.id}`} cx={d.c.x} cy={floorY + 2} rx={raised ? d.rBottom + 140 : d.rBottom + 30} ry={9} />
        ))}
        {raised ? DRUMS.map((d) => <StandLegs key={`lb-${d.id}`} legs={standLegs(d).filter((l) => l.top.z <= d.c.z)} view="side" ring={{ cx: d.c.x, cv: 0, r: 0, y: STAND_RING_Y }} />) : null}
        {DRUMS.map((d) => (
          <ShellSide key={d.id} d={d} look="staved" staves={STAVES} lugs={LUGS} belly={BELLY} hardware="side" plateDown={150} />
        ))}
        {raised ? DRUMS.map((d) => <StandLegs key={`lf-${d.id}`} legs={standLegs(d).filter((l) => l.top.z > d.c.z)} view="side" ring={{ cx: d.c.x, cv: 0, r: 0, y: STAND_RING_Y }} />) : null}
      </Group>
    );
  }
  const drums = planTurn ? DRUMS.map(toPlan) : [...DRUMS];
  return (
    <Group>
      {raised
        ? DRUMS.map((d, i) => {
            const legs = standLegs(d).map((l) => (planTurn ? { top: planPt(l.top), foot: planPt(l.foot) } : l));
            return <StandLegs key={d.id} legs={legs} view="top" ring={{ cx: drums[i].c.x, cv: drums[i].c.z, r: 0 }} />;
          })
        : null}
      {drums.map((d) => (
        <HeadTop key={d.id} d={d} look="rawhide" lugs={LUGS} seed={SEED[d.id]} phaseDeg={PHASE[d.id] - (planTurn ? 90 : 0)} />
      ))}
    </Group>
  );
}

/** The caption row's height below the floor line (mm). */
const CAPTION = 80;

export function congaLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const floorY = floorOf(variant);
  if (view === 'side') {
    // One name under each drum, in a row below the floor line; each leader
    // runs up to its own drum's lower shell (no two can cross), a little off
    // the center line, where the raised conga's front stand leg runs.
    const out: ArtLabel[] = DRUMS.map((d) => ({
      id: d.id,
      text: d.short,
      u: d.c.x,
      v: floorY + CAPTION,
      align: 'center' as const,
      at: { u: d.c.x + d.R * 0.35, v: d.bottomY - 60 },
    }));
    out.push(
      { id: 'bottom', text: 'OPEN LOWER END', short: 'OPEN END', u: TUMBA.c.x - TUMBA.rBottom - 24, v: -70, align: 'right', tone: 'muted', at: { u: TUMBA.c.x - TUMBA.rBottom + 12, v: TUMBA.bottomY - 16 } },
      { id: 'floor', text: 'FLOOR', u: CONGA_MODEL.views.side!.u0 + 20, v: floorY + CAPTION, align: 'left', tone: 'muted' },
    );
    if (variant === 'raised') {
      // The tumba's outer front leg, near its foot.
      const l = standLegs(TUMBA)[1];
      const at = { u: l.top.x + (l.foot.x - l.top.x) * 0.8, v: l.top.y + (l.foot.y - l.top.y) * 0.8 };
      out.push({ id: 'stand', text: 'STAND', u: at.u - 30, v: at.v - 60, align: 'right', tone: 'muted', at });
    }
    return out;
  }
  // From above: each name just in front of its drum (the audience side, below
  // in the picture); raised, the conga's front leg runs there, so the row
  // drops below the legs' feet.
  const row = variant === 'raised' ? 322 : 222;
  return [
    ...DRUMS.map<ArtLabel>((d) => ({ id: d.id, text: d.short, u: d.c.x, v: d.c.z + row, align: 'center', at: { u: d.c.x + d.R * 0.4, v: d.c.z + d.R * 0.55 } })),
    { id: 'player', text: 'PLAYER ↑', u: 0, v: CONGA_MODEL.views.top!.v0 + 30, align: 'center', tone: 'muted', point: { u: 0, v: CONGA_MODEL.views.top!.v0 - 6000 } },
    { id: 'aud', text: 'AUDIENCE ↓', u: CONGA_MODEL.views.top!.u1 - 20, v: CONGA_MODEL.views.top!.v1 - 40, align: 'right', tone: 'muted' },
  ];
}

/** Distance from (u, v) to the segment a–b (mm). */
function segDist(u: number, v: number, a: { u: number; v: number }, b: { u: number; v: number }): number {
  const du = b.u - a.u;
  const dv = b.v - a.v;
  const L2 = du * du + dv * dv || 1;
  const t = Math.max(0, Math.min(1, ((u - a.u) * du + (v - a.v) * dv) / L2));
  return Math.hypot(u - (a.u + t * du), v - (a.v + t * dv));
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function congaHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const raised = variant === 'raised';
  if (view === 'top') {
    for (const d of DRUMS) {
      const r = planDist({ x: u, y: 0, z: v }, d.c.x, d.c.z);
      if (r <= d.R + d.rim.t + tol) return `${d.id}.head`;
      // The lug tabs (HeadTop: 18 mm wide, out to 20 mm past the rim).
      if (r <= d.R + d.rim.t + TABS + tol) {
        const a = Math.atan2(v - d.c.z, u - d.c.x);
        for (let k = 0; k < LUGS; k++) {
          const b = (PHASE[d.id] * Math.PI) / 180 + (k * 2 * Math.PI) / LUGS;
          if (Math.abs(r * Math.sin(a - b)) <= 9 + tol && Math.cos(a - b) > 0) return `${d.id}.head`;
        }
      }
    }
    if (raised)
      for (const d of DRUMS)
        for (const [i, l] of standLegs(d).entries()) {
          if (segDist(u, v, { u: l.top.x, v: l.top.z }, { u: l.foot.x, v: l.foot.z }) <= LEG_R + tol || Math.hypot(u - l.foot.x, v - l.foot.z) <= 14 + tol) return `${d.id}.leg${i + 1}`;
        }
    return null;
  }
  const leg = (front: boolean): string | null => {
    if (!raised) return null;
    for (const d of DRUMS)
      for (const [i, l] of standLegs(d).entries()) {
        if (l.top.z > d.c.z !== front) continue;
        if (segDist(u, v, { u: l.top.x, v: l.top.y }, { u: l.foot.x, v: l.foot.y }) <= LEG_R + tol || (Math.abs(u - l.foot.x) <= 16 + tol && Math.abs(v - (l.foot.y - 5)) <= 6 + tol)) return `${d.id}.leg${i + 1}`;
      }
    return null;
  };
  const f = leg(true);
  if (f) return f;
  for (const d of DRUMS) {
    const du = Math.abs(u - d.c.x);
    if (du <= d.R + d.rim.t + tol && v >= rimTopY(d) - tol && v <= HEAD_Y + RIM_DEPTH) return `${d.id}.head`;
    if (v > HEAD_Y + RIM_DEPTH && v <= d.bottomY + tol && du <= shellR(d, BELLY, Math.min(v, d.bottomY)) + tol) return `${d.id}.shell`;
  }
  return leg(false);
}
