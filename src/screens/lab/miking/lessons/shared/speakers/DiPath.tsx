/**
 * DiPath — the SIGNAL PATH of an amplified string instrument, drawn
 * (signalChain.ts): the AIR lane a mic hears (blue), and the ELECTRICAL taps — a
 * DI box before the amp, the amp's own direct output — each drawn on its own
 * lane (amber dashes), so a learner never mistakes a direct feed for the
 * cabinet's sound. Each link is drawn as the cable it is: instrument cable,
 * SPEAKER cable (amp to cabinet only), mic cable, balanced line. With
 * `badPatch`, the one patch that must never be made — a speaker output into
 * the desk — is drawn and struck out in red.
 *
 * A COMBO is ONE body (R2-MK-02): the amp and its speaker in one cabinet, no
 * speaker cable outside it. Each electrical link has its own lane into the
 * desk (R2-MK-01): the amp's direct out on the upper lane, the DI on the lower.
 *
 * Every node is the real object drawn to its real proportions
 * (chainIcons.tsx, art pass 2026-10-10), never a box with a word in it.
 * Static (D8): it changes only on a tap.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, Circle, DashPathEffect, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { labelWidth } from '../../../engine/scene/labelLayout.ts';
import { diPathLayout, type ChainLink, type ChainNode, type ChainSpec } from './signalChain.ts';
import { ChainIcon, type IconArt } from './chainIcons';

const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const RED = '#ff5a48';
const CABLE = '#3a3c44';

/** Which drawing a node gets: its kind, read with the chain it sits in (the
 *  speaker IN a combo is a bare 12 in driver; a stack's is the bass cabinet;
 *  the amp's direct out is a panel socket, not a DI box). */
function artOf(n: ChainNode, spec: ChainSpec): IconArt {
  switch (n.kind) {
    case 'instrument':
      return 'guitar';
    case 'bass':
      return 'bass';
    case 'steel':
      return 'steel';
    case 'pedals':
      return 'pedals';
    case 'volume':
      return 'volume';
    case 'di':
      return n.id === 'ampdi' ? (spec.icons?.player === 'keys' ? 'auxOut' : 'ampOut') : 'di';
    case 'amp':
    case 'combo':
      return 'combo';
    case 'head':
      return 'head';
    case 'cab':
      return spec.rig === 'combo' ? 'speaker12' : 'bassCab';
    case 'mic':
      return 'mic';
    case 'desk':
      return 'desk';
    case 'keys':
      return spec.icons?.amp === 'keysAmp' ? 'wurli' : 'rhodes';
    case 'keysAmp':
      return 'wurliAmp';
    case 'lidSpeakers':
      return 'wurliLid';
    default:
      return 'combo';
  }
}

/** One node's drawing, centred at 0, 0, in a box of side S (chainIcons.tsx). */
function NodeIcon({ art, S, lit, out }: { art: IconArt; S: number; lit: boolean; out: 'right' | 'down' }) {
  const h = S / 2;
  return (
    <Group>
      {lit ? <RoundedRect x={-h - 6} y={-h - 6} width={S + 12} height={S + 12} r={10} style="stroke" strokeWidth={3} color={AMBER} /> : null}
      <ChainIcon art={art} S={S} out={out} />
    </Group>
  );
}

const LINK_LOOK: Record<ChainLink['kind'], { color: string; w: number; dash: number[] | null }> = {
  instrument: { color: CABLE, w: 3, dash: null },
  speaker: { color: '#b07a3a', w: 5, dash: null },
  air: { color: BLUE, w: 3, dash: [3, 7] },
  mic: { color: CABLE, w: 3, dash: null },
  balanced: { color: AMBER, w: 2.5, dash: [10, 7] },
  line: { color: AMBER, w: 2.5, dash: [10, 7] },
};

export type DiPathProps = { w: number; h: number; spec: ChainSpec; highlight: string | null; onTap: (id: string) => void; shortOf: (id: string) => string; badPatch?: boolean; accessibilityLabel: string };

