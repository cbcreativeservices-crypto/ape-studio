/**
 * THE VOICE FAMILY — the look (charter §2 layer 3). The singer IS the
 * instrument: the shared player figure (players/PlayerFigure — the head drawn
 * as part of the body, FigureHead; owner 2026-10-06), standing in profile
 * from the singer's right (the side view) and from above (the top view),
 * placed so its mouth sits on the lip point every distance is read from.
 *
 * Details the voice needs on top of the figure:
 *   • the open mouth — a small dark opening between the lips (where the
 *     voice leaves);
 *   • closed-back headphones in the studio (the cups over the ears, the band
 *     over the crown);
 *   • E03's WORKING ZONE: where the head travels as the rapper moves (dashed
 *     amber, a drawing default) — the mic stays outside it.
 * Static (nothing moves, D8). Labels name the parts a mic decision needs and
 * sit in clear air on a leader (artLabels.layoutArtLabels).
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { DocumentedZone, VariantId, ViewId } from '../../../engine/model/types.ts';
import type { ArtLabel, LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { PlayerBehind, PlayerInFront, figureCovers } from '../players/PlayerFigure';
import { EAR, EAR_HALF, HEAD_C, HEAD_R, NOSE, VOICE_DIMS } from './voiceSpec.ts';
import { SINGER_NECK, SINGER_SIDE, SINGER_SOLIDS, SINGER_TOP } from './voicePose.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

export type VoiceArtOpts = {
  /** Variants in which the singer wears closed-back headphones. */
  phones?: readonly VariantId[];
  /** Variants that draw the rapper's working zone (E03). */
  workZone?: readonly VariantId[];
};

/** The larynx (the vocal folds), low in the throat: a simplified picture. */
export const FOLDS = { x: -68, y: 96 };

/* ── the open mouth and the headphones ── */

function mouthPath(view: ViewId): SkPath {
  const p = make();
  if (view === 'side') {
    // Between the lips: a small dark lens just behind the lip point.
    p.moveTo(1.5, -2.5);
    p.cubicTo(-4, -4.5, -11, -3.5, -14, 0);
    p.cubicTo(-11, 3.5, -4, 4.5, 1.5, 2.5);
    p.close();
  }
  return p;
}

const PHONE_RAMP = ['#4b4f59', '#2a2d34', '#15161a', '#0a0b0d'];

function phonesPaths(view: ViewId) {
  const cup = make();
  const band = make();
  const pad = make();
  if (view === 'side') {
    cup.addRRect(Skia.RRectXY(Skia.XYWHRect(EAR.x - 40, EAR.y - 52, 80, 104), 34, 38));
    pad.addRRect(Skia.RRectXY(Skia.XYWHRect(EAR.x - 30, EAR.y - 42, 60, 84), 26, 30));
    // The band up the side of the head and over the crown (seen edge-on).
    band.moveTo(EAR.x + 4, EAR.y - 50);
    band.cubicTo(EAR.x + 10, EAR.y - 100, HEAD_C.x - 24, HEAD_C.y - HEAD_R - 12, HEAD_C.x - 6, HEAD_C.y - HEAD_R - 14);
  } else {
    for (const s of [-1, 1]) {
      cup.addRRect(Skia.RRectXY(Skia.XYWHRect(HEAD_C.x - 46, s * (EAR_HALF + 12) - 20, 88, 40), 30, 20));
      pad.addRRect(Skia.RRectXY(Skia.XYWHRect(HEAD_C.x - 36, s * (EAR_HALF - 4) - 6, 68, 12), 6, 6));
    }
    band.moveTo(HEAD_C.x - 8, -(EAR_HALF + 14));
    band.cubicTo(HEAD_C.x - 2, -40, HEAD_C.x - 2, 40, HEAD_C.x - 8, EAR_HALF + 14);
  }
  return { cup, band, pad };
}

function Headphones({ view }: { view: ViewId }) {
  const p = useMemo(() => phonesPaths(view), [view]);
  const b = p.cup.getBounds();
  return (
    <Group>
      <Path path={p.band} style="stroke" strokeWidth={16} strokeCap="round" color="#0a0b0d" />
      <Path path={p.band} style="stroke" strokeWidth={11} strokeCap="round" color="#3a3d45" />
      <Group transform={[{ translateX: -1.5 }, { translateY: -2 }]}>
        <Path path={p.band} style="stroke" strokeWidth={3} strokeCap="round" color="#c9ced8" opacity={0.45} />
      </Group>
      <Path path={p.cup}>
        <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={PHONE_RAMP} positions={[0, 0.35, 0.7, 1]} />
      </Path>
      <Path path={p.pad} color="#050506" opacity={0.6} />
      <Path path={p.cup} style="stroke" strokeWidth={2.4} color="#050506" />
      <Group transform={[{ translateX: -1.4 }, { translateY: -1.8 }]}>
        <Path path={p.cup} style="stroke" strokeWidth={1.4} color="#c9ced8" opacity={0.4} />
      </Group>
    </Group>
  );
}

