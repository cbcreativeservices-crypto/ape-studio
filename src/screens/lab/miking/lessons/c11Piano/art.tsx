/**
 * C11 PIANO — the look (charter §2 layer 3), drawn ONLY from the shared piano
 * family (lessons/shared/piano) and the set-up's anchors, in millimetres of
 * the view's (u, v): side u = x, v = y; top u = x, v = z (lesson frame K).
 *
 *   grand / short / baby   SIDE: the grand from its curved side, that wall cut
 *                          away; the pianist on the bench at the keys. TOP:
 *                          from above, the lid translucent on its hinge.
 *   upright / uprightFront SIDE: cut open at the keyboard's middle; the wall
 *                          behind. TOP: from above, the top open.
 * The dashed amber line is the hammer line the readouts measure from. Nothing
 * moves (D8).
 */
import { Group } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../engine/scene/sceneTypes.ts';
import { GrandPlan, GrandSide, HammerLine, Pianist, UprightPlan, UprightSide } from '../shared/piano/PianoArt';
import { FLOOR_Y, KEY_TOP_Y, KEYS_Z0, lidPoint, lidUnderY, pianistAt, type GrandGeom } from '../shared/piano/pianoSpec.ts';
import { GB, GS, SETUP, UP, type PianoVariant } from './model.ts';
import { PIANIST_AT } from './geometry.ts';

const setupOf = (v: VariantId) => SETUP[(v as PianoVariant) in SETUP ? (v as PianoVariant) : 'grand'];
const geomOf = (v: VariantId): GrandGeom => (setupOf(v).kind === 'grand' && (setupOf(v) as { id: string }).id === 'S' ? GS : GB);

export function PianoArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const s = setupOf(variant);
  if (s.kind === 'grand') {
    const P = PIANIST_AT.grand;
    return view === 'side' ? (
      <Group>
        <GrandSide id={s.id} lid={s.lid} />
        <HammerLine view="side" y0={-120} y1={110} />
        <Pianist view="side" xKey={P.xKey} pedalX={P.pedalX} dim={0.85} />
      </Group>
    ) : (
      <Group>
        <Pianist view="top" xKey={P.xKey} pedalX={P.pedalX} dim={0.85} />
        <GrandPlan id={s.id} lid={s.lid} />
        <HammerLine view="top" />
      </Group>
    );
  }
  const P = PIANIST_AT.upright;
  return view === 'side' ? (
    <Group>
      <UprightSide panelOn={s.panel} />
      <Pianist view="side" xKey={P.xKey} pedalX={P.pedalX} dim={0.85} />
    </Group>
  ) : (
    <Group>
      <Pianist view="top" xKey={P.xKey} pedalX={P.pedalX} dim={0.85} />
      <UprightPlan />
    </Group>
  );
}

