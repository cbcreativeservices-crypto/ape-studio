/**
 * MEET IT for the voice — where the sound comes from (LESSON_JOURNEY §6
 * stage 1, §7 "voice: formants and directivity in words"). FULLY SILENT: the
 * voice is shown, never played. Two drawings on the singer in profile:
 *
 *   VoiceSequence  ① breath rises from the lungs up the windpipe; ② the vocal
 *                  folds in the voice box buzz; ③ the throat, the mouth and
 *                  the tongue shape the buzz into vowels and words; ④ the
 *                  sound leaves the mouth (and, on m, n, ng, the nose). Drawn
 *                  on VoiceCutaway: a SIMPLIFIED mid-sagittal picture of the
 *                  head, neck and upper chest (owner 2026-10-08 redraw), its
 *                  lips on the lip point.
 *   VoiceAir       what comes out with the sound: a vowel (no jet), a P or B
 *                  (a puff of air straight out along the mouth's axis — its
 *                  angle and reach drawn as an illustrative shape, no source
 *                  gives them) or an S or T (a narrow hiss forward).
 * Arrows and arcs show the ORDER and the DIRECTION of events — never a speed,
 * a level or a frequency. Nothing loops (D8): the page steps or plays once.
 */
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { ViewBox } from '../../../engine/model/types.ts';
import { PlayerBehind, PlayerInFront } from '../players/PlayerFigure';
import { SINGER_SIDE } from './voicePose.ts';
import { FOLDS } from './VoiceArt';
import { VoiceCutaway, type CutawayTint } from './VoiceCutaway';
import { NOSE, VOICE_DIMS } from './voiceSpec.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const AIR = '#9cc4ff';

function arrow(p: SkPath, x0: number, y0: number, x1: number, y1: number, head: number) {
  p.moveTo(x0, y0);
  p.lineTo(x1, y1);
  const a = Math.atan2(y1 - y0, x1 - x0);
  p.moveTo(x1 - head * Math.cos(a - 0.45), y1 - head * Math.sin(a - 0.45));
  p.lineTo(x1, y1);
  p.lineTo(x1 - head * Math.cos(a + 0.45), y1 - head * Math.sin(a + 0.45));
}

