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
 * Every node is a small illustrated object (lit from the upper left), never
 * a box with a word in it. Static (D8): it changes only on a tap.
 */
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { buildChain, type ChainLink, type ChainNode, type ChainSpec, type NodeKind } from './signalChain.ts';

type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const AMBER = '#ffc64d';
const BLUE = '#6fa8ff';
const RED = '#ff5a48';
const CABLE = '#3a3c44';
const CHROME = ['#f2f4f8', '#9aa0ab', '#3a3d45'] as const;
const TOLEX = ['#3a3b41', '#1d1e22', '#0f1012'] as const;

/** One node's drawing, centred at 0, 0, in a box of side S. */
function NodeIcon({ kind, S, lit }: { kind: NodeKind; S: number; lit: boolean }) {
  const h = S / 2;
  const ring = lit ? <RoundedRect x={-h - 6} y={-h - 6} width={S + 12} height={S + 12} r={10} style="stroke" strokeWidth={3} color={AMBER} /> : null;
  const shadow = (
    <RoundedRect x={-h * 0.8 + 3} y={-h * 0.6 + 5} width={S * 0.8} height={S * 0.6} r={8} color="#000" opacity={0.45}>
      <BlurMask blur={6} style="normal" />
    </RoundedRect>
  );
  switch (kind) {
    case 'instrument': {
      // A solid-body electric, at an angle: body, neck, headstock.
      const body = make();
      body.addOval(Skia.XYWHRect(-h * 0.95, -h * 0.05, h * 1.0, h * 0.9));
      body.addOval(Skia.XYWHRect(-h * 0.75, -h * 0.42, h * 0.8, h * 0.7));
      const neck = make();
      neck.moveTo(-h * 0.2, -h * 0.05);
      neck.lineTo(h * 0.85, -h * 0.8);
      return (
        <Group>
          {ring}
          <Path path={body}>
            <RadialGradient c={vec(-h * 0.6, -h * 0.2)} r={S} colors={['#9a2a22', '#4a0f0c', '#260706']} />
          </Path>
          <Path path={neck} style="stroke" strokeWidth={S * 0.09} strokeCap="round" color="#c99a5a" />
          <Path path={neck} style="stroke" strokeWidth={S * 0.035} strokeCap="round" color="#2e1a10" />
          <RoundedRect x={h * 0.72} y={-h * 0.98} width={h * 0.32} height={h * 0.3} r={4} color="#c99a5a" />
          <RoundedRect x={-h * 0.62} y={h * 0.18} width={h * 0.34} height={h * 0.12} r={2} color="#121316" />
        </Group>
      );
    }
    case 'pedals':
    case 'volume': {
      const p = make();
      if (kind === 'volume') {
        p.moveTo(-h * 0.85, h * 0.55);
        p.lineTo(h * 0.85, h * 0.55);
        p.lineTo(h * 0.85, h * 0.05);
        p.lineTo(-h * 0.85, -h * 0.35);
        p.close();
      } else p.addRRect(Skia.RRectXY(Skia.XYWHRect(-h * 0.6, -h * 0.75, h * 1.2, h * 1.4), 8, 8));
      return (
        <Group>
          {ring}
          {shadow}
          <Path path={p}>
            <LinearGradient start={vec(-h, -h)} end={vec(h, h)} colors={kind === 'volume' ? [...TOLEX] : ['#3d8a5a', '#1f5236', '#0f2a1c']} />
          </Path>
          <Path path={p} style="stroke" strokeWidth={1.2} color="#7a7f8a" opacity={0.7} />
          {kind === 'pedals' ? (
            <>
              <Circle cx={-h * 0.25} cy={-h * 0.4} r={h * 0.16} color="#e1e4ea" />
              <Circle cx={h * 0.25} cy={-h * 0.4} r={h * 0.16} color="#e1e4ea" />
              <Circle cx={0} cy={h * 0.35} r={h * 0.2}>
                <RadialGradient c={vec(-3, h * 0.3)} r={h * 0.3} colors={[...CHROME]} />
              </Circle>
            </>
          ) : null}
        </Group>
      );
    }
    case 'di':
      return (
        <Group>
          {ring}
          {shadow}
          <RoundedRect x={-h * 0.7} y={-h * 0.45} width={h * 1.4} height={h * 0.9} r={6}>
            <LinearGradient start={vec(-h, -h)} end={vec(h, h)} colors={[...CHROME]} />
          </RoundedRect>
          <RoundedRect x={-h * 0.7} y={-h * 0.45} width={h * 1.4} height={h * 0.9} r={6} style="stroke" strokeWidth={1} color="#08080a" />
          <Circle cx={-h * 0.35} cy={0} r={h * 0.2} color="#121316" />
          <Circle cx={h * 0.35} cy={0} r={h * 0.24} color="#121316" />
          {[0, 1, 2].map((i) => (
            <Circle key={i} cx={h * 0.35 + Math.cos((i * 2 * Math.PI) / 3 - Math.PI / 2) * h * 0.11} cy={Math.sin((i * 2 * Math.PI) / 3 - Math.PI / 2) * h * 0.11} r={h * 0.04} color="#c8ccd4" />
          ))}
        </Group>
      );
    case 'head':
    case 'combo': {
      const combo = kind === 'combo';
      const y0 = combo ? -h * 0.8 : -h * 0.35;
      const hh = combo ? h * 1.6 : h * 0.7;
      return (
        <Group>
          {ring}
          {shadow}
          <RoundedRect x={-h * 0.95} y={y0} width={h * 1.9} height={hh} r={6}>
            <LinearGradient start={vec(-h, y0)} end={vec(h, y0 + hh)} colors={[...TOLEX]} />
          </RoundedRect>
          <RoundedRect x={-h * 0.82} y={y0 + h * 0.08} width={h * 1.64} height={h * 0.26} r={3}>
            <LinearGradient start={vec(0, y0)} end={vec(0, y0 + h * 0.3)} colors={[...CHROME]} />
          </RoundedRect>
          {[0, 1, 2, 3, 4].map((i) => (
            <Circle key={i} cx={-h * 0.6 + i * h * 0.3} cy={y0 + h * 0.21} r={h * 0.07} color="#121316" />
          ))}
          {combo ? (
            <>
              <RoundedRect x={-h * 0.82} y={y0 + h * 0.44} width={h * 1.64} height={h * 1.06} r={5}>
                <LinearGradient start={vec(-h, 0)} end={vec(h, h)} colors={['#3d3f46', '#2b2d33', '#1b1c20']} />
              </RoundedRect>
              <Circle cx={h * 0.12} cy={y0 + h * 0.98} r={h * 0.42} color="#000" opacity={0.25} />
            </>
          ) : null}
        </Group>
      );
    }
    case 'cab':
      return (
        <Group>
          {ring}
          {shadow}
          <RoundedRect x={-h * 0.9} y={-h * 0.9} width={h * 1.8} height={h * 1.8} r={6}>
            <LinearGradient start={vec(-h, -h)} end={vec(h, h)} colors={[...TOLEX]} />
          </RoundedRect>
          <RoundedRect x={-h * 0.76} y={-h * 0.76} width={h * 1.52} height={h * 1.52} r={4} color="#120f0c" />
          <Circle cx={0} cy={0} r={h * 0.6}>
            <RadialGradient c={vec(-h * 0.25, -h * 0.25)} r={h * 0.9} colors={['#4a4038', '#2c2621', '#171411']} />
          </Circle>
          <Circle cx={0} cy={0} r={h * 0.2}>
            <RadialGradient c={vec(-h * 0.07, -h * 0.08)} r={h * 0.3} colors={['#7a6f64', '#3b342e', '#1d1916']} />
          </Circle>
        </Group>
      );
    case 'mic':
      return (
        <Group>
          {ring}
          <RoundedRect x={-h * 0.85} y={-h * 0.13} width={h * 1.25} height={h * 0.26} r={h * 0.13}>
            <LinearGradient start={vec(0, -h * 0.13)} end={vec(0, h * 0.13)} colors={['#4b4e57', '#1b1c20', '#0b0b0d']} />
          </RoundedRect>
          <RoundedRect x={-h * 0.95} y={-h * 0.19} width={h * 0.36} height={h * 0.38} r={h * 0.12}>
            <LinearGradient start={vec(0, -h * 0.2)} end={vec(0, h * 0.2)} colors={[...CHROME]} />
          </RoundedRect>
          <Path path={(() => { const p = make(); p.moveTo(h * 0.3, 0); p.lineTo(h * 0.55, h * 0.1); p.lineTo(h * 0.55, h * 0.95); return p; })()} style="stroke" strokeWidth={h * 0.08} color="#2a2c32" />
        </Group>
      );
    case 'desk':
      return (
        <Group>
          {ring}
          {shadow}
          <Path path={(() => { const p = make(); p.moveTo(-h * 0.95, h * 0.6); p.lineTo(h * 0.95, h * 0.6); p.lineTo(h * 0.75, -h * 0.5); p.lineTo(-h * 0.75, -h * 0.5); p.close(); return p; })()}>
            <LinearGradient start={vec(0, -h * 0.5)} end={vec(0, h * 0.6)} colors={['#4b4e57', '#26282e', '#121316']} />
          </Path>
          {[0, 1, 2, 3].map((i) => (
            <Group key={i}>
              <RoundedRect x={-h * 0.55 + i * h * 0.36} y={-h * 0.3} width={h * 0.06} height={h * 0.75} r={2} color="#0b0b0d" />
              <RoundedRect x={-h * 0.62 + i * h * 0.36} y={-h * 0.05 + (i % 2) * h * 0.2} width={h * 0.2} height={h * 0.12} r={2} color="#e1e4ea" />
            </Group>
          ))}
        </Group>
      );
    default:
      return null;
  }
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
      } else if (b.y > a.y) {
        // Down to a lower lane.
        p.moveTo(a.x, a.y + S * 0.5);
        p.cubicTo(a.x, (a.y + b.y) / 2, b.x, (a.y + b.y) / 2, b.x, b.y - S * 0.42);
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
                    const x = a.x + S * 0.6 + ((b.x - a.x - S * 1.2) * (k + 0.5)) / n;
                    const r = S * 0.28 + k * S * 0.05;
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
                <NodeIcon kind={n.kind} S={S} lit={highlight === n.id} />
              </Group>
            );
          })}
        </Canvas>
        <StaticLabels labels={labels} xf={{ view: 'side', s: 1, ox: 0, oy: 0 }} scale={ts} w={w} />
      </View>
    </Pressable>
  );
}
