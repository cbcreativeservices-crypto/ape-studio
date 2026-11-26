/**
 * STUDY PAGE (dev only) — THE APPROVED UNDERHAND HAND FROM ABOVE, PLACED ON THE BOOM OPERATOR (2026-11-25).
 * `#labpreview/FigureStudy/boomtopunder[@<pt per mm>]`: B10 post-event overhead from above, the operator's LEFT hand
 * (the underhand hold, OVERHEAD_UNDERHAND) at its start, raised over the head, dragged below the mouth and on a drag grid
 * (600–1000 mm out, 20–60° up). Each window says which drawing the hand carries (poleHandTopUnder, poleHandTop or the old
 * hand) and how far the rig's forearm on the page is off the drawing's −98°. Then the same poses as the LESSON draws them
 * (the scene, the engine's pole, the operator's fists painted again over it), and a drag sweep start → below the mouth
 * and back, decided with the hold (the switch going one way lies past the switch coming back: no flicker).
 */
import { Text, View, useWindowDimensions, ScrollView } from 'react-native';
import { Path, Skia } from '@shopify/react-native-skia';
import { BoomOperatorV2, TOP_UNDER_HOLD, TOP_UNDER_TOL, boomPlans, topDrawings, type BoomRig, type TopDrawing } from '../screens/lab/miking/lessons/shared/figureV2/BoomV2';
import { B10_BOOM_RIGS, B10_OPERATOR_WHO, B10BoomHandsOver, B10Scene } from '../screens/lab/miking/lessons/b10Sideline/scene';
import { GRIP as B10_GRIP_PT } from '../screens/lab/miking/lessons/b10Sideline/geometry';
import { B10_HELD } from '../screens/lab/miking/lessons/b10Sideline/held';
import { HeldStatic, type HeldMicNow } from '../screens/lab/miking/lessons/shared/figureV2/heldLive';
import { PoleHandTopUnder } from '../screens/lab/miking/lessons/shared/figureV2/poleHandTopUnder';
import { Pics, b10LiveRig, type PicItem } from './frontBoomStudy';

const BG = '#0d0f13';
const INK = '#d7dbe3';
const DIM = '#9aa3b2';
const WHO = B10_OPERATOR_WHO;

type V = { x: number; y: number; z: number };
const unitV = (p: V): V => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return { x: p.x / l, y: p.y / l, z: p.z / l };
};
/** A mic `d` mm out from the grip at `e`° up, aimed back at the grip's line (the test's drag grid). */
const micAt = (d: number, e: number) => {
  const q = (e * Math.PI) / 180;
  const front = { x: d * Math.cos(q), y: -d * Math.sin(q), z: 0 };
  return { front, aim: unitV({ x: -front.x, y: -front.y, z: 0 }) };
};
type Pose = { key: string; label: string; front: V; aim: V };
const POSES: Pose[] = [
  { key: 'start', label: 'B10 start (900 mm at 45°)', front: { x: 900 * Math.SQRT1_2, y: -900 * Math.SQRT1_2, z: 0 }, aim: unitV({ x: -1, y: 1, z: 0 }) },
  { key: 'raised', label: 'raised over the head', front: { x: 250, y: -620, z: 0 }, aim: unitV({ x: -0.3, y: 1, z: 0 }) },
  { key: 'below', label: 'dragged below the mouth', front: { x: 260, y: 260, z: 0 }, aim: unitV({ x: -0.7, y: -1, z: 0 }) },
  // (the sweep's last pose before the jump to below the mouth: the farthest off that still takes the drawing)
  { key: 'edge', label: 'on the way down (the sweep, step 13 of 24)', front: { x: 900 * Math.SQRT1_2 + (260 - 900 * Math.SQRT1_2) * (13 / 24), y: -900 * Math.SQRT1_2 + (260 + 900 * Math.SQRT1_2) * (13 / 24), z: 0 }, aim: unitV({ x: -Math.SQRT1_2 + (-0.7 / Math.hypot(0.7, 1) + Math.SQRT1_2) * (13 / 24), y: Math.SQRT1_2 + (-1 / Math.hypot(0.7, 1) - Math.SQRT1_2) * (13 / 24), z: 0 }) },
  ...[
    [600, 20],
    [600, 60],
    [800, 30],
    [800, 50],
    [1000, 20],
    [1000, 60],
  ].map(([d, e]) => ({ key: `g${d}_${e}`, label: `dragged ${d} mm at ${e}°`, ...micAt(d, e) })),
];
const rigOf = (p: Pose): BoomRig | null => (p.key === 'start' ? B10_BOOM_RIGS.overhead : b10LiveRig(p.front, p.aim));

