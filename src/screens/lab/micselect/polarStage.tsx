/**
 * The POLAR-PATTERN STAGE of the Microphone Selection Lab, lesson 3 (art fix
 * 2026-10-16, lab-art grading: "the microphone is a bare orange dot; the
 * stage neighbours are text only; the tags sit on the pattern line").
 *
 * A TOP VIEW of a stage vocal mic and what is around it, drawn with the
 * house art (no stand-ins): the handheld vocal mic at the centre, its grille
 * aimed at the singer; the singer (the shared plan figure, SINGER_TOP) just
 * upstage of it; the drum kit to the side (the shared drum family from
 * above); the 2-way floor wedge behind the mic, aimed back at the singer;
 * the audience as its empty chairs downstage; a hard side wall; an HVAC
 * supply diffuser.
 *
 * DIRECTIONS ONLY, NOT TO SCALE (the badge says so): a polar pattern is a
 * sensitivity-versus-ANGLE plot, so each neighbour sits at its true bearing
 * on a ring OUTSIDE the full-pickup circle — the pattern can never run
 * under a word. A dashed bearing line runs from the mic to each neighbour;
 * where it crosses the outline is how much of that neighbour the mic hears
 * (the dotted ring = full pickup). Each neighbour's name and verdict sit on
 * the far side of its drawing, away from the pattern (≥ 10 pt).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Line as SkLine, LinearGradient, Path as SkPath, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { HandheldMic } from '../../../features/lab/micDrawings';
import { ChairsTop, makeChairsTop, CHAIR_PITCH_MM } from '../../../features/lab/audienceChairs';
import { PlayerBehind, PlayerInFront } from '../miking/lessons/shared/players/PlayerFigure';
import { SINGER_TOP } from '../miking/lessons/shared/voice/voicePose';
import { Wedge2WayTop } from '../miking/lessons/shared/wedge2Way';
import { CymbalPlan, DrumPlan, KickFromAbove, topTransform } from '../miking/lessons/shared/drums/DrumArt';
import { KICK_22x18 } from '../miking/lessons/shared/drums/drumSpec';
import { KIT, KIT_CYMBALS, KIT_DRUMS } from '../miking/lessons/shared/kitPlanModel';
import { colors, fonts } from '../../../theme/tokens';
import { polarR, STAGE_SOURCES, type PatternKey } from './micSelectData';

/** The px-per-mm every neighbour is drawn at (one scale for all of them). */
const K = 0.046;
/** The mic is the subject: drawn larger than the neighbours (not to scale). */
const MIC_GRILLE_R = 7.5;
const MIC_BODY = 30;

export type Verdict = { v: string; c: string };

/** Where a neighbour sits: its bearing on the ring, the ring's radius as a
 *  multiple of the full-pickup radius, and the drawing's half-size (px)
 *  along the bearing, so the bearing line stops at its edge. */
function placeOf(angleDeg: number, ring: number, cx: number, cy: number, R: number) {
  const a = (angleDeg * Math.PI) / 180;
  const r = ring * R;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a), ux: Math.sin(a), uy: -Math.cos(a), r };
}

/** Ring radius (× R) and the drawing's radius (px) per neighbour. */
const LAYOUT: Record<string, { ring: number; half: number }> = {
  source: { ring: 1.55, half: 16 },
  audience: { ring: 1.62, half: 26 },
  drums: { ring: 1.74, half: 32 },
  monitor: { ring: 1.45, half: 14 },
  wall: { ring: 1.55, half: 12 },
  hvac: { ring: 1.55, half: 12 },
};

/** The kit from above, in mm, the drummer upstage of it (the house kit). */
function KitTop() {
  return (
    <Group>
      <Circle cx={KIT.throne.c.u} cy={KIT.throne.c.v} r={KIT.throne.r}>
        <RadialGradient c={vec(KIT.throne.c.u - 60, KIT.throne.c.v - 70)} r={300} colors={['#4a4e57', '#24262c', '#0e0f12']} />
      </Circle>
      {(['floor', 'snare'] as const).map((id) => (
        <Group key={id} transform={topTransform(KIT_DRUMS[id])}>
          <DrumPlan drum={KIT_DRUMS[id]} />
        </Group>
      ))}
      <KickFromAbove spec={KICK_22x18} u0={0} z={0} pedal={KIT.kick.pedal} />
      {(['tom1', 'tom2'] as const).map((id) => (
        <Group key={id} transform={topTransform(KIT_DRUMS[id])}>
          <DrumPlan drum={KIT_DRUMS[id]} />
        </Group>
      ))}
      {(['hihat', 'crash1', 'crash2', 'ride'] as const).map((id) => (
        <CymbalPlan key={id} cx={KIT_CYMBALS[id].c.x} cz={KIT_CYMBALS[id].c.z} d={KIT_CYMBALS[id].d} tiltDeg={KIT_CYMBALS[id].tiltDeg} dim={0.6} />
      ))}
    </Group>
  );
}

