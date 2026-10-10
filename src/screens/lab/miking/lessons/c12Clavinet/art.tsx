/**
 * C12 CLAVINET — the look (charter §2 layer 3), in millimetres of frame C:
 * side u = x, v = y (the amplifier cut open through its speaker, the grille
 * at the right, facing the mic); top u = x, v = z (from above).
 *
 *   SIDE / TOP  the amplifier cut through its speaker, drawn by the shared
 *         speaker family (CabSection; the combo's chassis and valves from
 *         its ampExtras) — one amp family across Lab 4.
 * Plus, for the stage plan: the clavinet, the keyboardist and the pedals
 * from above. Light from the upper left; nothing moves (D8); paths built once.
 */
import { Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ampBox, GRILLE_X, LAYOUT, SPEAKER } from './ampSpec.ts';
import { CabSection } from '../shared/speakers/SpeakerArt';
import { ampExtras } from '../shared/speakers/ampArt';
import { PANEL, type CabKind } from '../shared/speakers/speakerModel.ts';
import type { Back } from '../shared/speakers/cabGeometry.ts';
import { FigureHead, headAbove } from '../shared/players/PlayerFigure';
import { pt } from '../shared/players/playerPose';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
/** The shared family's panel thickness (hit tests only). */
const WALL = PANEL.mm;

const kindOf = (v: VariantId) => (v === 'cab' ? 'cab' : 'combo');

/** The amplifier, drawn by the shared speaker family (one amp family across
 *  the lab: SPK, C02, C08, C04 and here) — the open-backed combo with its
 *  chassis and valves, or the closed 1×12, cut through the speaker. */
type Built = Record<string, SkPath>;
const ampKind = (v: VariantId): CabKind => (v === 'cab' ? '1x12' : 'combo12');
const ampBack = (v: VariantId): Back => (v === 'cab' ? 'closed' : 'open');
const comboExtras = ampExtras('combo', null);

export function AmpSide({ variant, dim = 1 }: { variant: VariantId; dim?: number }) {
  return (
    <Group opacity={dim}>
      <CabSection kind={ampKind(variant)} back={ampBack(variant)} view="side" />
      {kindOf(variant) === 'combo' ? comboExtras.render?.('side') ?? null : null}
    </Group>
  );
}

export function AmpTop({ variant, dim = 1 }: { variant: VariantId; dim?: number }) {
  return (
    <Group opacity={dim}>
      <CabSection kind={ampKind(variant)} back={ampBack(variant)} view="top" />
    </Group>
  );
}

/* ── the clavinet, the keyboardist and the pedals from above (stage plan) ── */
let planCache: Built | null = null;
function planPaths(): Built {
  if (planCache) return planCache;
  const o: Built = {};
  const c = LAYOUT.clav;
  o.case = make();
  o.case.addRRect(Skia.RRectXY(Skia.XYWHRect(c.x0, c.z0, c.x1 - c.x0, c.z1 - c.z0), 24, 24));
  o.keys = make();
  o.black = make();
  const n = 35;
  const kw = (c.z1 - c.z0 - 80) / n;
  for (let i = 0; i < n; i++) o.keys.addRect(Skia.XYWHRect(c.x0 + 20, c.z0 + 40 + i * kw + 1, 140, kw - 2));
  for (let i = 0; i < n - 1; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) o.black.addRect(Skia.XYWHRect(c.x0 + 70, c.z0 + 40 + (i + 0.68) * kw, 90, kw * 0.62));
  o.legs = make();
  for (const [x, z] of [
    [c.x0 + 40, c.z0 + 40],
    [c.x1 - 40, c.z0 + 40],
    [c.x0 + 40, c.z1 - 40],
    [c.x1 - 40, c.z1 - 40],
  ])
    o.legs.addCircle(x, z, 18);
  const p = LAYOUT.player;
  o.body = make();
  o.body.addOval(Skia.XYWHRect(p.x - 140, p.z - 240, 280, 480));
  o.arms = make();
  for (const s of [-1, 1]) o.arms.addRRect(Skia.RRectXY(Skia.XYWHRect(p.x + 40, p.z + s * 200 - 45, 260, 90), 40, 40));
  // The head: the figure's own skin silhouette from above (head fix
  // 2026-10-08 — a head ON A BODY is PlayerFigure's FigureHead, never a
  // circle), built at the origin, turned to the keys (+x) where drawn.
  o.head = headAbove(pt(0, 0), 100).fill;
  const q = LAYOUT.pedals;
  o.pedals = make();
  for (let i = 0; i < 3; i++) o.pedals.addRRect(Skia.RRectXY(Skia.XYWHRect(q.x - 60 + i * 0, q.z - 60 + i * 150, 110, 130), 14, 14));
  o.cable = make();
  o.cable.moveTo(c.x0 + 60, c.z1 - 30);
  o.cable.cubicTo(c.x0 - 40, c.z1 + 80, q.x + 60, q.z - 120, q.x + 50, q.z - 30);
  o.cable.moveTo(q.x - 60, q.z + 330);
  o.cable.cubicTo(q.x - 300, q.z + 600, 300, 200, 15, 120);
  planCache = o;
  return o;
}

