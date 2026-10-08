/**
 * HandPlan — THE SETTING for the hand-drum family (LESSON_JOURNEY §6 stage
 * 3, §8): the band seen from above, with the lesson's own drums drawn by its
 * art (top view), the player at them, and the neighbours as illustrated real
 * objects — a drum kit, a bass amp, other percussion, a vocal mic, floor
 * monitors, the audience and PA, or a studio room. Lit from the upper left
 * like the rest of the lab. Positions are ILLUSTRATIVE (said in the badge).
 *
 * Nothing moves (D8). A tap names an item; the dock's ITEM fader is the
 * no-tap path to the same cards.
 */
import { useMemo, type ReactElement } from 'react';
import { Pressable, View } from 'react-native';
import { BlurMask, Canvas, Circle, Group, LinearGradient, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { VariantId } from '../../../engine/model/types.ts';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import type { PlanThing } from './family.ts';
import { INK } from './handDrumArt';
import { FigureHead, headAbove } from '../players/PlayerFigure';
import { pt } from '../players/playerPose';

/** The player's head from above (nose +v), built once on first draw. */
let playerHeadTop: ReturnType<typeof headAbove>['fill'] | null = null;
const getPlayerHeadTop = () => (playerHeadTop ??= headAbove(pt(0, 0), 96).fill);

const AMBER = '#ffc64d';
type SkPath = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();

/** How far a tap may land from a thing's anchor and still name it (mm). */
const REACH: Record<PlanThing['kind'], number> = { kit: 620, amp: 330, perc: 360, micstand: 260, wedge: 330, sidefill: 360, audience: 500, room: 140, player: 330, drums: 420, keys: 520 };

export function planHit(things: readonly PlanThing[], scene: 'kit' | 'stage' | 'studio', u: number, v: number, tol: number, box: { u0: number; u1: number; v0: number; v1: number }): string | null {
  const shown = things.filter((t) => t.scene === 'all' || t.scene === scene);
  let best: string | null = null;
  let bd = 1e12;
  for (const t of shown) {
    if (t.kind === 'room') {
      const edge = Math.min(Math.abs(u - box.u0), Math.abs(u - box.u1), Math.abs(v - box.v0), Math.abs(v - box.v1));
      if (edge <= REACH.room + tol && edge < bd) {
        bd = edge;
        best = t.id;
      }
      continue;
    }
    if (t.kind === 'audience') {
      if (u >= t.u - REACH.audience - tol && u - t.u < bd) {
        bd = Math.max(0, u - t.u);
        best = t.id;
      }
      continue;
    }
    const d = Math.hypot(u - t.u, v - t.v);
    if (d <= REACH[t.kind] + tol && d < bd) {
      bd = d;
      best = t.id;
    }
  }
  return best;
}

/* ── the illustrated neighbours (mm, centred on their anchor) ── */
function headDisc(cx: number, cy: number, r: number, coated = true) {
  return (
    <Group key={`${cx}:${cy}`}>
      <Circle cx={cx + 6} cy={cy + 9} r={r + 8} color="#000" opacity={0.5}>
        <BlurMask blur={8} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={r + 7}>
        <RadialGradient c={vec(cx - r * 0.5, cy - r * 0.5)} r={r * 1.8} colors={['#b9bec8', '#5b5f69', '#25272d']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.6} colors={coated ? ['#fbf8f0', '#ece5d5', '#cfc4ad'] : ['#f6e9cc', '#e6cf9e', '#c9a874']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={1.4} color="#6e6655" />
    </Group>
  );
}
function cymbal(cx: number, cy: number, r: number) {
  const lathe = make();
  for (let q = r * 0.3; q < r - 4; q += 10) lathe.addCircle(cx, cy, q);
  return (
    <Group key={`c${cx}:${cy}`}>
      <Circle cx={cx + 8} cy={cy + 11} r={r} color="#000" opacity={0.45}>
        <BlurMask blur={10} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.4, cy - r * 0.45)} r={r * 1.7} colors={['#ffe9a8', '#d6a84a', '#8a6420', '#3d2a08']} />
      </Circle>
      <Path path={lathe} style="stroke" strokeWidth={1} color="#5a4010" opacity={0.35} />
      <Circle cx={cx} cy={cy} r={r * 0.2} color="#b58a34" />
      <Circle cx={cx} cy={cy} r={6} color="#2a2c32" />
    </Group>
  );
}
function cabinet(cx: number, cy: number, w: number, d: number, face: number, grille = true) {
  return (
    <Group key={`k${cx}:${cy}`} transform={[{ translateX: cx }, { translateY: cy }, { rotate: face }]}>
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(-d / 2 + 12, -w / 2 + 16, d, w), 14, 14)); return p; })()} color="#000" opacity={0.55}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(-d / 2, -w / 2, d, w), 14, 14)); return p; })()}>
        <LinearGradient start={vec(-d / 2, -w / 2)} end={vec(d / 2, w / 2)} colors={['#3b3e46', '#24262c', '#15161a']} />
      </Path>
      {grille ? (
        <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(d / 2 - 26, -w / 2 + 14, 18, w - 28), 6, 6)); return p; })()} color="#0c0d10" />
      ) : null}
      <Path path={(() => { const p = make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(-d / 2, -w / 2, d, w), 14, 14)); return p; })()} style="stroke" strokeWidth={3} color="#70747f" />
    </Group>
  );
}