/** In words: which drawing each hand carries from above, and the underhand drawing's angle off. */
function words(B: ReturnType<typeof boomPlans>): string {
  return B.arms
    .map((a) => {
      const t = a.hand.topFace;
      const side = a.hand.arm.side === 'L' ? 'left' : 'right';
      const art = t?.drawing === 'topUnder' ? 'UNDERHAND from above (poleHandTopUnder)' : t?.drawing === 'top' ? 'overhand from above (poleHandTop)' : `OLD HAND (${t?.why ?? ''})`;
      const off = t?.underOff != null ? `, forearm ${t.underOff.toFixed(1)}° off the drawing's` : '';
      return `${side}${a.hand.arm.under ? ' UNDERHAND' : ''}: ${art}${off}${t?.underWhy ? ` — not the underhand drawing: ${t.underWhy}` : ''}`;
    })
    .join(' · ');
}

/** A drag sweep: from the start toward below the mouth and back, each step decided with the hold it carried. */
function sweep(): string[] {
  const a = POSES[0];
  const b = POSES[2];
  const n = 24;
  const steps: { front: V; aim: V }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    steps.push({ front: { x: a.front.x + (b.front.x - a.front.x) * t, y: a.front.y + (b.front.y - a.front.y) * t, z: 0 }, aim: unitV({ x: a.aim.x + (b.aim.x - a.aim.x) * t, y: a.aim.y + (b.aim.y - a.aim.y) * t, z: 0 }) });
  }
  const path = [...steps, ...steps.slice(0, -1).reverse()];
  let top: TopDrawing[] | undefined;
  const out: string[] = [];
  path.forEach((s, i) => {
    const rig = b10LiveRig(s.front, s.aim);
    if (!rig) return;
    const B = boomPlans(rig, WHO, 'top', false, top ? { top } : undefined);
    const L = B.arms.find((x) => x.hand.arm.side === 'L');
    const d = L?.hand.topFace;
    const was = top?.[B.arms.indexOf(L!)];
    top = topDrawings(B);
    out.push(`${i < steps.length ? '→' : '←'} mic (${Math.round(s.front.x)}, ${Math.round(s.front.y)}): left ${d?.drawing ?? '?'}${d?.underOff != null ? ` ${d.underOff.toFixed(1)}°` : ''}${was && was !== d?.drawing ? '  ← CHANGED' : ''}`);
  });
  return out;
}