export function pianoLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const s = setupOf(variant);
  if (s.kind === 'grand') {
    const g = geomOf(variant);
    const lidTop = lidPoint(g, s.lid, (g.xs + g.tail.cx) / 2, g.bentZ((g.xs + g.tail.cx) / 2), 'top');
    if (view === 'side') {
      // LABEL PLACES (lab art fix 2026-10-16, the grader at 3x: MUSIC DESK and
      // DAMPERS stacked into one block with crossing leaders, HAMMER LINE ran
      // a second leader down through the lid beside them, PIANIST's leader
      // ran down through the body). The action is named from ABOVE the lid's
      // front — HAMMER LINE to the left of its leader, DAMPERS to the right
      // of theirs, so the two never cross (a mic over the hammers hangs
      // between them, its stand and boom to the right); the strings and the
      // board from BELOW the case, each on a short vertical leader; the desk
      // up and to the left, in the air over the keys; the pianist above the
      // head.
      const head = pianistAt(PIANIST_AT.grand.xKey, PIANIST_AT.grand.pedalX);
      const over = lidPoint(g, s.lid, 0, g.bentZ(Math.max(0, g.xs)), 'top').y - 150;
      const below = g.caseBottom + 125;
      return [
        { id: 'lid', text: s.lid === 'short' ? 'LID · SHORT STICK' : 'LID · FULL STICK', short: 'LID', u: lidTop.x, v: lidTop.y - 40, align: 'center' },
        { id: 'hammer', text: 'HAMMER LINE', short: 'HAMMERS', u: -30, v: over, align: 'right', at: { u: 0, v: -120 }, alts: [{ u: -30, v: over - 110, align: 'right' }] },
        { id: 'damper', text: 'DAMPERS', u: 130, v: over, align: 'left', tone: 'muted', at: { u: 90, v: -60 }, alts: [{ u: 130, v: over - 110, align: 'left' }] },
        { id: 'strings', text: 'STRINGS', u: 560, v: below, align: 'center', at: { u: 560, v: 0 }, alts: [{ u: 560, v: below + 120, align: 'center' }] },
        { id: 'board', text: 'SOUNDBOARD', short: 'BOARD', u: 980, v: below + 120, align: 'center', tone: 'muted', at: { u: 980, v: 110 }, alts: [{ u: 980, v: below, align: 'center' }] },
        { id: 'desk', text: 'MUSIC DESK', short: 'DESK', u: g.desk.x0 - 150, v: g.desk.y0 - 110, align: 'center', tone: 'muted', at: { u: (g.desk.x0 + g.desk.x1) / 2, v: g.desk.y0 + 60 } },
        { id: 'pianist', text: 'PIANIST', u: head.head.x, v: head.head.y - head.headR - 150, align: 'center', tone: 'illustrative', at: { u: head.head.x, v: head.head.y - head.headR - 8 } },
        { id: 'pedals', text: 'PEDALS', u: g.lyre.x - 120, v: FLOOR_Y - 120, align: 'center', tone: 'muted' },
        { id: 'cut', text: 'CURVED SIDE CUT AWAY', short: 'CUT AWAY', u: g.xTail - 40, v: g.caseBottom + 70, align: 'right', tone: 'muted' },
      ];
    }
    return [
      { id: 'lid', text: s.lid === 'short' ? 'LID (SHORT STICK)' : 'LID (RAISED)', short: 'LID', u: g.xs + 200, v: -g.hw + 200, align: 'left' },
      { id: 'treble', text: 'TREBLE', u: 60, v: 520, align: 'left', tone: 'muted' },
      { id: 'bass', text: 'BASS', u: 60, v: -520, align: 'left', tone: 'muted' },
      { id: 'hole', text: 'SOUND HOLE', short: 'HOLE', u: g.holes[0].c.x + 70, v: g.holes[0].c.z + 10, align: 'left' },
      { id: 'hammer', text: 'HAMMER LINE', short: 'HAMMERS', u: 12, v: KEYS_Z0 - 70, align: 'left' },
      // CLASH SWEEP 2026-10-10 (owner at 3×): v 330 lies on the bench, so
      // PIANIST always fell to free space — a leader across the whole case
      // that crossed the SOUND HOLE and KEYS leaders. Its places are now
      // just clear of the bench (≈ 760 mm long), the bass side first; KEYS
      // gets a second row below the treble end before free space.
      { id: 'keys', text: 'KEYS', u: g.xKey + 75, v: -KEYS_Z0 + 90, align: 'center', tone: 'muted', alts: [{ u: g.xKey + 75, v: -KEYS_Z0 + 170, align: 'center' }, { u: g.xKey - 30, v: -KEYS_Z0 + 70, align: 'right' }] },
      { id: 'pianist', text: 'PIANIST', u: PIANIST_AT.grand.xKey - 450, v: -460, align: 'center', tone: 'illustrative', alts: [{ u: PIANIST_AT.grand.xKey - 450, v: 460, align: 'center' }] },
      { id: 'curve', text: 'CURVED SIDE', short: 'CURVE', u: g.curve.p.x + 140, v: g.curve.p.z + 120, align: 'left', tone: 'muted' },
    ];
  }
  const u = UP;
  const upHead = pianistAt(PIANIST_AT.upright.xKey, PIANIST_AT.upright.pedalX);
  if (view === 'side') {
    return [
      { id: 'top', text: 'TOP LID (OPEN)', short: 'LID', u: u.lid.tip.x + 30, v: u.lid.tip.y + 80, align: 'left' },
      { id: 'board', text: 'SOUNDBOARD', short: 'BOARD', u: u.soundboard.x1 + 30, v: 380, align: 'left' },
      { id: 'strings', text: 'STRINGS', u: -30, v: u.strings.y1 - 20, align: 'right', tone: 'muted' },
      { id: 'hammer', text: 'HAMMERS', u: -90, v: u.hammerY - 55, align: 'right' },
      { id: 'panel', text: s.panel ? 'FRONT PANEL' : 'PANEL OFF', u: u.panel.x - 30, v: u.panel.y0 + 40, align: 'right', tone: s.panel ? 'muted' : undefined },
      // WALL in the gap behind the piano, low, pointing at the wall (lab art
      // fix 2026-10-16: at the top it lay under the other view's inset and
      // ran a leader across the whole drawing); PIANIST above the head.
      { id: 'wall', text: 'WALL', u: u.wallX - 25, v: 230, align: 'right', tone: 'muted', at: { u: u.wallX, v: 230 }, alts: [{ u: u.wallX - 25, v: 560, align: 'right' }] },
      { id: 'pianist', text: 'PIANIST', u: upHead.head.x, v: upHead.head.y - upHead.headR - 150, align: 'center', tone: 'illustrative', at: { u: upHead.head.x, v: upHead.head.y - upHead.headR - 8 } },
    ];
  }
  return [
    { id: 'open', text: 'OPEN TOP', u: -80, v: -u.hw - 70, align: 'center' },
    { id: 'strings', text: 'STRINGS', u: 20, v: u.hw - 20, align: 'left', tone: 'muted' },
    { id: 'wall', text: 'WALL', u: u.wallX + 30, v: -880, align: 'center', tone: 'muted' },
    { id: 'keys', text: 'KEYS', u: u.xKey + 75, v: -KEYS_Z0 + 90, align: 'center', tone: 'muted', alts: [{ u: u.xKey + 75, v: -KEYS_Z0 + 170, align: 'center' }] },
    { id: 'pianist', text: 'PIANIST', u: u.xKey - 450, v: -460, align: 'center', tone: 'illustrative', alts: [{ u: u.xKey - 450, v: 460, align: 'center' }] },
  ];
}

