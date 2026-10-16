/**
 * F11 MEASUREMENT MICROPHONES AND CALIBRATION — the look (charter §2 layer
 * 3): the test bench from the side and from above — the floor, the two-way
 * test loudspeaker on its stand, the person running the measurement standing
 * back — and the lesson's own pages (shared/measure/measurePages.tsx).
 * FULLY SILENT; nothing moves by itself.
 */
import { Group, LinearGradient, Path, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import type { VariantId, ViewId } from '../../engine/model/types.ts';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { ReadingOperator, TestSpeaker, make, rectP } from '../shared/measure/MeasureArt';
import { hitTestOf, labelsOf, type SceneHits } from '../shared/measure/sceneHits.ts';
import { MIC_ANATOMY_ASPECT, MicAnatomy } from '../shared/measure/MicAnatomy';
import { F11_GROUND, F11_OP, F11_OP_SIDE, F11_OP_TOP, F11_SPK, F11_VIEWS } from './geometry.ts';
import { F11_PAGES, F11_STEP_COUNTS } from './pages';

function Floor({ view }: { view: ViewId }) {
  const p = useMemo(() => {
    const b = F11_VIEWS[view];
    const slab = make();
    const seams = make();
    if (view === 'side') {
      rectP(slab, b.u0 - 200, F11_GROUND, b.u1 + 200, F11_GROUND + 60);
    } else {
      rectP(slab, b.u0 - 200, b.v0 - 200, b.u1 + 200, b.v1 + 200);
      for (let x = Math.ceil((b.u0 - 200) / 600) * 600; x < b.u1 + 200; x += 600) {
        seams.moveTo(x, b.v0 - 200);
        seams.lineTo(x, b.v1 + 200);
      }
      for (let z = Math.ceil((b.v0 - 200) / 600) * 600; z < b.v1 + 200; z += 600) {
        seams.moveTo(b.u0 - 200, z);
        seams.lineTo(b.u1 + 200, z);
      }
    }
    return { slab, seams };
  }, [view]);
  return (
    <Group>
      <Path path={p.slab}>
        <LinearGradient start={vec(0, view === 'side' ? F11_GROUND : -1000)} end={vec(0, view === 'side' ? F11_GROUND + 60 : 2000)} colors={view === 'side' ? ['#3a3a3f', '#1f2024'] : ['#1d1e22', '#18191c']} />
      </Path>
      <Path path={p.seams} style="stroke" strokeWidth={3} color="#26272c" />
      {view === 'side' ? <Path path={rectP(make(), F11_VIEWS.side.u0 - 200, F11_GROUND, F11_VIEWS.side.u1 + 200, F11_GROUND + 3)} color="#6b6e76" opacity={0.6} /> : null}
    </Group>
  );
}

function BenchScene({ view }: { view: ViewId; variant: VariantId }) {
  return (
    <Group>
      <Floor view={view} />
      <TestSpeaker g={F11_SPK} view={view} />
      <ReadingOperator pose={view === 'side' ? F11_OP_SIDE : F11_OP_TOP} />
    </Group>
  );
}

const HITS: SceneHits = {
  side: [
    { id: 'spk.tweeter', u0: -30, u1: 25, v0: -170, v1: -110 },
    { id: 'spk.woofer', u0: -30, u1: 30, v0: -30, v1: 140 },
    { id: 'spk.box', u0: -250, u1: 0, v0: -230, v1: 170 },
    { id: 'spk.stand', u0: -315, u1: 65, v0: 170, v1: F11_GROUND },
    { id: 'op', u0: F11_OP.x - 560, u1: F11_OP.x + 260, v0: F11_GROUND - 1800, v1: F11_GROUND },
  ],
  top: [
    { id: 'spk.box', u0: -250, u1: 20, v0: -125, v1: 125 },
    { id: 'spk.stand', u0: -315, u1: 65, v0: -170, v1: 170 },
    { id: 'op', u0: F11_OP.x - 560, u1: F11_OP.x + 280, v0: F11_OP.z - 280, v1: F11_OP.z + 280 },
  ],
};

const LABELS = {
  side: [
    { id: 'spk.box', text: 'TEST LOUDSPEAKER', short: 'SPEAKER', u: -125, v: -590, align: 'center' as const, at: { u: -125, v: -230 } },
    { id: 'spk.tweeter', text: 'TWEETER', u: 60, v: -420, align: 'left' as const, at: { u: 10, v: -140 } },
    { id: 'spk.woofer', text: 'WOOFER', u: 130, v: 420, align: 'left' as const, at: { u: 15, v: 55 } },
    { id: 'spk.stand', text: 'STAND', u: -125, v: 760, align: 'center' as const },
    { id: 'op', text: 'YOU, STANDING BACK', short: 'YOU', u: F11_OP.x - 240, v: F11_GROUND - 1720, align: 'right' as const, at: { u: F11_OP.x, v: F11_GROUND - 1640 }, alts: [{ u: F11_OP.x, v: F11_GROUND - 1900, align: 'center' as const }, { u: F11_OP.x - 300, v: F11_GROUND - 420, align: 'right' as const }] },
  ],
  top: [
    { id: 'spk.box', text: 'TEST LOUDSPEAKER', short: 'SPEAKER', u: -125, v: -260, align: 'center' as const },
    { id: 'op', text: 'YOU, STANDING BACK', short: 'YOU', u: F11_OP.x, v: F11_OP.z - 420, align: 'center' as const, at: { u: F11_OP.x, v: F11_OP.z }, alts: [{ u: F11_OP.x - 380, v: F11_OP.z, align: 'right' as const }, { u: F11_OP.x, v: F11_OP.z + 420, align: 'center' as const }] },
  ],
};

/** Where the setups put the mic, its boom, its lobe and its distance bracket:
 *  in front of the baffle, on the axis (art fix round 3, 2026-10-16 — the
 *  operator's name and TWEETER sat on the bracket and under the mic, faded).
 *  The part names keep off this band as they keep off a drawn figure
 *  (LessonArt.figureAt feeds only the labels' occupancy, never a tap). */
const MIC_BAND = {
  side: { u0: 40, u1: F11_OP.x - 300, v0: -250, v1: 260 },
  top: { u0: 40, u1: F11_OP.x - 300, v0: -320, v1: 320 },
} as const;
const inBand = (r: { u0: number; u1: number; v0: number; v1: number }, u: number, v: number, tol: number) => u >= r.u0 - tol && u <= r.u1 + tol && v >= r.v0 - tol && v <= r.v1 + tol;

export const F11_ART: LessonArt = {
  Instrument: BenchScene,
  labels: labelsOf(LABELS),
  hitTest: hitTestOf(HITS),
  labelsYieldToMic: true,
  figureAt: (view, _variant, u, v, tol) => inBand(MIC_BAND[view === 'side' ? 'side' : 'top'], u, v, tol),
  figure: { aspect: MIC_ANATOMY_ASPECT, render: (w, h) => <MicAnatomy w={w} h={h} label="A measurement microphone drawn large: the protection grid over the half-inch capsule, the preamp of the same diameter, the connector, and its cable to a power unit and an analyzer — one chain." /> },
  pages: F11_PAGES,
  stepCounts: F11_STEP_COUNTS,
};