/** E03's working zone: the head's sphere swept forward and back (and a little
 *  up and down) — the room the moving head needs, a drawing default. */
export function workZonePath(view: ViewId): SkPath {
  const f = VOICE_DIMS.workFwd.mm;
  const bk = VOICE_DIMS.workBack.mm;
  const ud = view === 'side' ? VOICE_DIMS.workUpDown.mm : 30;
  const r = HEAD_R;
  const p = make();
  const cv = view === 'side' ? HEAD_C.y : 0;
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(HEAD_C.x - bk - r, cv - ud - r, bk + f + 2 * r, 2 * (ud + r)), r, r));
  return p;
}

function WorkZone({ view }: { view: ViewId }) {
  const p = useMemo(() => workZonePath(view), [view]);
  return (
    <Group>
      <Path path={p} color="#ffc64d" opacity={0.06} />
      <Path path={p} style="stroke" strokeWidth={4} color="#ffc64d" opacity={0.75}>
        <DashPathEffect intervals={[16, 11]} />
      </Path>
    </Group>
  );
}

/** The singer, in one view. */
export function VoiceFigure({ view, variant, opts = {} }: { view: ViewId; variant: VariantId; opts?: VoiceArtOpts }) {
  const pose = view === 'side' ? SINGER_SIDE : SINGER_TOP;
  const mouth = useMemo(() => mouthPath(view), [view]);
  const phones = !!opts.phones?.includes(variant);
  const work = !!opts.workZone?.includes(variant);
  return (
    <Group>
      {work ? <WorkZone view={view} /> : null}
      <PlayerBehind pose={pose} />
      <PlayerInFront pose={pose} hands={view === 'side'} />
      {view === 'side' ? <Path path={mouth} color="#24170f" opacity={0.92} /> : null}
      {phones ? <Headphones view={view} /> : null}
    </Group>
  );
}

export function makeVoiceInstrument(opts: VoiceArtOpts = {}): LessonArt['Instrument'] {
  return function VoiceInstrument({ view, variant }: { view: ViewId; variant: VariantId }) {
    return <VoiceFigure view={view} variant={variant} opts={opts} />;
  };
}

/* ── labels and the hit test ── */

export function voiceLabels(view: ViewId, variant: VariantId, opts: VoiceArtOpts = {}): ArtLabel[] {
  const phones = !!opts.phones?.includes(variant);
  const work = !!opts.workZone?.includes(variant);
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'v.mouth', text: 'MOUTH', u: 150, v: 150, align: 'left', at: { u: 0, v: 2 }, alts: [{ u: 130, v: -150, align: 'left' }, { u: 210, v: 60, align: 'left' }] },
      // (The nose and the head are named by a tap on THE PARTS: fewer words
      // round the face, where the mics and their dimensions go.)
      { id: 'v.folds', text: 'VOCAL FOLDS', short: 'FOLDS', u: 150, v: 250, align: 'left', at: { u: FOLDS.x, v: FOLDS.y }, alts: [{ u: 120, v: 330, align: 'left' }] },
      { id: 'v.chest', text: 'CHEST', u: 150, v: 410, align: 'left', at: { u: SINGER_SOLIDS.torso.kind === 'box' ? SINGER_SOLIDS.torso.max.x - 6 : 0, v: SINGER_NECK.y + 200 } },
    ];
    if (phones) out.push({ id: 'v.phones', text: 'HEADPHONES', short: 'PHONES', u: -300, v: -180, align: 'right', at: { u: EAR.x - 30, v: EAR.y - 20 }, alts: [{ u: -280, v: 40, align: 'right' }] });
    if (work) out.push({ id: 'v.work', text: 'WORKING ZONE', short: 'ZONE', u: -210, v: -250, align: 'center', tone: 'muted', at: { u: HEAD_C.x - 120, v: HEAD_C.y - HEAD_R - 30 } });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'v.mouth', text: 'MOUTH', u: 150, v: -140, align: 'left', at: { u: 2, v: 0 }, alts: [{ u: 150, v: 140, align: 'left' }] },
    { id: 'v.head', text: 'HEAD', u: HEAD_C.x, v: -200, align: 'center', at: { u: HEAD_C.x, v: -70 } },
    { id: 'v.chest', text: 'SHOULDERS', short: 'CHEST', u: -150, v: 300, align: 'center', at: { u: SINGER_NECK.x - 20, v: 180 } },
  ];
  if (phones) out.push({ id: 'v.phones', text: 'HEADPHONES', short: 'PHONES', u: -300, v: -230, align: 'right', at: { u: HEAD_C.x - 10, v: -(EAR_HALF + 18) } });
  return out;
}

