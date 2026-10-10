/**
 * M04c TIMBALES — the look (charter §2 layer 3), drawn only from model.ts /
 * geometry.ts anchors with the hand-drum family's parts: shallow BRASS shells
 * (LP-257), chrome rims, the stand, and — with a bell — the bracket and a
 * cowbell. Side view: an elevation from the player's right (the 15 in in
 * front, the 14 in behind it). Lug counts, the stand and the bell's size are
 * drawing defaults (never stated in words). Head material is not given by the
 * source; a plain film is drawn.
 */
import { useMemo } from 'react';
import { BlurMask, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { ArtLabel } from '../../engine/scene/sceneTypes.ts';
import { ContactShadow, FloorSide, HeadTop, INK, ShellSide, StandLegs } from '../shared/handdrums/handDrumArt';
import { planDist, rimTopY } from '../shared/handdrums/handDrumModel.ts';
import { BELL, HEAD_Y, LARGE, SMALL, TIMB_DIMS as D } from './model.ts';
import { STAND, TIMB_MODEL } from './geometry.ts';

const LUGS = D.lugs.mm;
const BELL_DARK = ['#5a5f69', '#2b2e35', '#15161a', '#08080a'];

/** A cowbell: a tapered box, mouth toward the player, in side or top view. */
function Cowbell({ view }: { view: ViewId }) {
  const g = useMemo(() => {
    const body = Skia.Path.Make();
    const v = view === 'side' ? BELL.y : BELL.z;
    // Mouth (−x, wider) to the closed end (+x, narrower): 150 mm long.
    body.moveTo(BELL.x - 110, v - 38);
    body.lineTo(BELL.x + 40, v - 24);
    body.lineTo(BELL.x + 40, v + 24);
    body.lineTo(BELL.x - 110, v + 38);
    body.close();
    const mouth = Skia.Path.Make();
    mouth.moveTo(BELL.x - 110, v - 38);
    mouth.lineTo(BELL.x - 110, v + 38);
    const edge = Skia.Path.Make();
    edge.moveTo(BELL.x - 100, v - 30);
    edge.lineTo(BELL.x + 34, v - 19);
    return { body, mouth, edge, v };
  }, [view]);
  return (
    <Group>
      <Group transform={[{ translateX: 6 }, { translateY: 8 }]}>
        <Path path={g.body} color="#000" opacity={0.5}>
          <BlurMask blur={6} style="normal" />
        </Path>
      </Group>
      <Path path={g.body}>
        <LinearGradient start={vec(BELL.x, g.v - 38)} end={vec(BELL.x, g.v + 38)} colors={BELL_DARK} />
      </Path>
      <Path path={g.edge} style="stroke" strokeWidth={3} color="#d4d8e0" opacity={0.55} />
      <Path path={g.mouth} style="stroke" strokeWidth={5} color="#0a0a0c" />
      <Path path={g.body} style="stroke" strokeWidth={1.4} color={INK} />
    </Group>
  );
}

function Bracket({ view }: { view: ViewId }) {
  const p = useMemo(() => {
    const s = Skia.Path.Make();
    const a = STAND.bracket.a;
    const b = STAND.bracket.b;
    s.moveTo(a.x, view === 'side' ? a.y : a.z);
    s.lineTo(b.x, view === 'side' ? b.y : b.z);
    return s;
  }, [view]);
  return (
    <>
      <Path path={p} style="stroke" strokeWidth={14} strokeCap="round" color={INK} />
      <Path path={p} style="stroke" strokeWidth={10} strokeCap="round" color="#5b5f69" />
      <Path path={p} style="stroke" strokeWidth={3} strokeCap="round" color="#e4e7ed" opacity={0.6} />
    </>
  );
}

export function TimbaleArt({ view, variant }: { view: ViewId; variant: VariantId }) {
  const bell = variant === 'bell';
  const legs = useMemo(() => [{ top: STAND.top, foot: STAND.hub }, ...STAND.legs.map((l) => ({ top: l.a, foot: l.b }))], []);
  if (view === 'side') {
    return (
      <Group>
        <FloorSide y={0} u0={TIMB_MODEL.views.side!.u0} u1={TIMB_MODEL.views.side!.u1} />
        <ContactShadow cx={0} cy={2} rx={340} ry={9} />
        <StandLegs legs={legs} view="side" ring={{ cx: 0, cv: 0, r: 40, y: STAND.top.y + 8 }} />
        {bell ? <Bracket view="side" /> : null}
        <ShellSide d={SMALL} look="brass" staves={0} lugs={LUGS} plateDown={D.depth.mm - 30} rimDepth={18} hardware="casing" dim />
        <ShellSide d={LARGE} look="brass" staves={0} lugs={LUGS} plateDown={D.depth.mm - 30} rimDepth={18} hardware="casing" />
        {bell ? <Cowbell view="side" /> : null}
      </Group>
    );
  }
  return (
    <Group>
      <StandLegs legs={legs.slice(1)} view="top" ring={{ cx: 0, cv: 0, r: 0 }} />
      <HeadTop d={SMALL} look="film" lugs={LUGS} seed={3} rimColors={['#ffffff', '#c8ccd4', '#8a8f99', '#3a3d45']} />
      <HeadTop d={LARGE} look="film" lugs={LUGS} seed={9} rimColors={['#ffffff', '#c8ccd4', '#8a8f99', '#3a3d45']} />
      {bell ? (
        <>
          <Bracket view="top" />
          <Cowbell view="top" />
        </>
      ) : null}
    </Group>
  );
}

export function timbaleLabels(view: ViewId, variant: VariantId): ArtLabel[] {
  const top = rimTopY(LARGE);
  if (view === 'side') {
    const out: ArtLabel[] = [
      { id: 'large', text: '15 IN (IN FRONT)', short: '15 IN', u: LARGE.R + 30, v: top - 26, align: 'left' },
      { id: 'small', text: '14 IN BEHIND IT', short: '14 IN', u: LARGE.R + 30, v: top + 60, align: 'left', tone: 'muted' },
      { id: 'shell', text: 'BRASS SHELL', short: 'SHELL', u: LARGE.R + 30, v: LARGE.bottomY + 4, align: 'left', tone: 'muted' },
      { id: 'stand', text: 'STAND', u: 60, v: -420, align: 'left', tone: 'muted' },
      { id: 'player', text: '← PLAYER', u: TIMB_MODEL.views.side!.u0 + 20, v: top - 26, align: 'left', tone: 'muted', point: { u: TIMB_MODEL.views.side!.u0 - 400, v: top - 26 } },
    ];
    if (variant === 'bell') out.push({ id: 'bell', text: 'COWBELL', u: BELL.x - 120, v: BELL.y - 60, align: 'right', tone: 'muted' });
    return out;
  }
  const out: ArtLabel[] = [
    { id: 'small', text: '14 IN', u: SMALL.c.x, v: SMALL.c.z - SMALL.R - 44, align: 'center' },
    { id: 'large', text: '15 IN', u: LARGE.c.x, v: LARGE.c.z + LARGE.R + 34, align: 'center' },
    { id: 'player', text: '← PLAYER', u: TIMB_MODEL.views.top!.u0 + 20, v: 0, align: 'left', tone: 'muted', point: { u: TIMB_MODEL.views.top!.u0 - 400, v: 0 } },
    { id: 'aud', text: 'AUDIENCE →', u: TIMB_MODEL.views.top!.u1 - 20, v: TIMB_MODEL.views.top!.v1 - 36, align: 'right', tone: 'muted' },
  ];
  return out;
}

export function timbaleHitTest(view: ViewId, variant: VariantId, u: number, v: number, tol: number): string | null {
  const bv = view === 'side' ? BELL.y : BELL.z;
  if (variant === 'bell' && u >= BELL.x - 110 - tol && u <= BELL.x + 40 + tol && Math.abs(v - bv) <= 40 + tol) return 'timb.bell';
  if (view === 'top') {
    for (const d of [SMALL, LARGE]) if (planDist({ x: u, y: 0, z: v }, d.c.x, d.c.z) <= d.R + d.rim.t + tol) return `${d.id}.head`;
    if (Math.hypot(u, v) <= 340 + tol) return 'timb.stand';
    return null;
  }
  const top = rimTopY(LARGE);
  if (Math.abs(u - LARGE.c.x) <= LARGE.R + LARGE.rim.t + tol && v >= top - tol && v <= HEAD_Y + 20) return 'large.head';
  if (Math.abs(u - LARGE.c.x) <= LARGE.R + tol && v > HEAD_Y + 20 && v <= LARGE.bottomY + tol) return 'large.shell';
  if (v > LARGE.bottomY && Math.abs(u) <= 340) return 'timb.stand';
  return null;
}

