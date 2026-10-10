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
 * Every node is the real object drawn to its real proportions
 * (chainIcons.tsx, art pass 2026-10-10), never a box with a word in it.
 * Static (D8): it changes only on a tap.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { buildChain, type ChainLink, type ChainNode, type ChainSpec } from './signalChain.ts';
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
  const { nodes, links } = useMemo(() => buildChain(spec), [spec]);
  const nAir = nodes.filter((n) => n.lane === 'air').length;
  const pad = Math.max(30, w * 0.07);
  const colW = (w - 2 * pad) / Math.max(1, nAir - 1);
  const lanes = { air: h * 0.27, di: h * (spec.ampDirect ? 0.5 : 0.6), amp: h * 0.7 };
  const S = Math.max(26, Math.min(colW * 0.6, h * 0.17));
  const at = (n: ChainNode) => ({ x: pad + n.col * colW, y: lanes[n.lane] });
  const byId = (id: string) => nodes.find((n) => n.id === id)!;
  const paths = useMemo(() => {
    return links.map((l) => {
      const a = at(byId(l.from));
      const b = at(byId(l.to));
      const p = make();
      if (l.kind === 'air') {
        // Sound in the air: arcs between the speaker and the mic.
        p.moveTo(a.x + S * 0.55, a.y);
        p.lineTo(b.x - S * 0.55, b.y);
        return { l, p, arcs: true, a, b };
      }
      if (a.y === b.y) {
        p.moveTo(a.x + S * 0.5, a.y);
        p.lineTo(b.x - S * 0.5, b.y);
      } else if (b.y > a.y && l.to === 'dibox') {
        // Down into the DI box's input jack, at its far (left) end.
        p.moveTo(a.x, a.y + S * 0.5);
        p.cubicTo(a.x, a.y + S * 0.5 + (b.y - a.y) * 0.4, b.x - S * 0.8, b.y + S * 0.1, b.x - S * 0.5, b.y + S * 0.1);
      } else if (b.y > a.y) {
        // Down to a lower lane.
        p.moveTo(a.x, a.y + S * 0.5);
        p.cubicTo(a.x, (a.y + b.y) / 2, b.x, (a.y + b.y) / 2, b.x, b.y - S * 0.42);
      } else if (l.from === 'dibox' && l.kind === 'instrument') {
        // The DI's THRU, from the same end as its input, up to the next box.
        p.moveTo(a.x - S * 0.5, a.y);
        p.cubicTo(a.x - S * 0.95, a.y - S * 0.15, b.x - S * 0.95, b.y + S * 0.35, b.x - S * 0.5, b.y + S * 0.1);
      } else {
        // Up from a lower lane to the air lane (or along it to the desk).
        const toDesk = l.to === 'desk';
        if (toDesk) {
          p.moveTo(a.x + S * 0.5, a.y);
          p.lineTo(b.x - 6, a.y);
          p.lineTo(b.x - 6, b.y + S * 0.5);
        } else {
          p.moveTo(a.x + S * 0.4, a.y - S * 0.2);
          p.cubicTo(b.x - S * 0.4, a.y, b.x - S * 0.4, (a.y + b.y) / 2, b.x - S * 0.5, b.y + S * 0.1);
        }
      }
      return { l, p, arcs: false, a, b };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, w, h, S]);
  const amp = at(byId('amp'));
  const desk = at(byId('desk'));
  const bad = useMemo(() => {
    const p = make();
    p.moveTo(amp.x + S * 0.3, amp.y - S * 0.6);
    p.cubicTo(amp.x + colW, amp.y - S * 1.6, desk.x - colW * 0.5, desk.y - S * 1.6, desk.x, desk.y - S * 0.55);
    return p;
  }, [amp.x, amp.y, desk.x, desk.y, S, colW]);
  const mid = { x: (amp.x + desk.x) / 2, y: amp.y - S * 1.25 };
  const labels: StaticLabel[] = [
    ...nodes.map((n) => ({ id: n.id, text: shortOf(n.id), u: at(n).x, v: at(n).y + S * 0.5 + 14 * ts, align: 'center' as const, tone: n.lane === 'air' ? undefined : ('amber' as const) })),
    { id: 'lane.air', text: 'AIR — WHAT A MIC HEARS', short: 'AIR', u: pad - 10, v: lanes.air - S * 0.5 - 18 * ts, align: 'left', tone: 'blue' },
    { id: 'lane.el', text: 'ELECTRICAL — ITS OWN SOURCE', short: 'ELECTRICAL', u: pad - 10, v: (spec.ampDirect ? lanes.amp : lanes.di) + S * 0.5 + 34 * ts, align: 'left', tone: 'amber' },
    ...(badPatch ? [{ id: 'bad', text: 'SPEAKER OUT → DESK: NEVER', short: 'NEVER', u: mid.x, v: mid.y - 16 * ts, align: 'center' as const, tone: 'amber' as const }] : []),
  ];
  const tap = (x: number, y: number) => {
    let best: string | null = null;
    let bd = S * 0.8;
    for (const n of nodes) {
      const p = at(n);
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
          {paths.map(({ l, p, arcs, a, b }, i) => {
            const look = LINK_LOOK[l.kind];
            if (arcs) {
              const n = 4;
              return (
                <Group key={i}>
                  {Array.from({ length: n }, (_, k) => {
                    // Each arc's front stays clear of the mic's grille (the icon sits right of its centre).
                    const r = S * 0.24 + k * S * 0.045;
                    const x = a.x + S * 0.55 + ((b.x - a.x - S * 0.95) * (k + 1)) / n - r;
                    const q = make();
                    q.addArc(Skia.XYWHRect(x - r, a.y - r, 2 * r, 2 * r), -40, 80);
                    return <Path key={k} path={q} style="stroke" strokeWidth={2.4} color={BLUE} opacity={0.9 - k * 0.12} />;
                  })}
                </Group>
              );
            }
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
            const p = at(n);
            return (
              <Group key={n.id} transform={[{ translateX: p.x }, { translateY: p.y }]}>
                <NodeIcon art={artOf(n, spec)} S={S} lit={highlight === n.id} out={n.id === 'player' && spec.diBox ? 'down' : 'right'} />
              </Group>
            );
          })}
        </Canvas>
        <StaticLabels labels={labels} xf={{ view: 'side', s: 1, ox: 0, oy: 0 }} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
