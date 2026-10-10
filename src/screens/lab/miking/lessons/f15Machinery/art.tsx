/**
 * F15 MACHINERY AND PRODUCT SOUND — the look (charter §2 layer 3): the fan
 * on its table in its room, with the exclusion zone and the airflow drawn
 * (FanArt), the face of the fan for MEET IT, the part labels and hit areas,
 * and the lesson's own pages. FULLY SILENT; nothing moves by itself.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import type { ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { fitXform } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { useStageTextScale } from '../../../rack/stageAspect';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { flowRadius, flowStart, zoneRadius } from '../shared/measure/exclusion.ts';
import { EXCL, FAN, HUB, OP15, TABLE } from './geometry.ts';
import { FanFront, FanScene } from './FanArt';
import { F15_PAGES, F15_STEP_COUNTS } from './pages';

function Scene({ view }: { view: ViewId }) {
  return <FanScene view={view} />;
}

const R = zoneRadius(EXCL);
const S = flowStart(EXCL);
const FL = EXCL.flowLen;
const RE = flowRadius(EXCL, FL);
const MX = (FAN.guardBack + FAN.motorBack) / 2;

const HITS: SceneHits = {
  side: [
    { id: 'sensor', u0: MX - 40, u1: MX + 40, v0: HUB.y - FAN.motorR - 40, v1: HUB.y - FAN.motorR + 6 },
    { id: 'fan.vent', u0: FAN.motorBack - 14, u1: FAN.motorBack + 14, v0: HUB.y - 50, v1: HUB.y + 50 },
    { id: 'fan.motor', u0: FAN.motorBack, u1: FAN.guardBack, v0: HUB.y - FAN.motorR, v1: HUB.y + FAN.motorR },
    { id: 'fan.blades', u0: -16, u1: 30, v0: HUB.y - FAN.guardR * 0.88, v1: HUB.y + FAN.guardR * 0.88 },
    { id: 'fan.guard', u0: FAN.guardBack, u1: FAN.guardFront + 4, v0: HUB.y - FAN.guardR, v1: HUB.y + FAN.guardR },
    { id: 'fan.base', u0: -FAN.baseR, u1: FAN.baseR, v0: -FAN.baseH * 1.4, v1: 0 },
    { id: 'table', u0: -TABLE.half, u1: TABLE.half, v0: TABLE.top, v1: TABLE.floor },
    { id: 'zone', u0: -R, u1: R, v0: HUB.y - R, v1: TABLE.top },
    { id: 'airflow', u0: S.x, u1: S.x + FL, v0: S.y - RE, v1: S.y + RE },
    { id: 'op', u0: OP15.x - 260, u1: OP15.x + 260, v0: TABLE.floor - 1800, v1: TABLE.floor },
  ],
  top: [
    { id: 'fan.motor', u0: FAN.motorBack, u1: FAN.guardBack, v0: -FAN.motorR, v1: FAN.motorR },
    { id: 'fan.guard', u0: FAN.guardBack, u1: FAN.guardFront + 4, v0: -FAN.guardR, v1: FAN.guardR },
    { id: 'table', u0: -TABLE.half, u1: TABLE.half, v0: -TABLE.half, v1: TABLE.half },
    { id: 'zone', u0: -R, u1: R, v0: -R, v1: R },
    { id: 'airflow', u0: S.x, u1: S.x + FL, v0: -RE, v1: RE },
    { id: 'op', u0: OP15.x - 280, u1: OP15.x + 280, v0: OP15.z - 280, v1: OP15.z + 280 },
  ],
};

const LABELS = {
  side: [
    { id: 'fan.guard', text: 'GUARD', u: 230, v: HUB.y - 330, align: 'left' as const, at: { u: FAN.guardRim + 10, v: HUB.y - FAN.guardR } },
    { id: 'fan.motor', text: 'MOTOR', u: -400, v: HUB.y - 300, align: 'right' as const, at: { u: MX, v: HUB.y - FAN.motorR } },
    { id: 'sensor', text: 'CONTACT SENSOR', short: 'SENSOR', u: -560, v: HUB.y - 560, align: 'right' as const, at: { u: MX, v: HUB.y - FAN.motorR - 34 } },
    { id: 'zone', text: 'EXCLUSION ZONE', short: 'ZONE', u: 0, v: HUB.y - R - 90, align: 'center' as const },
    { id: 'airflow', text: 'AIRFLOW', u: 1300, v: S.y - RE - 70, align: 'center' as const },
    { id: 'table', text: 'TABLE', u: 620, v: 420, align: 'left' as const, at: { u: TABLE.half, v: 300 } },
    { id: 'op', text: 'YOU, STANDING BACK', short: 'YOU', u: OP15.x, v: TABLE.floor - 1900, align: 'center' as const, at: { u: OP15.x, v: TABLE.floor - 1640 }, alts: [{ u: OP15.x - 420, v: TABLE.floor - 1300, align: 'right' as const }] },
  ],
  top: [
    { id: 'zone', text: 'EXCLUSION ZONE', short: 'ZONE', u: 0, v: -R - 90, align: 'center' as const },
    { id: 'airflow', text: 'AIRFLOW', u: 1500, v: -RE - 80, align: 'center' as const },
    { id: 'op', text: 'YOU', u: OP15.x, v: OP15.z - 380, align: 'center' as const },
  ],
};

/* ── MEET IT's figure: the fan face-on, as its user sees it ── */

/** The figure's box (mm): the guard's centre at the origin, the base below. */
const FIG_BOX = { u0: -260, u1: 260, v0: -200, v1: 360 };
const FIG_ASPECT = (FIG_BOX.u1 - FIG_BOX.u0) / (FIG_BOX.v1 - FIG_BOX.v0);

function FanFigure({ w, h }: { w: number; h: number }) {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('side', FIG_BOX, w, h, 6), [w, h]);
  const r = FAN.guardR;
  const labels: StaticLabel[] = [
    { id: 'guard', text: 'GUARD', u: -r - 20, v: -r + 10, align: 'right', tone: 'amber', at: { u: -r * 0.8, v: -r * 0.6 } },
    { id: 'blades', text: 'BLADES', u: r + 20, v: -r * 0.5, align: 'left', tone: 'muted', at: { u: r * 0.55, v: -r * 0.3 } },
    { id: 'hub', text: 'HUB', u: r + 20, v: 40, align: 'left', tone: 'muted', at: { u: r * 0.17, v: 0 } },
    { id: 'base', text: 'BASE', u: r + 20, v: r * 2.0, align: 'left', tone: 'muted', at: { u: r * 0.6, v: r * 2.0 } },
  ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel="The guarded desk fan from the front: the wire guard with its rings and radial wires, the three blades behind it, the hub, the column and the round base.">
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <FanFront cx={0} cy={0} r={r} />
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}

export const F15_ART: LessonArt = {
  Instrument: Scene,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  figure: { aspect: FIG_ASPECT, render: (w, h) => <FanFigure w={w} h={h} /> },
  pages: F15_PAGES,
  stepCounts: F15_STEP_COUNTS,
};
