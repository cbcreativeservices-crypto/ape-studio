/**
 * THE SOUND FIELD AT THE CAPSULE (F11 L5, L11–L24; GRAS-FF): how sound
 * meets a measurement mic in each of the three fields its response can be
 * made for — drawn at the capsule's true size (a 1/2 in capsule, 12.7 mm)
 * with wavefronts at a REAL wavelength: λ = c / f with the speed of sound
 * from the calculators (calcUnits.speedOfSoundAir, 20 °C).
 *
 *   FREE FIELD   plane wavefronts from one direction; ANGLE turns where
 *                they come from (0° = straight at the grid)
 *   PRESSURE     the capsule sealed in a calibrator's coupler: the same
 *                pressure all over the diaphragm, no direction at all
 *   RANDOM       wavefronts from many directions at once (a reverberant room)
 *
 * The wavelength drawn is the one at the chosen FREQUENCY. At 10 kHz it is
 * about 3.4 cm — not much bigger than the capsule — which is why the field
 * a mic is made for matters most in the highs; at 1 kHz it is about 34 cm,
 * and the capsule hardly disturbs the field. A simplified picture: straight
 * wavefronts, no diffraction drawn. FULLY SILENT; nothing moves by itself.
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { MeasurementMic } from '../../../../../../features/lab/micDrawings';
import { speedOfSoundAir } from '../../../../calc/calcUnits.ts';
import { useStageTextScale } from '../../../../rack/stageAspect';
import { fitXform } from '../../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../../engine/scene/StaticLabels';
import { Calibrator } from './MeasureArt';
import { CAPSULE, MEAS_DIMS, type FieldType } from './measureSpec.ts';

/** The wavelength (mm) at f Hz in air at 20 °C (the calculator's speed of sound). */
export function wavelengthMm(fHz: number): number {
  return (speedOfSoundAir(20) / fHz) * 1000;
}

const BOX = { u0: -330, u1: 270, v0: -190, v1: 190 };
const R = CAPSULE.half.mm / 2;
const LEN = MEAS_DIMS.bodyHalf.mm;

/** Parallel wavefronts across the box, travelling along `dir` (unit, the way the sound goes). */
function planeFronts(dirDeg: number, lambda: number, reach: number): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  const a = (dirDeg * Math.PI) / 180;
  // Travelling toward the capsule at the origin FROM the direction dirDeg.
  const ux = -Math.cos(a);
  const uy = -Math.sin(a);
  const nx = -uy;
  const ny = ux;
  const n = Math.min(40, Math.floor(reach / lambda));
  for (let k = 1; k <= n; k++) {
    const d = -k * lambda + 40;
    const cx = ux * d;
    const cy = uy * d;
    p.moveTo(cx - nx * reach, cy - ny * reach);
    p.lineTo(cx + nx * reach, cy + ny * reach);
  }
  return p;
}

/** Short wavefront arcs arriving from eight directions (a diffuse-ish field). */
function randomFronts(lambda: number): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.3;
    for (let k = 1; k <= 3; k++) {
      const d = 40 + k * Math.max(18, lambda * 0.8);
      const cx = Math.cos(a) * d;
      const cy = Math.sin(a) * d;
      const tx = -Math.sin(a) * 22;
      const ty = Math.cos(a) * 22;
      p.moveTo(cx - tx, cy - ty);
      p.lineTo(cx + tx, cy + ty);
    }
  }
  return p;
}

/** Arrowheads pointing in toward the capsule along `deg` (where the sound comes from). */
function arrows(degs: readonly number[], at: number): ReturnType<typeof Skia.Path.Make> {
  const p = Skia.Path.Make();
  for (const deg of degs) {
    const a = (deg * Math.PI) / 180;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const tip = { x: ux * at, y: uy * at };
    const tail = { x: ux * (at + 60), y: uy * (at + 60) };
    p.moveTo(tail.x, tail.y);
    p.lineTo(tip.x, tip.y);
    const hx = -ux * 14;
    const hy = -uy * 14;
    p.moveTo(tip.x, tip.y);
    p.lineTo(tip.x - hx + -uy * 8, tip.y - hy + ux * 8);
    p.moveTo(tip.x, tip.y);
    p.lineTo(tip.x - hx - -uy * 8, tip.y - hy - ux * 8);
  }
  return p;
}