const segD = (u: number, v: number, a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L2 = dx * dx + dy * dy;
  const t = L2 > 0 ? Math.max(0, Math.min(1, ((u - a.x) * dx + (v - a.y) * dy) / L2)) : 0;
  return Math.hypot(u - (a.x + dx * t), v - (a.y + dy * t));
};

export function voiceHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number, opts: VoiceArtOpts = {}): string | null {
  const phones = !!opts.phones?.includes(variant);
  const S = SINGER_SOLIDS;
  if (view === 'side') {
    if (Math.hypot(u - 0, v - 2) <= 16 + tol) return 'v.mouth';
    if (Math.hypot(u - (NOSE.x - 6), v - (NOSE.y + 4)) <= 15 + tol) return 'v.nose';
    if (phones && Math.hypot(u - EAR.x, v - EAR.y) <= 56 + tol) return 'v.phones';
    if (Math.hypot(u - HEAD_C.x, v - HEAD_C.y) <= HEAD_R + tol) return 'v.head';
    if (Math.hypot(u - FOLDS.x, v - FOLDS.y) <= 26 + tol) return 'v.folds';
    if (S.neck.kind === 'capsule' && segD(u, v, S.neck.a, S.neck.b) <= S.neck.r + tol) return 'player.neck';
    if (S.torso.kind === 'box' && u >= S.torso.min.x - tol && u <= S.torso.max.x + tol && v >= S.torso.min.y - tol && v <= S.torso.max.y + tol) return 'v.chest';
    if (S.legs.kind === 'box' && u >= S.legs.min.x - tol && u <= S.legs.max.x + tol && v >= S.legs.min.y - tol && v <= S.legs.max.y + tol) return 'player.legs';
    return null;
  }
  if (Math.hypot(u - 2, v) <= 16 + tol) return 'v.mouth';
  if (phones && Math.abs(Math.abs(v) - (EAR_HALF + 14)) <= 22 + tol && Math.abs(u - HEAD_C.x) <= 46 + tol) return 'v.phones';
  if (Math.hypot(u - HEAD_C.x, v) <= HEAD_R * 0.92 + tol) return 'v.head';
  if (S.torso.kind === 'box' && u >= S.torso.min.x - tol && u <= S.torso.max.x + tol && v >= S.torso.min.z - tol && v <= S.torso.max.z + tol) return 'v.chest';
  return null;
}

/** The words keep off the suggested starting points the scene is showing
 *  (each zone's drawn section, as its bounding box). */
export function voiceLabelObstacles(zones: readonly DocumentedZone[]): NonNullable<LessonArt['labelObstacles']> {
  return (view, _variant, shown) => {
    const out: { u0: number; u1: number; v0: number; v1: number }[] = [];
    for (const z of zones) {
      if (!shown.includes(z.id)) continue;
      for (const g of z.draw?.[view] ?? []) {
        if (!g.poly.length) continue;
        let u0 = Infinity;
        let u1 = -Infinity;
        let v0 = Infinity;
        let v1 = -Infinity;
        for (const [u, v] of g.poly) {
          u0 = Math.min(u0, u);
          u1 = Math.max(u1, u);
          v0 = Math.min(v0, v);
          v1 = Math.max(v1, v);
        }
        out.push({ u0: u0 - 8, u1: u1 + 8, v0: v0 - 8, v1: v1 + 8 });
      }
    }
    return out;
  };
}

/** The drawn figure covers (u, v): labels keep off it (artLabels). */
export function voiceFigureAt(view: ViewId, _variant: VariantId, u: number, v: number, tol: number): boolean {
  return figureCovers(view === 'side' ? SINGER_SIDE : SINGER_TOP, u, v, tol);
}