export function BoomTopUnderStudy({ only = 'boomtopunder' }: { only?: string }) {
  const { width } = useWindowDimensions();
  const ptmm = Number(only.split('@')[1]) || 1.3;
  const z = Math.min(Math.floor((width - 40) / 2), 400);
  const close: PicItem[] = [];
  const lesson: PicItem[] = [];
  const notes: string[] = [];
  for (const p of POSES) {
    const rig = rigOf(p);
    if (!rig) {
      notes.push(`${p.label}: no rig (out of reach)`);
      continue;
    }
    const B = boomPlans(rig, WHO, 'top');
    notes.push(`${p.label}: ${words(B)}`);
    const L = B.arms.find((x) => x.hand.arm.side === 'L')!;
    const f = B.vs.proj(L.hand.arm.fist);
    const t = L.hand.topFace;
    const lab = `${p.label} · left: ${t?.drawing === 'topUnder' ? 'poleHandTopUnder' : t?.drawing === 'top' ? 'poleHandTop' : 'old hand'}${t?.underOff != null ? ` · ${t.underOff.toFixed(1)}° off` : ''}`;
    // (the window on the hand and its wrist: a closer look shifts toward the fist)
    const k = Math.min(1, 1.6 / ptmm);
    close.push({ key: `c${p.key}`, cu: f.u - 50 * k, cv: f.v + 20 * k, mmW: z / ptmm, mmH: z / ptmm, label: lab, node: <BoomOperatorV2 view="top" rig={rig} who={WHO} dim={1} /> });
    // (beside it: the approved drawing ALONE at the same placement — what the operator's hand must show whole)
    const u = L.hand.poleTopUnder;
    close.push({
      key: `a${p.key}`,
      cu: f.u - 50 * k,
      cv: f.v + 20 * k,
      mmW: z / ptmm,
      mmH: z / ptmm,
      label: u ? 'the approved drawing alone, as placed' : '(not placed here)',
      node: u ? <PoleHandTopUnder who={WHO} x={u.x} y={u.y} s={1} rot={u.rot} mirror={u.mirror} sleeve={false} poleLook="boom" ownScale={false} pole={[-70, 70]} /> : null,
    });
    // (the lesson's own drawing: the scene, the engine's pole, the fists painted again over it)
    const len = 50;
    const tail = { x: p.front.x - p.aim.x * len, y: p.front.y - p.aim.y * len, z: p.front.z - p.aim.z * len };
    const mic: HeldMicNow = { key: 'boom', front: p.front, aim: p.aim, grip: B10_GRIP_PT, fist: B10_GRIP_PT, r: 10, len };
    const pole = Skia.Path.Make();
    pole.moveTo(tail.x, tail.z);
    pole.lineTo(B10_GRIP_PT.x, B10_GRIP_PT.z);
    lesson.push({
      key: `l${p.key}`,
      cu: f.u - 60,
      cv: f.v + 40,
      mmW: 700,
      mmH: 700,
      label: `LESSON · ${lab}`,
      node: (
        <HeldStatic cfg={B10_HELD} mics={[mic]}>
          <B10Scene view="top" variant="postEvent" />
          <Path path={pole} style="stroke" strokeWidth={24} strokeCap="round" color="#060608" />
          <Path path={pole} style="stroke" strokeWidth={20} strokeCap="round" color="#2b2e35" />
          <B10BoomHandsOver view="top" />
        </HeldStatic>
      ),
    });
  }
  const sw = sweep();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ color: INK, fontSize: 16, fontWeight: '700' }}>B10 FROM ABOVE — THE UNDERHAND HAND PLACED (poleHandTopUnder)</Text>
      <Text style={{ color: DIM, fontSize: 11, marginBottom: 8 }}>
        {`The operator's left hand (underhand) takes the approved underhand drawing from above where her forearm on the page is within ${TOP_UNDER_TOL}° of the drawing's −98° (a drag keeps it to ${TOP_UNDER_TOL + TOP_UNDER_HOLD}°, takes it over within ${TOP_UNDER_TOL - TOP_UNDER_HOLD}°). About ${ptmm} pt/mm, then the lesson's own drawing at about 0.55 pt/mm.`}
      </Text>
      {notes.map((n) => (
        <Text key={n} style={{ color: DIM, fontSize: 10 }}>
          {n}
        </Text>
      ))}
      <View style={{ height: 8 }} />
      <Pics w={z} per={2} level="full" items={close} />
      <Pics w={z} per={2} level="full" items={lesson} />
      <Text style={{ color: INK, fontSize: 12, fontWeight: '700', marginTop: 8 }}>A DRAG SWEEP, start → below the mouth → start (each step with the hold it carried)</Text>
      {sw.map((s, i) => (
        <Text key={i} style={{ color: DIM, fontSize: 10 }}>
          {s}
        </Text>
      ))}
    </ScrollView>
  );
}
