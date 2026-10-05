/**
 * A10 HARMONICA — the SIGNAL PATHS figure (THE SETTING, step 2): the two
 * ways a harmonica reaches the desk, drawn as the objects they are —
 *   ACOUSTIC   the harmonica in the hands → air → a stand mic → mic cable → the desk
 *   AMPLIFIED  the harmonica cupped round a harp mic → instrument cable →
 *              the amp's input → speaker → air → a speaker mic → mic cable → the desk
 * and one PATCH, checked: a harp mic into the amp (OK), the same harp mic
 * straight into a desk mic input (CHECK: it is high-impedance; it needs a
 * matching transformer, and a connector's shape proves nothing), the amp's
 * SPEAKER output into the desk (STOP: a speaker output goes to a speaker
 * only), a stand mic into a mic input (OK). The verdicts are the speaker
 * family's patch rule (shared/speakers/signalChain.ts) plus the harp mic's
 * own manual (S-520DX). Static (D8): it changes only on a pick.
 */
import { useMemo, type ReactElement } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../rack/stageAspect';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { CabFront } from '../shared/speakers/SpeakerArt';
import { ampExtras } from '../shared/speakers/ampArt';
import { frontBox } from '../shared/speakers/cabLabels.ts';
import { patchVerdict, type PatchVerdict } from '../shared/speakers/signalChain.ts';
import { HandsProfile } from './art';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const RED = '#ff5a48';
const GREEN = '#5bff85';
const CABLE = '#3a3c44';

export type HarpPatch = 'harpToAmp' | 'harpToDesk' | 'spkToDesk' | 'standToDesk';
/** The verdict for a patch: the speaker family's rule, and the harp mic's
 *  manual for its high-impedance output (a desk mic input needs a matching
 *  transformer — a CHECK, never a blind OK). */
export function harpPatchVerdict(p: HarpPatch): PatchVerdict {
  if (p === 'harpToAmp') return patchVerdict('instrumentOut', 'ampIn');
  if (p === 'harpToDesk') return 'check';
  if (p === 'spkToDesk') return patchVerdict('speakerOut', 'micIn');
  return patchVerdict('diOut', 'micIn');
}

export const HARP_PATCHES: readonly { id: HarpPatch; label: string; short: string; text: string }[] = [
  { id: 'harpToAmp', label: 'Harp mic → the amp’s input', short: 'HARP MIC → AMP', text: 'OK: the harp mic is made for a high-impedance input like the amp’s. Turn its volume down before you plug in, then bring it up while keeping away from the speakers.' },
  { id: 'harpToDesk', label: 'Harp mic → a desk mic input', short: 'HARP MIC → DESK', text: 'CHECK FIRST: its output is high-impedance; a standard low-impedance mic input needs a matching transformer. A connector that fits proves nothing, and do not assume phantom power is safe for it — read its manual.' },
  { id: 'spkToDesk', label: 'The amp’s speaker output → the desk', short: 'SPEAKER OUT → DESK', text: 'STOP: a speaker output carries power for a speaker and goes to a speaker only, by a speaker cable — never into a mic, line or DI input. Mic the speaker instead.' },
  { id: 'standToDesk', label: 'Stand mic → a desk mic input', short: 'STAND MIC → DESK', text: 'OK: a stand mic for the acoustic harmonica goes to an ordinary mic input. Mute the outputs before switching any phantom power.' },
];

const BOX = { u0: 0, u1: 1000, v0: 0, v1: 560 };
const ROW1 = 150;
const ROW2 = 410;
const DESK = { u: 885, v: 280 };

function StandMic({ u, v, faces = -1 }: { u: number; v: number; faces?: 1 | -1 }): ReactElement {
  const pole = make();
  pole.moveTo(u + faces * -30, v + 20);
  pole.lineTo(u + faces * -30, v + 110);
  const base = make();
  base.moveTo(u + faces * -30 - 34, v + 116);
  base.lineTo(u + faces * -30, v + 104);
  base.lineTo(u + faces * -30 + 34, v + 116);
  const body = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(u - (faces < 0 ? 0 : 50), v - 9, 50, 18), 7, 7));
  return (
    <Group>
      <Path path={pole} style="stroke" strokeWidth={5} strokeCap="round" color="#5d6572" />
      <Path path={base} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="#5d6572" />
      <Path path={body}>
        <LinearGradient start={vec(u - 50, v - 9)} end={vec(u + 50, v + 9)} colors={['#4b4e57', '#1b1c20', '#0b0b0d']} />
      </Path>
      <Circle cx={u + (faces < 0 ? 0 : 0)} cy={v} r={11}>
        <LinearGradient start={vec(u - 11, v - 11)} end={vec(u + 11, v + 11)} colors={['#f2f4f8', '#9aa0ab', '#3a3d45']} />
      </Circle>
    </Group>
  );
}

function Desk({ u, v }: { u: number; v: number }): ReactElement {
  const top = make();
  top.moveTo(u - 80, v - 30);
  top.lineTo(u + 80, v - 30);
  top.lineTo(u + 96, v + 40);
  top.lineTo(u - 96, v + 40);
  top.close();
  return (
    <Group>
      <Path path={top} color="#000" opacity={0.45} transform={[{ translateX: 4 }, { translateY: 8 }]}>
        <BlurMask blur={8} style="normal" />
      </Path>
      <Path path={top}>
        <LinearGradient start={vec(u - 96, v - 30)} end={vec(u + 96, v + 40)} colors={['#4b4e57', '#26282d', '#121316']} />
      </Path>
      {Array.from({ length: 6 }, (_, i) => u - 62 + i * 25).map((x, i) => (
        <Group key={i}>
          <Circle cx={x} cy={v - 16} r={5} color="#c8ccd4" />
          <RoundedRect x={x - 2} y={v - 4} width={4} height={36} r={2} color="#0b0b0d" />
          <RoundedRect x={x - 7} y={v + 6 + ((i * 7) % 18)} width={14} height={7} r={2} color="#e1e4ea" />
        </Group>
      ))}
    </Group>
  );
}