export function FieldScene({ w, h, field, angleDeg, freqHz, accessibilityLabel }: { w: number; h: number; field: FieldType; angleDeg: number; freqHz: number; accessibilityLabel: string }) {
  const k = useStageTextScale();
  const xf = useMemo(() => fitXform('side', BOX, w, h, 8), [w, h]);
  const lambda = wavelengthMm(freqHz);
  // The mic points LEFT (−u): its front (the grid) at the origin, the body to the right.
  const fronts = useMemo(() => (field === 'freeField' ? planeFronts(180 - angleDeg, lambda, 900) : field === 'random' ? randomFronts(lambda) : null), [field, angleDeg, lambda]);
  const arr = useMemo(() => (field === 'freeField' ? arrows([180 - angleDeg], 70) : field === 'random' ? arrows([20, 65, 110, 155, 200, 245, 290, 335], 70) : null), [field, angleDeg]);
  const clip = useMemo(() => Skia.Path.Make().addRect(Skia.XYWHRect(BOX.u0, BOX.v0, BOX.u1 - BOX.u0, BOX.v1 - BOX.v0)), []);
  const px = 1 / xf.s;
  const labels: StaticLabel[] =
    field === 'pressure'
      ? [
          { id: 'cal', text: 'CALIBRATOR · ITS COUPLER SEALED ON THE CAPSULE', short: 'CALIBRATOR', u: -150, v: -120, align: 'center', tone: 'amber' },
          { id: 'mic', text: 'MEASUREMENT MIC', u: 150, v: 60, align: 'center', tone: 'muted' },
        ]
      : [
          { id: 'mic', text: '1/2 IN MEASUREMENT MIC', short: 'MIC', u: 110, v: 45, align: 'center', tone: 'muted' },
          { id: 'lam', text: `WAVEFRONTS ${Math.round(lambda)} MM APART (${freqHz >= 1000 ? `${freqHz / 1000} kHz` : `${freqHz} Hz`})`, short: `${Math.round(lambda)} MM APART`, u: -150, v: 160, align: 'center', tone: 'blue' },
        ];
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          <Group clip={clip}>
            {fronts ? <Path path={fronts} style="stroke" strokeWidth={2.2 * px} color="#6fa8ff" opacity={0.55} /> : null}
            {arr ? <Path path={arr} style="stroke" strokeWidth={2.4 * px} strokeCap="round" color="#ffc64d" /> : null}
          </Group>
          <Group transform={[{ rotate: -Math.PI / 2 }]}>
            <MeasurementMic r={R} len={LEN} />
          </Group>
          {field === 'pressure' ? (
            <Group>
              {/* the calibrator over the capsule, its mouth facing +u onto the grid */}
              <Group transform={[{ scale: -1 }]}>
                <Calibrator x0={-14} cy={0} len={210} dia={110} adapter={false} lit levelDb={94} />
              </Group>
              <Path path={Skia.Path.Make().addRect(Skia.XYWHRect(-30, -R * 0.9, 30, R * 1.8))} color="#6fa8ff" opacity={0.35} />
            </Group>
          ) : null}
          {field === 'freeField' ? (
            <Path path={Skia.Path.Make().addCircle(0, 0, 60)} style="stroke" strokeWidth={1.2 * px} color="#ffc64d" opacity={0.35}>
              <DashPathEffect intervals={[4 * px, 4 * px]} />
            </Path>
          ) : null}
        </Group>
      </Canvas>
      <StaticLabels labels={labels} xf={xf} scale={k} w={w} />
    </View>
  );
}