/** A square ceiling/wall supply diffuser from the front: the frame, three
 *  nested louvre rings and the dark core (a 600 mm module, in mm). */
function DiffuserTop() {
  const p = useMemo(() => {
    const rings = Skia.Path.Make();
    for (const s of [250, 190, 130]) rings.addRRect(Skia.RRectXY(Skia.XYWHRect(-s, -s, s * 2, s * 2), 14, 14));
    const frame = Skia.Path.Make();
    frame.addRRect(Skia.RRectXY(Skia.XYWHRect(-300, -300, 600, 600), 24, 24));
    const diag = Skia.Path.Make();
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const) {
      diag.moveTo(x * 70, y * 70);
      diag.lineTo(x * 250, y * 250);
    }
    return { rings, frame, diag };
  }, []);
  return (
    <Group>
      <SkPath path={p.frame}>
        <LinearGradient start={vec(-300, -300)} end={vec(300, 300)} colors={['#c9ccd3', '#8d929c', '#5a5e67']} />
      </SkPath>
      <SkPath path={p.rings} style="stroke" strokeWidth={34} color="#3a3d44" />
      <SkPath path={p.rings} style="stroke" strokeWidth={10} color="#b4b9c3" />
      <SkPath path={p.diag} style="stroke" strokeWidth={14} color="#6a6f7a" />
      <Circle cx={0} cy={0} r={70} color="#16171b" />
    </Group>
  );
}

/** A section of hard wall (plaster on block), 1.4 m long, 240 mm thick, its
 *  face toward +y: the cut poché with its hatch. In mm. */
function WallTop() {
  const p = useMemo(() => {
    const body = Skia.Path.Make();
    body.addRect(Skia.XYWHRect(-700, -120, 1400, 240));
    const hatch = Skia.Path.Make();
    for (let x = -940; x < 700; x += 70) {
      hatch.moveTo(x, 120);
      hatch.lineTo(x + 240, -120);
    }
    return { body, hatch };
  }, []);
  return (
    <Group>
      <SkPath path={p.body} color="#3c3f47" />
      <Group clip={p.body}>
        <SkPath path={p.hatch} style="stroke" strokeWidth={14} color="#7d828c" opacity={0.7} />
      </Group>
      <SkPath path={p.body} style="stroke" strokeWidth={18} color="#a9aeb8" />
    </Group>
  );
}

/** The audience: two rows of three empty chairs facing the stage (−y). */
function AudienceTop() {
  const chairs = useMemo(() => {
    const at: { x: number; y: number; rotation: number }[] = [];
    for (const row of [0, 1]) for (const col of [-1, 0, 1]) at.push({ x: col * 560, y: row * CHAIR_PITCH_MM, rotation: Math.PI });
    return makeChairsTop(at);
  }, []);
  return <ChairsTop seats={chairs.seats} backs={chairs.backs} color="#aab0bd" strokeWidth={22} />;
}