function Thing({ t, Drums, variant }: { t: PlanThing; Drums: (p: { view: 'top'; variant: VariantId }) => ReactElement; variant: VariantId }) {
  switch (t.kind) {
    case 'drums':
      return (
        <Group transform={[{ translateX: t.u }, { translateY: t.v }]}>
          <Drums view="top" variant={variant} />
        </Group>
      );
    case 'player': {
      // A player seen from above: shoulders, arms reaching forward, head.
      const sh = make();
      sh.addOval(Skia.XYWHRect(t.u - 130, t.v - 230, 260, 460));
      const arms = make();
      arms.moveTo(t.u + 40, t.v - 190);
      arms.quadTo(t.u + 190, t.v - 200, t.u + 300, t.v - 150);
      arms.moveTo(t.u + 40, t.v + 190);
      arms.quadTo(t.u + 190, t.v + 200, t.u + 300, t.v + 150);
      return (
        <Group>
          <Path path={sh} color="#000" opacity={0.5}>
            <BlurMask blur={14} style="normal" />
          </Path>
          <Path path={arms} style="stroke" strokeWidth={62} strokeCap="round" color="#2d3a52" />
          <Path path={arms} style="stroke" strokeWidth={46} strokeCap="round" color="#3f5276" />
          <Path path={sh}>
            <LinearGradient start={vec(t.u - 130, t.v - 230)} end={vec(t.u + 130, t.v + 230)} colors={['#5a6e96', '#3f5276', '#26324a']} />
          </Path>
          {/* The head: the figure's own skin silhouette from above (head fix
              2026-10-08 — a head ON A BODY is PlayerFigure's FigureHead, never
              a circle), its nose toward the drums (+u). */}
          <Group transform={[{ translateX: t.u + 10 }, { translateY: t.v }, { rotate: -Math.PI / 2 }]}>
            <FigureHead fill={getPlayerHeadTop()} />
          </Group>
        </Group>
      );
    }
    case 'kit':
      return (
        <Group>
          {headDisc(t.u + 260, t.v, 280)}
          {headDisc(t.u - 120, t.v - 340, 178)}
          {headDisc(t.u + 120, t.v - 260, 152)}
          {headDisc(t.u - 140, t.v + 320, 203)}
          {cymbal(t.u - 230, t.v - 580, 178)}
          {cymbal(t.u + 380, t.v + 430, 254)}
          {cymbal(t.u + 420, t.v - 470, 230)}
          <Circle cx={t.u - 420} cy={t.v} r={170}>
            <RadialGradient c={vec(t.u - 470, t.v - 50)} r={230} colors={['#4a4c55', '#22242a', '#101114']} />
          </Circle>
        </Group>
      );
    case 'amp':
      return cabinet(t.u, t.v, 560, 360, t.face ?? 0);
    case 'sidefill':
      return cabinet(t.u, t.v, 520, 420, t.face ?? 0);
    case 'wedge':
      return cabinet(t.u, t.v, 560, 300, t.face ?? 0);
    case 'keys': {
      const keys = make();
      for (let k = 0; k < 18; k++) keys.addRect(Skia.XYWHRect(t.u - 440 + k * 49, t.v - 60, 44, 120));
      return (
        <Group>
          {cabinet(t.u, t.v, 980, 320, Math.PI / 2, false)}
          <Path path={keys} color="#eceef2" />
        </Group>
      );
    }
    case 'micstand': {
      const legs = make();
      for (let k = 0; k < 3; k++) {
        const a = (k * 2 * Math.PI) / 3 + Math.PI / 6;
        legs.moveTo(t.u, t.v);
        legs.lineTo(t.u + Math.cos(a) * 220, t.v + Math.sin(a) * 220);
      }
      const boom = make();
      boom.moveTo(t.u, t.v);
      boom.lineTo(t.u - 260, t.v);
      return (
        <Group>
          <Path path={legs} style="stroke" strokeWidth={22} strokeCap="round" color={INK} />
          <Path path={legs} style="stroke" strokeWidth={15} strokeCap="round" color="#5b5f69" />
          <Path path={boom} style="stroke" strokeWidth={16} strokeCap="round" color="#4d515b" />
          <Circle cx={t.u - 280} cy={t.v} r={34}>
            <RadialGradient c={vec(t.u - 292, t.v - 12)} r={46} colors={['#9ba1ac', '#4c515b', '#1b1d22']} />
          </Circle>
        </Group>
      );
    }
    case 'perc':
      return (
        <Group>
          {headDisc(t.u - 60, t.v - 140, 92, false)}
          {headDisc(t.u - 60, t.v + 60, 110, false)}
          <Path path={(() => { const p = make(); p.moveTo(t.u + 110, t.v - 90); p.lineTo(t.u + 240, t.v - 120); p.lineTo(t.u + 240, t.v - 20); p.lineTo(t.u + 110, t.v - 40); p.close(); return p; })()}>
            <LinearGradient start={vec(t.u + 110, t.v - 120)} end={vec(t.u + 240, t.v - 20)} colors={['#6b707b', '#2a2c32', '#121317']} />
          </Path>
        </Group>
      );
    case 'audience': {
      const band = make();
      band.addRect(Skia.XYWHRect(t.u, -6000, 6000, 12000));
      return (
        <Group>
          <Path path={band}>
            <LinearGradient start={vec(t.u, 0)} end={vec(t.u + 700, 0)} colors={['rgba(111,168,255,0.0)', 'rgba(111,168,255,0.10)']} />
          </Path>
          {cabinet(t.u + 120, t.v - 1500, 600, 420, Math.PI)}
          {cabinet(t.u + 120, t.v + 1500, 600, 420, Math.PI)}
        </Group>
      );
    }
    case 'room':
      return null;
  }
}

