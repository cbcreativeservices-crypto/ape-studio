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
import type { Blocked } from '../geometry/collision.ts';
import { fmtAngle, fmtLen } from '../model/units.ts';
import { micType } from '../../data/micTypes.ts';
import type { Rig } from './useRig.ts';

export type PosAxis = 'x' | 'y' | 'z';
export type AimAxis = 'az' | 'el';

const AIM_MAX = 80;

function axisRange(rig: Rig, a: PosAxis): [number, number] {
  return [rig.bounds.min[a], rig.bounds.max[a]];
}

export function posWords(a: PosAxis, v: number): string {
  if (a === 'x') return `${fmtLen(Math.abs(v))} ${v >= 0 ? 'past' : 'before'} the batter-head plane`;
  if (a === 'y') return `${fmtLen(Math.abs(v))} ${v <= 0 ? 'above' : 'below'} the drum’s axis`;
  return `${fmtLen(Math.abs(v))} to the player’s ${v >= 0 ? 'right' : 'left'}`;
}

export function placementParams(opts: {
  rig: Rig;
  slot: MicSlot;
  posAxis: PosAxis;
  setPosAxis: (a: PosAxis) => void;
  aimAxis: AimAxis;
  setAimAxis: (a: AimAxis) => void;
  block: Blocked;
  setBlock: (b: Blocked) => void;
}): DockParam[] {
  const { rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis, block, setBlock } = opts;
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const pose: MicPose = m.pose;
  const surface = micType(m.typeId).mount === 'surface';
  const [lo, hi] = axisRange(rig, posAxis);
  const cur = pose.p[posAxis];
  const why = block ? ` · ✕ ${block.label}` : '';
  const out: DockParam[] = [
    {
      kind: 'fader',
      id: 'pos',
      label: 'POSITION',
      value: Math.min(1, Math.max(0, (cur - lo) / (hi - lo))),
      onChange: (v) => {
        const to: MicPose = { ...pose, p: { ...pose.p, [posAxis]: lo + v * (hi - lo) } };
        setBlock(rig.moveTo(slot, to).blocked);
      },
      format: () => `${posAxis === 'x' ? 'ALONG' : posAxis === 'y' ? 'HEIGHT' : 'ACROSS'} · ${posWords(posAxis, cur)}${why}`,
      formatShort: () => (posAxis === 'x' ? 'ALONG' : posAxis === 'y' ? 'HEIGHT' : 'ACROSS'),
      chooser: {
        title: 'MOVE THE MIC',
        selectedId: posAxis,
        onSelect: (id) => setPosAxis(id as PosAxis),
        options: [
          { id: 'x', label: 'ALONG the drum', blurb: 'Toward or away from the batter head (x). Distance is read from the head the zone names.' },
          { id: 'y', label: 'HEIGHT', blurb: surface ? 'A boundary plate rests on the pillow: its height is set by the cushioning.' : 'Up or down (y). Height above the floor is not shown — the floor line is unknown.' },
          { id: 'z', label: 'ACROSS', blurb: 'Toward the player’s left or right (z).' },
        ],
      },
    },
  ];
  if (!surface) {
    const a = aimAxis === 'az' ? pose.az : pose.el;
    out.push({
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (a + AIM_MAX) / (2 * AIM_MAX),
      home: 0.5,
      onChange: (v) => {
        const ang = Math.round((v * 2 - 1) * AIM_MAX);
        const to: MicPose = aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang };
        setBlock(rig.moveTo(slot, to).blocked);
      },
      format: () => `${aimAxis === 'az' ? (a >= 0 ? 'toward the player’s right' : 'toward the player’s left') : a >= 0 ? 'tilted up' : 'tilted down'} ${fmtAngle(Math.abs(a))}${why}`,
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