export function PolarStage({ w, h, pattern, verdictFor }: { w: number; h: number; pattern: PatternKey; verdictFor: (angleDeg: number, wanted: boolean) => Verdict }) {
  const cx = w / 2;
  const cy = h / 2 + 4;
  // Full-pickup radius: the widest neighbour ring plus its drawing and its
  // two-line tag must fit inside the box.
  const R = Math.max(54, Math.min(76, (w / 2 - 50) / 1.74));

  const patternPath = useMemo(() => {
    const p = Skia.Path.Make();
    const N = 180;
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2;
      const r = polarR(pattern, th) * R;
      const x = cx + r * Math.sin(th);
      const y = cy - r * Math.cos(th);
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    return p;
  }, [pattern, R, cx, cy]);

  const places = STAGE_SOURCES.map((s) => {
    const L = LAYOUT[s.key] ?? { ring: 1.55, half: 12 };
    const at = placeOf(s.angleDeg, L.ring, cx, cy, R);
    const vd = verdictFor(s.angleDeg, s.wanted === true);
    const pick = polarR(pattern, (s.angleDeg * Math.PI) / 180);
    return { s, L, at, vd, pick };
  });

  const art = (key: string, x: number, y: number) => {
    switch (key) {
      case 'source':
        // The singer just upstage of the mic, facing it and the house (+y):
        // frame V's lips at the origin, the chest toward +x, turned a quarter.
        return (
          <Group key={key} transform={[{ translateX: x }, { translateY: y + 3 }, { rotate: Math.PI / 2 }, { scale: K * 2.1 }]}>
            <PlayerBehind pose={SINGER_TOP} />
            <PlayerInFront pose={SINGER_TOP} hands={false} />
          </Group>
        );
      case 'drums':
        // The kit faces the house too: its kick (+x) turned toward +y.
        return (
          <Group key={key} transform={[{ translateX: x + 6 }, { translateY: y - 2 }, { rotate: Math.PI / 2 }, { scale: K * 0.6 }, { translateX: 200 }]}>
            <KitTop />
          </Group>
        );
      case 'monitor':
        // The wedge behind the mic, its baffle aimed back up at the singer.
        return (
          <Group key={key} transform={[{ translateX: x }, { translateY: y }, { rotate: -Math.PI / 2 }, { scale: K }]}>
            <Wedge2WayTop shadow />
          </Group>
        );
      case 'audience':
        return (
          <Group key={key} transform={[{ translateX: x }, { translateY: y - 8 }, { scale: K * 0.62 }]}>
            <AudienceTop />
          </Group>
        );
      case 'wall': {
        // The wall's face turned toward the mic.
        const a = Math.atan2(cy - y, cx - x) - Math.PI / 2;
        return (
          <Group key={key} transform={[{ translateX: x }, { translateY: y }, { rotate: a }, { scale: K * 0.42 }]}>
            <WallTop />
          </Group>
        );
      }
      case 'hvac':
        return (
          <Group key={key} transform={[{ translateX: x }, { translateY: y }, { scale: K * 0.85 }]}>
            <DiffuserTop />
          </Group>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={`Top view of a stage vocal microphone aimed at the singer, with the ${pattern} pickup pattern drawn around it and the drum kit, wedge monitor, audience, side wall and HVAC vent at their directions.`}>
        {/* the full-pickup ring (dotted) and the mic's axes */}
        <Circle cx={cx} cy={cy} r={R} style="stroke" strokeWidth={1} color="#3a3b44">
          <DashPathEffect intervals={[2, 4]} />
        </Circle>
        <SkLine p1={vec(cx, cy - R - 4)} p2={vec(cx, cy + R + 4)} color="#26262c" strokeWidth={1} />
        <SkLine p1={vec(cx - R - 4, cy)} p2={vec(cx + R + 4, cy)} color="#26262c" strokeWidth={1} />
        <SkPath path={patternPath} color="rgba(255,198,77,0.16)" />
        <SkPath path={patternPath} style="stroke" strokeWidth={2} color={colors.amber} />
        {/* bearing lines: mic → each neighbour; the dot = how much it is heard */}
        {places.map(({ s, L, at, vd, pick }) => (
          <Group key={`b-${s.key}`}>
            <SkLine p1={vec(cx + at.ux * (MIC_GRILLE_R + 2), cy + at.uy * (MIC_GRILLE_R + 2))} p2={vec(cx + at.ux * (at.r - L.half - 2), cy + at.uy * (at.r - L.half - 2))} color={vd.c} strokeWidth={1.2} opacity={0.55}>
              <DashPathEffect intervals={[4, 3]} />
            </SkLine>
            <Circle cx={cx + at.ux * pick * R} cy={cy + at.uy * pick * R} r={3.4} color={vd.c} />
            <Circle cx={cx + at.ux * pick * R} cy={cy + at.uy * pick * R} r={3.4} style="stroke" strokeWidth={1} color="#0b0b0e" />
          </Group>
        ))}
        {places.map(({ s, at }) => art(s.key, at.x, at.y))}
        {/* the handheld vocal mic, grille on the centre, aimed at the singer */}
        <HandheldMic x={cx} y={cy} angleDeg={0} grilleR={MIC_GRILLE_R} bodyLen={MIC_BODY} />
      </Canvas>
      <Text style={[st.badge, { left: 10, top: 8 }]}>TOP VIEW · DIRECTIONS ONLY, NOT TO SCALE</Text>
      {places.map(({ s, L, at, vd }) => {
        // The tag on the far side of the drawing, away from the pattern.
        const below = at.y > cy - 6;
        const top = below ? at.y + L.half + 2 : at.y - L.half - 30;
        const left = Math.max(4, Math.min(w - 4 - TAG_W, at.x - TAG_W / 2));
        return (
          <View key={`t-${s.key}`} style={[st.tag, { left, top }]} pointerEvents="none">
            <Text style={[st.tagName, { color: s.wanted ? colors.green : '#a4a6b0' }]}>
              {s.label}
            </Text>
            <Text style={[st.tagVerdict, { color: vd.c }]}>
              {vd.v}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const TAG_W = 96;

const st = StyleSheet.create({
  badge: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.8, color: '#6c6e78' },
  tag: { position: 'absolute', width: TAG_W, alignItems: 'center' },
  tagName: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.5, lineHeight: 13 },
  tagVerdict: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 0.4, lineHeight: 13 },
});