export function ClavinetPlan({ dim = 1 }: { dim?: number }) {
  const o = planPaths();
  const c = LAYOUT.clav;
  return (
    <Group opacity={dim}>
      <Path path={o.cable} style="stroke" strokeWidth={10} color="#2a2b30" />
      <Path path={o.legs} color="#9aa0ab" />
      <Path path={o.case}>
        <LinearGradient start={vec(c.x0, c.z0)} end={vec(c.x1, c.z1)} colors={['#4a4038', '#2e2722', '#1c1815']} />
      </Path>
      <Path path={o.keys} color="#ece8de" />
      <Path path={o.black} color="#1a1a1c" />
      <Path path={o.pedals}>
        <LinearGradient start={vec(LAYOUT.pedals.x - 60, 0)} end={vec(LAYOUT.pedals.x + 60, 0)} colors={['#d24b3c', '#9c2f25']} />
      </Path>
      <Path path={o.arms} color="#3c4252" />
      <Path path={o.body} color="#2f3542" />
      <Group transform={[{ translateX: LAYOUT.player.x + 10 }, { translateY: LAYOUT.player.z }, { rotate: -Math.PI / 2 }]}>
        <FigureHead fill={o.head} />
      </Group>
    </Group>
  );
}

export function AmpArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  return view === 'side' ? <AmpSide variant={variant} /> : <AmpTop variant={variant} />;
}

export function ampLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const b = ampBox(kindOf(variant));
  const R = SPEAKER.rCone.mm;
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'grille', text: 'GRILLE', u: GRILLE_X + 40, v: b.y0 + 40, align: 'left' },
      // CLASH SWEEP 2026-10-10 (owner at 3×): SPEAKER CONE's place is inside
      // the cabinet, so the words fell onto the floor with a leader to the
      // cabinet's bottom panel; DUST CAP sat on the dashed axis line. The cone
      // label now names the cone (`at`) from behind the box; DUST CAP sits
      // just under the axis.
      { id: 'cone', text: 'SPEAKER CONE', short: 'CONE', u: -70, v: R + 40, align: 'center', at: { u: -45, v: R * 0.6 }, alts: [{ u: b.x0 - 30, v: b.y1 - 50, align: 'right' }] },
      { id: 'dust', text: 'DUST CAP', u: GRILLE_X + 40, v: 26, align: 'left', tone: 'muted' },
      { id: 'back', text: b.open ? 'OPEN BACK' : 'CLOSED BACK', u: b.x0 - 30, v: b.open ? (b.openY0 + b.openY1) / 2 : 0, align: 'right', tone: 'muted' },
    ];
    if (b.chassis) out.push({ id: 'chassis', text: 'CHASSIS · TUBES', short: 'TUBES', u: (b.x0 + b.x1) / 2, v: b.y0 - 60, align: 'center', tone: 'muted' });
    return out;
  }
  return [
    { id: 'grille', text: 'GRILLE', u: GRILLE_X + 40, v: b.z0 + 40, align: 'left' },
    { id: 'cab', text: 'CABINET', u: (b.x0 + b.x1) / 2, v: b.z1 + 60, align: 'center' },
    { id: 'spk', text: 'SPEAKER', u: -70, v: R + 60, align: 'center', tone: 'muted', at: { u: -45, v: R * 0.6 }, alts: [{ u: b.x0 - 30, v: b.z1 - 50, align: 'right' }] },
  ];
}

export function ampHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const b = ampBox(kindOf(variant));
  const pre = b.kind === 'combo' ? 'co' : 'cb';
  const R = SPEAKER.rCone.mm;
  const w = v;
  const lo = view === 'side' ? b.y0 : b.z0;
  const hi = view === 'side' ? b.y1 : b.z1;
  if (u >= -tol && u <= GRILLE_X + tol && w >= lo && w <= hi) return 'grille';
  if (u < 0 && u > -150 && Math.abs(w) <= R + tol) return Math.abs(w) <= SPEAKER.rDust.mm && u > -100 ? 'dust' : 'cone';
  if (view === 'side' && b.chassis && w <= b.chassis.y1 + 70 && w >= b.y0 && u >= b.x0 + WALL && u < -WALL) return 'co.chassis';
  if (view === 'side' && u >= b.x0 - tol && u <= b.x0 + WALL + tol && w >= lo && w <= hi) return `${pre}.back`;
  if (u >= b.x0 && u <= b.x1 && w >= lo - 25 && w <= hi) return `${pre}.cab`;
  return null;
}

export const CLAV_BASE_ART: Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest'> = {
  Instrument: AmpArt,
  labels: ampLabels,
  hitTest: ampHitTest,
};