function Amp({ u, v }: { u: number; v: number }): ReactElement {
  const b = frontBox('combo12');
  const s = 0.36;
  return (
    <Group transform={[{ translateX: u - ((b.u0 + b.u1) / 2) * s }, { translateY: v - ((b.v0 + b.v1) / 2) * s }, { scale: s }]}>
      <CabFront kind="combo12" mode="cloth" spot={null} />
      {ampExtras('combo', null).render?.('front') ?? null}
    </Group>
  );
}

function link(a: [number, number], b: [number, number], bend = 0): SkPath {
  const p = make();
  p.moveTo(a[0], a[1]);
  p.quadTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + bend, b[0], b[1]);
  return p;
}

function airWaves(u: number, v: number): SkPath {
  const p = make();
  for (let i = 0; i < 3; i++) p.addArc(Skia.XYWHRect(u - 16 + i * 16, v - 22 - i * 4, 22, 44 + i * 8), -60, 120);
  return p;
}

export function HarpPaths({ w, h, patch, accessibilityLabel }: { w: number; h: number; patch: HarpPatch; accessibilityLabel: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 6), [w, h]);
  const verdict = harpPatchVerdict(patch);
  const tint = verdict === 'ok' ? GREEN : verdict === 'check' ? AMBER : RED;
  // The standard links.
  const micCable1 = link([355, ROW1 + 10], [DESK.u - 80, DESK.v - 10], 40);
  const hiZ = link([150, ROW2 + 70], [330, ROW2 + 20], 50);
  const micCable2 = link([655, ROW2 + 10], [DESK.u - 80, DESK.v + 20], -10);
  // The checked patch, drawn over (amber / red).
  const chosen =
    patch === 'harpToAmp' ? hiZ : patch === 'harpToDesk' ? link([150, ROW2 + 70], [DESK.u - 90, DESK.v + 30], 120) : patch === 'spkToDesk' ? link([470, ROW2 + 20], [DESK.u - 90, DESK.v + 30], 60) : micCable1;
  const strike = make();
  if (verdict === 'stop') {
    const m = [(470 + DESK.u - 90) / 2, (ROW2 + 20 + DESK.v + 30) / 2 + 30];
    strike.moveTo(m[0] - 26, m[1] - 26);
    strike.lineTo(m[0] + 26, m[1] + 26);
    strike.moveTo(m[0] + 26, m[1] - 26);
    strike.lineTo(m[0] - 26, m[1] + 26);
  }
  const labels: StaticLabel[] = [
    { id: 'l1', text: 'ACOUSTIC · A STAND MIC', short: 'ACOUSTIC', u: 20, v: ROW1 - 120, align: 'left', tone: 'blue' },
    { id: 'l2', text: 'AMPLIFIED · HARP MIC → AMP → SPEAKER MIC', short: 'AMPLIFIED', u: 20, v: ROW2 - 140, align: 'left', tone: 'amber' },
    { id: 'n1', text: 'STAND MIC', u: 330, v: ROW1 + 140, align: 'center', tone: 'muted' },
    { id: 'n2', text: 'HARP AMP', u: 400, v: ROW2 + 120, align: 'center', tone: 'muted' },
    { id: 'n3', text: 'SPEAKER MIC', u: 630, v: ROW2 + 140, align: 'center', tone: 'muted' },
    { id: 'n4', text: 'DESK', u: DESK.u, v: DESK.v + 70, align: 'center', tone: 'muted' },
    { id: 'v', text: verdict === 'ok' ? '✓ OK' : verdict === 'check' ? '! CHECK FIRST' : '✕ STOP', u: 640, v: 30, align: 'center', tone: verdict === 'stop' ? undefined : 'amber' },
  ];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {/* row 1: the acoustic path */}
          <Group transform={[{ translateX: 70 }, { translateY: ROW1 }, { scale: 0.62 }]}>
            <HandsProfile at={{ u: 0, v: 0 }} state="open" />
          </Group>
          <Path path={airWaves(220, ROW1)} style="stroke" strokeWidth={4} color={BLUE} opacity={0.8} />
          <StandMic u={300} v={ROW1} />
          <Path path={micCable1} style="stroke" strokeWidth={6} strokeCap="round" color={CABLE} />
          {/* row 2: the amplified path */}
          <Group transform={[{ translateX: 70 }, { translateY: ROW2 }, { scale: 0.62 }]}>
            <HandsProfile at={{ u: 0, v: 0 }} state="mic" />
          </Group>
          <Path path={hiZ} style="stroke" strokeWidth={6} strokeCap="round" color="#2a2b30" />
          <Amp u={410} v={ROW2} />
          <Path path={airWaves(520, ROW2)} style="stroke" strokeWidth={4} color={BLUE} opacity={0.8} />
          <StandMic u={600} v={ROW2} />
          <Path path={micCable2} style="stroke" strokeWidth={6} strokeCap="round" color={CABLE} />
          <Desk u={DESK.u} v={DESK.v} />
          {/* the checked patch */}
          <Path path={chosen} style="stroke" strokeWidth={9} strokeCap="round" color={tint} opacity={0.85}>
            {verdict === 'ok' ? null : <DashPathEffect intervals={[22, 12]} />}
          </Path>
          {verdict === 'stop' ? <Path path={strike} style="stroke" strokeWidth={10} strokeCap="round" color={RED} /> : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}
export const HARP_PATHS_ASPECT = (BOX.u1 - BOX.u0) / (BOX.v1 - BOX.v0);