/** The part under a model point (u, v) in this view; `tol` in mm. */
export function pianoHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const s = setupOf(variant);
  if (s.kind === 'grand') {
    const g = geomOf(variant);
    const pre = g === GS ? 'bg' : 'gp';
    const lidId = `${pre}.lid.${variant}`;
    if (view === 'side') {
      if (u >= g.xKey && u <= g.xKey + 150 && v >= KEY_TOP_Y - 10 - tol && v <= KEY_TOP_Y + 30 + tol) return `${pre}.keys`;
      if (u >= g.desk.x0 - 30 && u <= g.desk.x1 + 10 && v >= g.desk.y0 - tol && v <= g.desk.y1) return `${pre}.desk`;
      if (u >= 10 - tol && u <= 100 + tol && v >= -100 - tol && v <= -2) return `${pre}.dampers`;
      if (Math.abs(u) <= 30 + tol && v > 2 && v <= 90 + tol) return `${pre}.hammers`;
      if (u >= -300 && u <= -150 && v >= -45 - tol && v <= 120) return `${pre}.pins`;
      if (u >= -200 && u <= g.xTail && Math.abs(v - 0) <= 24 + tol) return `${pre}.strings`;
      if (u >= -120 && u <= g.xTail && v >= 60 && v <= 135 + tol) return `${pre}.soundboard`;
      if (u >= -140 && u <= g.xTail + 10 && v >= g.rimTop - tol && v <= g.caseBottom + tol) return `${pre}.rim`;
      if (s.lid !== 'off' && u >= -150 && u <= g.xTail && v < g.rimTop && v >= lidPoint(g, s.lid, u, Math.min(g.hw, g.bentZ(Math.max(u, g.xs))), 'top').y - tol) return lidId;
      if (u >= g.lyre.x - 200 && u <= g.lyre.x + 90 && v >= g.caseBottom && v <= FLOOR_Y) return `${pre}.lyre`;
      if (v > g.caseBottom && v <= FLOOR_Y && g.legs.some((l) => Math.abs(u - l.x) <= 70 + tol)) return `${pre}.leg0`;
      if (u < g.xKey - 200 && v > -650 && v < FLOOR_Y) return variant === 'baby' ? 'bench.grand' : 'bench.grand';
      return null;
    }
    // plan
    if (u >= g.xKey && u <= g.xKey + 150 && Math.abs(v) <= -KEYS_Z0 + tol) return `${pre}.keys`;
    if (u >= g.desk.x0 - 10 && u <= g.desk.x1 + 10 && Math.abs(v) <= g.desk.hw + tol) return `${pre}.desk`;
    if (u >= -300 && u <= -140 && Math.abs(v) <= g.hw) return `${pre}.pins`;
    for (const h of g.holes) if (Math.hypot(u - h.c.x, v - h.c.z) <= h.r + 12 + tol) return `${pre}.holes`;
    if (u >= 10 && u <= 100 && v >= g.dampers.z0 - tol && v <= g.dampers.z1 + tol) return `${pre}.dampers`;
    if (Math.abs(u) <= 8 + tol && Math.abs(v) <= -KEYS_Z0) return `${pre}.hammers`;
    const nearString = g.strings.some((st) => segNear(u, v, st.a[0], st.a[1], st.b[0], st.b[1], 6 + tol));
    if (nearString) return `${pre}.strings`;
    if (g.longBridge.some((p, i) => i > 0 && segNear(u, v, g.longBridge[i - 1][0], g.longBridge[i - 1][1], p[0], p[1], 14 + tol))) return `${pre}.bridges`;
    if (u > -140 && u < g.xTail && v > -g.hw + 55 && v < g.bentZ(u) - 55 && v > -g.hw) return `${pre}.frame`;
    if (u >= g.xKey && u <= g.xTail + tol && v >= -g.hw - tol && v <= g.hw + tol) return `${pre}.rim`;
    if (u < g.xKey - 100) return 'bench.grand';
    return null;
  }
  const w = UP;
  if (view === 'side') {
    if (u >= w.wallX - tol) return 'up.wall';
    if (Math.abs(u - (w.lid.hinge.x + w.lid.tip.x) / 2) <= 70 + tol && v < w.yTop) return 'up.top';
    if (u >= w.soundboard.x0 - 4 && u <= w.xBack + tol && v >= w.yTop) return 'up.back';
    if (Math.abs(u) <= 16 + tol && v >= w.strings.y0 && v <= w.strings.y1) return 'up.strings';
    if (u >= w.actionFront && u < -14 && v >= w.hammerY - 170 && v <= KEY_TOP_Y - 10) return 'up.action';
    if (s.panel && u >= w.panel.x - 30 - tol && u <= w.panel.x + tol && v >= w.panel.y0 && v <= w.panel.y1) return 'up.panel';
    if (u >= w.xKey && u <= w.panel.x && v >= KEY_TOP_Y - 10 - tol && v <= KEY_TOP_Y + 40) return 'up.keys';
    // The pedals as drawn: out of the bottom board's toe rail (art pass 2026-10-10).
    if (u >= w.lower.x - 190 - tol && u <= w.lower.x && v >= FLOOR_Y - 80 - tol) return 'up.pedals';
    if (u >= w.lower.x - 30 && u <= -14 && v >= w.keybedY + 30) return 'up.lower';
    if (u < w.xKey - 200 && v > -650) return 'bench.upright';
    return null;
  }
  if (u >= w.wallX - tol) return 'up.wall';
  if (u >= w.xBack - 4 && u <= w.lid.tip.x + tol && Math.abs(v) <= w.hw) return 'up.top';
  if (u >= w.soundboard.x0 && u <= w.xBack && Math.abs(v) <= w.hw) return 'up.back';
  if (Math.abs(u) <= 12 + tol && Math.abs(v) <= w.hw) return 'up.strings';
  if (u >= -100 && u < -12 && Math.abs(v) <= w.hw) return 'up.action';
  if (u >= w.xKey && u <= w.xKey + 150 && Math.abs(v) <= -KEYS_Z0 + tol) return 'up.keys';
  if (u < w.xKey - 100) return 'bench.upright';
  return null;
}

function segNear(px: number, pz: number, ax: number, az: number, bx: number, bz: number, r: number): boolean {
  const vx = bx - ax;
  const vz = bz - az;
  const l2 = vx * vx + vz * vz || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l2));
  return Math.hypot(px - (ax + vx * t), pz - (az + vz * t)) <= r;
}

/** Lid underside height at plan z (the sound page's radiation drawing). */
export const lidUnder = (v: VariantId, z: number) => {
  const s = setupOf(v);
  return s.kind === 'grand' ? lidUnderY(geomOf(v), s.lid, z) : UP.yTop;
};

export const PIANO_BASE_ART: Pick<LessonArt, 'Instrument' | 'labels' | 'hitTest'> = {
  Instrument: PianoArt,
  labels: pianoLabels,
  hitTest: pianoHitTest,
};