/** A fitted canvas with static labels over it. */
function Stage({ w, h, box, a11y, labels, children }: { w: number; h: number; box: ViewBox; a11y: string; labels: StaticLabel[]; children: ReactNode }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', box, w, h, 8), [w, h, box]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={a11y}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>{children}</Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** Sound leaving the mouth: arcs centred on the lips, widest ahead. */
function arcs(cx: number, cy: number, radii: number[], spread: number): SkPath {
  const p = make();
  for (const r of radii) p.addArc(Skia.XYWHRect(cx - r, cy - r, 2 * r, 2 * r), -spread, 2 * spread);
  return p;
}

export const SEQ_BOX: ViewBox = { u0: -345, u1: 330, v0: -200, v1: 345 };

export function VoiceSequence({ w, h, shown, accessibilityLabel }: { w: number; h: number; shown: number; accessibilityLabel: string }) {
  const breath = useMemo(() => {
    const p = make();
    arrow(p, -84, 336, -79, 268, 16);
    arrow(p, -77, 232, -72, 150, 16);
    return p;
  }, []);
  const buzz = useMemo(() => {
    const p = make();
    p.addCircle(FOLDS.x - 3, FOLDS.y - 16, 5.5);
    p.addCircle(FOLDS.x - 17, FOLDS.y - 30, 4.6);
    p.addCircle(FOLDS.x - 34, FOLDS.y - 46, 3.8);
    return p;
  }, []);
  const out = useMemo(() => arcs(4, 0, [40, 78, 116, 154], 62), []);
  const outNose = useMemo(() => arcs(NOSE.x - 6, NOSE.y + 8, [24, 46], 40), []);
  const s = shown;
  const tint: CutawayTint = {
    pipe: s >= 1 && s < 3 ? AIR : null,
    folds: s >= 2 ? AMBER : null,
    tract: s >= 3 ? AMBER : null,
    nasal: s >= 4 ? BLUE : null,
  };
  return (
    <Stage
      w={w}
      h={h}
      box={SEQ_BOX}
      a11y={accessibilityLabel}
      labels={[
        { id: 'lungs', text: 'FROM THE LUNGS', short: 'LUNGS', u: 40, v: 310, align: 'left', at: { u: -84, v: 330 }, tone: s >= 1 ? undefined : 'muted' },
        { id: 'folds', text: 'VOCAL FOLDS', short: 'FOLDS', u: 40, v: 160, align: 'left', at: { u: FOLDS.x + 4, v: FOLDS.y }, tone: s >= 2 ? 'amber' : 'muted' },
        { id: 'throat', text: 'THROAT · MOUTH', short: 'THROAT', u: -340, v: 120, align: 'left', at: { u: -106, v: 40 }, alts: [{ u: -330, v: 150, align: 'left' }], tone: s >= 3 ? 'amber' : 'muted' },
        { id: 'mouth', text: 'OUT OF THE MOUTH', short: 'MOUTH', u: 190, v: 70, align: 'left', at: { u: 60, v: 30 }, tone: s >= 4 ? 'blue' : 'muted' },
        ...(s >= 4 ? [{ id: 'nose', text: 'NOSE (m, n, ng)', short: 'NOSE', u: 120, v: -170, align: 'left' as const, at: { u: NOSE.x + 10, v: NOSE.y - 14 }, tone: 'blue' as const }] : []),
      ]}
    >
      {/* A cut through the middle of the head, neck and chest. */}
      <VoiceCutaway tint={tint} />
      {/* ① breath up the windpipe */}
      {s >= 1 ? <Path path={breath} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color={AIR} opacity={s === 1 ? 1 : 0.45} /> : null}
      {/* ② the buzz above the folds */}
      {s >= 2 ? <Path path={buzz} color={AMBER} opacity={s === 2 ? 0.9 : 0.45} /> : null}
      {/* ④ the sound leaving the mouth, and the nose's smaller share */}
      {s >= 4 ? (
        <Group>
          <Path path={out} style="stroke" strokeWidth={6} strokeCap="round" color={BLUE} opacity={0.85} />
          <Path path={outNose} style="stroke" strokeWidth={4} strokeCap="round" color={BLUE} opacity={0.45} />
        </Group>
      ) : null}
    </Stage>
  );
}

/* ── what comes out with it ── */

export type AirKind = 'vowel' | 'plosive' | 'sibilant';
export const AIR_BOX: ViewBox = { u0: -260, u1: 440, v0: -230, v1: 250 };

export function VoiceAir({ w, h, kind, accessibilityLabel }: { w: number; h: number; kind: AirKind; accessibilityLabel: string }) {
  const reach = VOICE_DIMS.jetReach.mm;
  const half = (VOICE_DIMS.jetHalfDeg.mm * Math.PI) / 180;
  const p = useMemo(() => {
    const jet = make();
    jet.moveTo(2, -4);
    jet.lineTo(reach, -Math.tan(half) * reach);
    jet.lineTo(reach, Math.tan(half) * reach);
    jet.lineTo(2, 4);
    jet.close();
    const hiss = make();
    const hh = Math.tan((6 * Math.PI) / 180);
    hiss.moveTo(2, 2);
    hiss.lineTo(reach * 0.85, 2 - hh * reach * 0.85);
    hiss.lineTo(reach * 0.85, 2 + hh * reach * 0.85);
    hiss.close();
    const axis = make();
    axis.moveTo(0, 0);
    axis.lineTo(AIR_BOX.u1 - 20, 0);
    const puffs = make();
    for (const [x, r] of [
      [70, 12],
      [140, 18],
      [215, 24],
    ] as const)
      puffs.addCircle(x, 0, r);
    const hissLines = make();
    for (let x = 40; x < reach * 0.8; x += 26) {
      hissLines.moveTo(x, -hh * x * 0.7);
      hissLines.lineTo(x + 12, hh * (x + 12) * 0.7);
    }
    return { jet, hiss, axis, puffs, hissLines, out: arcs(4, 0, [44, 90, 136, 182], 62) };
  }, [reach, half]);
  return (
    <Stage
      w={w}
      h={h}
      box={AIR_BOX}
      a11y={accessibilityLabel}
      labels={[
        { id: 'axis', text: 'THE MOUTH’S AXIS', short: 'AXIS', u: 380, v: -24, align: 'right', tone: 'muted' },
        ...(kind === 'plosive' ? [{ id: 'jet', text: 'A PUFF OF AIR', short: 'AIR', u: 250, v: -150, align: 'center' as const, at: { u: 200, v: -40 }, tone: 'blue' as const }] : []),
        ...(kind === 'sibilant' ? [{ id: 'hiss', text: 'A NARROW HISS', short: 'HISS', u: 250, v: -110, align: 'center' as const, at: { u: 180, v: -10 }, tone: 'amber' as const }] : []),
        ...(kind === 'vowel' ? [{ id: 'snd', text: 'SOUND, ALL ROUND THE FRONT', short: 'SOUND', u: 240, v: 190, align: 'center' as const, tone: 'blue' as const }] : []),
      ]}
    >
      <PlayerBehind pose={SINGER_SIDE} dim={0.9} />
      <PlayerInFront pose={SINGER_SIDE} dim={0.9} />
      <Path path={p.axis} style="stroke" strokeWidth={3} color="#e8eaee" opacity={0.5}>
        <DashPathEffect intervals={[14, 10]} />
      </Path>
      {kind === 'vowel' ? <Path path={p.out} style="stroke" strokeWidth={6} strokeCap="round" color={BLUE} opacity={0.8} /> : null}
      {kind === 'plosive' ? (
        <Group>
          <Path path={p.jet}>
            <LinearGradient start={vec(0, 0)} end={vec(reach, 0)} colors={['rgba(156,196,255,0.55)', 'rgba(156,196,255,0.04)']} />
          </Path>
          <Path path={p.puffs} style="stroke" strokeWidth={4} color={AIR} opacity={0.8} />
          <Circle cx={4} cy={0} r={10} color={AIR} opacity={0.5}>
            <BlurMask blur={6} style="normal" />
          </Circle>
        </Group>
      ) : null}
      {kind === 'sibilant' ? (
        <Group>
          <Path path={p.hiss}>
            <RadialGradient c={vec(0, 0)} r={reach} colors={['rgba(255,198,77,0.6)', 'rgba(255,198,77,0.03)']} />
          </Path>
          <Path path={p.hissLines} style="stroke" strokeWidth={2.2} color={AMBER} opacity={0.75} />
        </Group>
      ) : null}
    </Stage>
  );
}