export type HandPlanProps = {
  w: number;
  h: number;
  scene: 'kit' | 'stage' | 'studio';
  variant: VariantId;
  Drums: (p: { view: 'top'; variant: VariantId }) => ReactElement;
  things: readonly PlanThing[];
  box: { u0: number; u1: number; v0: number; v1: number };
  shortOf: (id: string) => string;
  highlight: string | null;
  onTap: (id: string) => void;
  accessibilityLabel: string;
};

export function HandPlan({ w, h, scene, variant, Drums, things, box, shortOf, highlight, onTap, accessibilityLabel }: HandPlanProps) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', box, w, h, 6), [w, h, box]);
  const shown = things.filter((t) => t.scene === 'all' || t.scene === scene);
  const room = useMemo(() => {
    const p: SkPath = make();
    p.addRect(Skia.XYWHRect(box.u0 + 40, box.v0 + 40, box.u1 - box.u0 - 80, box.v1 - box.v0 - 80));
    return p;
  }, [box]);
  const hl = shown.find((t) => t.id === highlight);
  const labels: StaticLabel[] = shown
    .filter((t) => t.kind !== 'room' && t.kind !== 'drums')
    .map((t) => ({ id: t.id, text: shortOf(t.id), u: t.kind === 'audience' ? t.u + 260 : t.u, v: t.kind === 'audience' ? t.v : t.v + (t.kind === 'player' ? 260 : t.kind === 'kit' ? 560 : 330), align: 'center' as const, tone: t.id === highlight ? ('amber' as const) : ('muted' as const) }));
  return (
    <Pressable
      onPress={(e) => {
        const u = (e.nativeEvent.locationX - xf.ox) / xf.s;
        const v = (e.nativeEvent.locationY - xf.oy) / xf.s;
        const id = planHit(things, scene, u, v, 30 / xf.s, box);
        if (id) onTap(id);
      }}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: w, height: h }}
    >
      <View style={{ width: w, height: h }} pointerEvents="none">
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={accessibilityLabel}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            {scene === 'studio' ? (
              <>
                <Path path={room} style="stroke" strokeWidth={60} color="#2a2420" />
                <Path path={room} style="stroke" strokeWidth={8} color="#6b5a48" />
              </>
            ) : null}
            {shown.map((t) => (
              <Thing key={t.id} t={t} Drums={Drums} variant={variant} />
            ))}
            {hl && hl.kind !== 'room' && hl.kind !== 'audience' ? <Circle cx={hl.u} cy={hl.v} r={REACH[hl.kind] * 0.8} style="stroke" strokeWidth={14} color={AMBER} opacity={0.9} /> : null}
            {hl && hl.kind === 'room' ? <Path path={room} style="stroke" strokeWidth={22} color={AMBER} /> : null}
          </Group>
        </Canvas>
        <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
      </View>
    </Pressable>
  );
}

