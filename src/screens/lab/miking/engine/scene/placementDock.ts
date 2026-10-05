/**
 * The precise, ACCESSIBLE way to place a mic (blueprint §5.3): every
 * placement the drag can make is reachable from the dock with no drag.
 *
 *   POSITION ▸  chooser ALONG / HEIGHT / ACROSS, then the lane (x / y / z)
 *   AIM ▸       chooser LEFT–RIGHT / UP–DOWN, then the lane (az / el, ±80°)
 *
 * A fader move runs through `constrainMove` like a drag: a move into a part
 * stops at the last clear value and the lane says why ("✕ batter head").
 */
import type { DockParam } from '../../../rack/rackTypes';
import type { MicPose, MicSlot } from '../model/types.ts';
import { fmtAngle, fmtLen } from '../model/units.ts';
import { micType } from '../../data/micTypes.ts';
import { copyOf, type LessonCopy } from '../model/copy.ts';
import type { Rig } from './useRig.ts';

export type PosAxis = 'x' | 'y' | 'z';
export type AimAxis = 'az' | 'el';

const AIM_MAX = 80;

function axisRange(rig: Rig, a: PosAxis): [number, number] {
  return [rig.bounds.min[a], rig.bounds.max[a]];
}

/** The POSITION lane's words, from the lesson's axis words (copy.axes):
 *  `v` is measured from the variant's origin. A height of exactly 0 reads
 *  as the axis's minus side (the kick: "above axis"), as before. */
export function posWords(a: PosAxis, v: number, words: LessonCopy['axes'] = copyOf({}).axes): string {
  const w = words[a];
  const plus = a === 'y' ? v > 0 : v >= 0;
  return `${fmtLen(Math.abs(v))} ${plus ? w.plus : w.minus}`;
}

export function placementParams(opts: {
  rig: Rig;
  slot: MicSlot;
  posAxis: PosAxis;
  setPosAxis: (a: PosAxis) => void;
  aimAxis: AimAxis;
  setAimAxis: (a: AimAxis) => void;
}): DockParam[] {
  const { rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis } = opts;
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const pose: MicPose = m.pose;
  const surface = micType(m.typeId).mount === 'surface';
  const [lo, hi] = axisRange(rig, posAxis);
  const cur = pose.p[posAxis];
  const axes = copyOf(rig.lesson).axes;
  const origin = axes.origin?.[rig.variant]?.[posAxis] ?? 0;
  // The committed stop reason of THIS slot (the same one the strip and the
  // bezel print), not a page-wide copy.
  const block = rig.stop[slot];
  const stopWord = block ? `✕ ${rig.lesson.model.parts.find((p) => p.id === block.partId)?.short ?? block.label}` : '';
  const out: DockParam[] = [
    {
      kind: 'fader',
      id: 'pos',
      label: 'POSITION',
      value: Math.min(1, Math.max(0, (cur - lo) / (hi - lo))),
      onChange: (v) => {
        const to: MicPose = { ...pose, p: { ...pose.p, [posAxis]: lo + v * (hi - lo) } };
        rig.moveTo(slot, to);
      },
      // Compact: the lane prints its value right-aligned beside the label, so a
      // long line ran over "POSITION". The stop comes FIRST when there is one.
      format: () => (stopWord ? `${stopWord} · ${fmtLen(Math.abs(cur - origin))}` : posWords(posAxis, cur - origin, axes)),
      formatShort: () => (posAxis === 'x' ? axes.x.label.split(' ')[0] : posAxis === 'y' ? axes.y.label.split(' ')[0] : axes.z.label.split(' ')[0]),
      chooser: {
        title: 'MOVE THE MIC',
        selectedId: posAxis,
        onSelect: (id) => setPosAxis(id as PosAxis),
        options: [
          { id: 'x', label: axes.x.label, blurb: axes.x.blurb },
          { id: 'y', label: axes.y.label, blurb: surface ? axes.surfaceY ?? axes.y.blurb : axes.y.blurb },
          { id: 'z', label: axes.z.label, blurb: axes.z.blurb },
        ],
      },
    },
  ];
  if (!surface) {
    const a = aimAxis === 'az' ? pose.az : pose.el;
    // Left–right may swing past ±80° where the lesson allows (Lab 4: a mic
    // that faces the instrument from the far side); up–down stays ±80°.
    const lim = aimAxis === 'az' ? rig.lesson.model.aimAzLimit ?? AIM_MAX : AIM_MAX;
    out.push({
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: Math.min(1, Math.max(0, (a + lim) / (2 * lim))),
      home: 0.5,
      onChange: (v) => {
        const ang = Math.round((v * 2 - 1) * lim);
        const to: MicPose = aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang };
        rig.moveTo(slot, to);
      },
      format: () => `${stopWord ? `${stopWord} · ` : ''}${aimAxis === 'az' ? (a >= 0 ? 'to the right' : 'to the left') : a >= 0 ? 'tilted up' : 'tilted down'} ${fmtAngle(Math.abs(a))}`,
      formatShort: () => fmtAngle(a),
      chooser: {
        title: 'TURN THE MIC',
        selectedId: aimAxis,
        onSelect: (id) => setAimAxis(id as AimAxis),
        options: [
          { id: 'az', label: 'LEFT–RIGHT', blurb: 'Swing the front toward the player’s left or right (seen from above).' },
          { id: 'el', label: 'UP–DOWN', blurb: 'Tilt the front up or down (seen from the side).' },
        ],
      },
    });
  }
  return out;
}