export function DiPath({ w, h, spec, highlight, onTap, shortOf, badPatch = false, accessibilityLabel }: DiPathProps) {
  const ts = useStageTextScale();
  // R2-MK-01/02 (2026-10-21): the geometry lives in signalChain.ts (pure,
  // tested) — each electrical link its own lane into the desk, a combo ONE body.
  const g = useMemo(() => diPathLayout(spec, w, h, ts, (id) => Math.max(22 * ts, labelWidth(shortOf(id), ts, w))), [spec, w, h, ts, shortOf]);
  const { S, SC, nodes, pos, links } = g;
  const paths = useMemo(
    () =>
      links.map(({ l, seg, arcs }) => {
        const p = make();
        if (seg?.kind === 'line') {
          p.moveTo(seg.pts[0].x, seg.pts[0].y);
          for (const q of seg.pts.slice(1)) p.lineTo(q.x, q.y);
        } else if (seg?.kind === 'cubic') {
          p.moveTo(seg.p0.x, seg.p0.y);
          p.cubicTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.p3.x, seg.p3.y);
        }
        return { l, p, seg, arcs };
      }),
    [links],
  );
  const bad = useMemo(() => {
    const p = make();
    const b = g.bad;
    p.moveTo(b.p0.x, b.p0.y);
    p.cubicTo(b.c1.x, b.c1.y, b.c2.x, b.c2.y, b.p3.x, b.p3.y);
    return p;
  }, [g.bad]);
  const mid = g.bad.mid;
  const labels: StaticLabel[] = [
    ...nodes.map((n) => ({ id: n.id, text: shortOf(n.id), u: g.label[n.id].x, v: g.label[n.id].y, align: 'center' as const, tone: n.lane === 'air' ? undefined : ('amber' as const) })),
    { id: 'lane.air', text: 'AIR — WHAT A MIC HEARS', short: 'AIR', u: g.pad - 10, v: g.airY, align: 'left', tone: 'blue' },
    { id: 'lane.el', text: 'ELECTRICAL — ITS OWN SOURCE', short: 'ELECTRICAL', u: g.pad - 10, v: g.elY, align: 'left', tone: 'amber' },
    ...(badPatch ? [{ id: 'bad', text: 'SPEAKER OUT → DESK: NEVER', short: 'NEVER', u: mid.x, v: mid.y - 16 * ts, align: 'center' as const, tone: 'amber' as const }] : []),
  ];
  const tap = (x: number, y: number) => {
    let best: string | null = null;
    let bd = S * 0.8;
    for (const n of nodes) {
      const p = g.tapAt[n.id];
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = n.id;
      }
    }
    if (best) onTap(best);
  };
  return (
    <Pressable onPress={(e) => tap(e.nativeEvent.locationX, e.nativeEvent.locationY)} accessible={false} style={{ width: w, height: h }}>
      <View pointerEvents="none" style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
          {paths.map(({ l, p, seg, arcs }, i) => {
            const look = LINK_LOOK[l.kind];
            if (arcs) {
              const n = 4;
              return (
                <Group key={i}>
                  {Array.from({ length: n }, (_, k) => {
                    // Each arc's front stays clear of the mic's grille (the icon sits right of its centre).
                    const r = S * 0.24 + k * S * 0.045;
                    const x = arcs.x0 + ((arcs.x1 - arcs.x0) * (k + 1)) / n - r;
                    const q = make();
                    q.addArc(Skia.XYWHRect(x - r, arcs.y - r, 2 * r, 2 * r), -40, 80);
                    return <Path key={k} path={q} style="stroke" strokeWidth={2.4} color={BLUE} opacity={0.9 - k * 0.12} />;
                  })}
                </Group>
              );
            }
            if (!seg) return null; // a combo's speaker lead is inside the box
            return (
              <Group key={i}>
                {l.kind === 'speaker' ? <Path path={p} style="stroke" strokeWidth={look.w + 3} color="#2a1c0c" /> : null}
                <Path path={p} style="stroke" strokeWidth={look.w} strokeCap="round" color={look.color}>
                  {look.dash ? <DashPathEffect intervals={look.dash} /> : null}
                </Path>
              </Group>
            );
          })}
          {badPatch ? (
            <Group>
              <Path path={bad} style="stroke" strokeWidth={4} color={RED} opacity={0.9}>
                <DashPathEffect intervals={[10, 8]} />
              </Path>
              <Path path={(() => { const p = make(); const r = S * 0.28; p.moveTo(mid.x - r, mid.y - r); p.lineTo(mid.x + r, mid.y + r); p.moveTo(mid.x + r, mid.y - r); p.lineTo(mid.x - r, mid.y + r); return p; })()} style="stroke" strokeWidth={6} strokeCap="round" color={RED} />
            </Group>
          ) : null}
          {nodes.map((n) => {
            if (g.merged && n.id === 'cab') return null; // drawn inside the combo
            const p = pos[n.id];
            const size = g.merged && n.id === 'amp' ? SC : S;
            return (
              <Group key={n.id} transform={[{ translateX: p.x }, { translateY: p.y }]}>
                <NodeIcon art={artOf(n, spec)} S={size} lit={highlight === n.id} out={n.id === 'player' && spec.diBox ? 'down' : 'right'} />
              </Group>
            );
          })}
          {g.speaker && highlight === 'cab' ? <Circle cx={g.speaker.x} cy={g.speaker.y} r={g.speaker.r + 4} style="stroke" strokeWidth={3} color={AMBER} /> : null}
        </Canvas>
        <StaticLabels labels={labels} xf={{ view: 'side', s: 1, ox: 0, oy: 0 }} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
