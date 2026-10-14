/**
 * The precise, ACCESSIBLE way to place a mic (blueprint §5.3): every
 * placement the drag can make is reachable from the dock with no drag.
 *
 *   POSITION ▸  chooser ALONG / HEIGHT / ACROSS, then the lane (x / y / z)
 *   AIM ▸       chooser LEFT–RIGHT / UP–DOWN, then the lane (az / el, ±80°)
 *
 * Each lane spans only what the mic can reach from where it is (reachOf,
 * 2026-10-14), so all of its travel moves the mic. A fader move still runs
 * through `constrainMove` like a drag: a move into a part stops at the last
 * clear value and the lane says why ("✕ batter head").
 */
import type { DockParam } from '../../../rack/rackTypes';
import type { MicPose, MicSlot } from '../model/types.ts';
import { fmtAngle, fmtLen } from '../model/units.ts';
import { micType } from '../../data/micTypes.ts';
import { copyOf, type LessonCopy } from '../model/copy.ts';
import type { Rig } from './useRig.ts';
import { checkAssembly, pinToSurface, type Blocked } from '../geometry/collision.ts';

/**
 * What a PREVIEW lane's last move really did (slider audit 2026-10-14).
 * The lane prints `format(v)` for the finger's value straight after
 * `onChange(v)`; when the mic was stopped by a part on the way, the words
 * used to name where the FINGER was ("12 cm above") while the mic sat at the
 * stop — and on release the cap jumped back to the stop the readout never
 * mentioned. A lane notes the constrained result here and its format reads
 * it back for that same value, so the readout always names where the mic IS,
 * with the stop first ("✕ batter head · 5 cm").
 */
export type Held = { v: number; pose: MicPose; blocked: Blocked };
export function previewMemo(): { note: (v: number, r: { pose: MicPose; blocked: Blocked }) => void; at: (v: number) => Held | null } {
  let last: Held | null = null;
  return {
    note: (v, r) => {
      last = { v, pose: r.pose, blocked: r.blocked };
    },
    at: (v) => (last && last.v === v ? last : null),
  };
}

/** "✕ batter head" for a stop, '' when clear — the part's short name. */
export function stopWordOf(rig: Pick<Rig, 'lesson'>, b: Blocked): string {
  return b ? `✕ ${rig.lesson.model.parts.find((p) => p.id === b.partId)?.short ?? b.label}` : '';
}

export type PosAxis = 'x' | 'y' | 'z';
export type AimAxis = 'az' | 'el';

const AIM_MAX = 80;

function axisRange(rig: Rig, a: PosAxis): [number, number] {
  return [rig.bounds.min[a], rig.bounds.max[a]];
}

/**
 * The stretch of ONE axis this mic can really reach from `pose` (slider
 * audit 2026-10-14). The POSITION lane used to span the whole picture's
 * bounds, and the AIM lane ±80°, while the mic stops at the first part it
 * meets: a clip mic on a hoop could travel 5–8 % of its lane, the kick's
 * inside mic about a fifth — the rest of the travel moved the cap and
 * nothing else ("it didn't change anything / didn't progress evenly").
 * The lane now spans exactly what the mic can reach along that axis, so
 * every bit of travel moves the mic evenly; each end that a PART closes
 * carries that part (the lane prints "✕ batter head" there).
 *
 * Walked outward in coarse steps (a part's no-go region is at least the mic's
 * own diameter thick) and refined by bisection to under a millimetre. A side
 * that is still clear after MAX_CHECKS is left at the lane's old end — as
 * before, the move itself still stops at any part (`constrainMove`). Pure and
 * cached per scene + mic body, so a re-render costs nothing.
 */
export type Reach = { lo: number; hi: number; loStop: Blocked; hiStop: Blocked };
export type ReachAxis = PosAxis | AimAxis;
const MAX_CHECKS = 48;
const reachCache = new WeakMap<object, WeakMap<object, Map<string, Reach>>>();

export function reachOf(rig: Pick<Rig, 'scene' | 'body' | 'pin'>, slot: MicSlot, pose: MicPose, axis: ReachAxis, lo: number, hi: number): Reach {
  const body = rig.body[slot];
  const pin = rig.pin[slot];
  let byBody = reachCache.get(rig.scene);
  if (!byBody) reachCache.set(rig.scene, (byBody = new WeakMap()));
  let m = byBody.get(body);
  if (!m) byBody.set(body, (m = new Map()));
  const key = `${axis}|${pose.p.x}|${pose.p.y}|${pose.p.z}|${pose.az}|${pose.el}|${lo}|${hi}|${pin ? 1 : 0}`;
  const hit = m.get(key);
  if (hit) return hit;
  const r = walkReach(rig.scene, body, pin, pose, axis, lo, hi);
  if (m.size > 400) m.clear();
  m.set(key, r);
  return r;
}

const getAx = (p: MicPose, a: ReachAxis): number => (a === 'az' ? p.az : a === 'el' ? p.el : p.p[a]);
const setAx = (p: MicPose, a: ReachAxis, v: number): MicPose => (a === 'az' ? { ...p, az: v } : a === 'el' ? { ...p, el: v } : { ...p, p: { ...p.p, [a]: v } });

export function walkReach(scene: Rig['scene'], body: Rig['body']['A'], pin: Rig['pin']['A'], pose: MicPose, axis: ReachAxis, lo: number, hi: number): Reach {
  const angle = axis === 'az' || axis === 'el';
  const step = angle ? 3 : 12;
  const at = (v: number) => (pin ? pinToSurface(setAx(pose, axis, v), pin.top, body, pin.halfWidth) : setAx(pose, axis, v));
  const cur = getAx(at(getAx(pose, axis)), axis);
  // A mic that starts inside a part escapes freely (constrainMove): keep the old lane.
  if (checkAssembly(scene, at(cur), body)) return { lo, hi, loStop: null, hiStop: null };
  const side = (dir: 1 | -1): [number, Blocked] => {
    const end = dir > 0 ? hi : lo;
    let clear = cur;
    for (let k = 0; k < MAX_CHECKS; k++) {
      if ((end - clear) * dir <= 1e-9) return [end, null];
      const want = dir > 0 ? Math.min(end, clear + step) : Math.max(end, clear - step);
      const q = at(want);
      const got = getAx(q, axis);
      // A surface mic pinned at its surface's edge: the axis goes no further.
      if ((got - clear) * dir <= 1e-9) return [clear, null];
      const b = checkAssembly(scene, q, body);
      if (!b) {
        clear = got;
        continue;
      }
      // Refine the stop between the last clear value and the blocked one.
      let a = clear;
      let z = got;
      let stop: Blocked = b;
      for (let i = 0; i < 6; i++) {
        const mid = (a + z) / 2;
        const bm = checkAssembly(scene, at(mid), body);
        if (bm) {
          z = mid;
          stop = bm;
        } else a = mid;
      }
      return [a, stop];
    }
    return [end, null]; // still clear after the budget: the lane's old end
  };
  const [l, ls] = side(-1);
  const [h, hs] = side(1);
  return { lo: l, hi: h, loStop: ls, hiStop: hs };
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
  // The lane spans what the mic can really reach along this axis (reachOf);
  // a mic with nowhere to go keeps the old span (its move still says why).
  const [blo, bhi] = axisRange(rig, posAxis);
  const pr = reachOf(rig, m.slot, pose, posAxis, blo, bhi);
  const fits = pr.hi - pr.lo >= 1;
  const lo = fits ? pr.lo : blo;
  const hi = fits ? pr.hi : bhi;
  /** The part that closes the lane at this end, if the mic sits there. */
  const posEnd = (x: number): Blocked => (!fits ? null : Math.abs(x - lo) < 0.5 ? pr.loStop : Math.abs(x - hi) < 0.5 ? pr.hiStop : null);
  const cur = pose.p[posAxis];
  const axes = copyOf(rig.lesson).axes;
  const origin = axes.origin?.[rig.variant]?.[posAxis] ?? 0;
  // The committed stop reason of THIS slot (the same one the strip and the
  // bezel print), not a page-wide copy.
  const stopWord = stopWordOf(rig, rig.stop[slot]);
  const posHeld = previewMemo();
  const aimHeld = previewMemo();
  const out: DockParam[] = [
    {
      kind: 'fader',
      id: 'pos',
      label: 'POSITION',
      value: Math.min(1, Math.max(0, (cur - lo) / (hi - lo))),
      // While the finger rides the lane the mic moves through the shared
      // values only (rig.preview: the canvas follows, the page does not
      // re-render); the release commits it (owner, Pixel 2026-10-06:
      // "sliders not working" — a move used to re-render the whole page).
      onChange: (v) => {
        posHeld.note(v, rig.preview(slot, { ...pose, p: { ...pose.p, [posAxis]: lo + v * (hi - lo) } }));
      },
      onCommit: () => rig.commit(slot),
      // Compact: the lane prints its value right-aligned beside the label, so a
      // long line ran over "POSITION". The stop comes FIRST when there is one.
      // (Called with the finger's value while it rides the lane.)
      format: (v) => {
        // While the finger rides the lane: where the mic really got to.
        const h = posHeld.at(v);
        if (h) {
          const sw = stopWordOf(rig, h.blocked ?? posEnd(h.pose.p[posAxis]));
          const got = h.pose.p[posAxis] - origin;
          return sw ? `${sw} · ${fmtLen(Math.abs(got))}` : posWords(posAxis, got, axes);
        }
        const at = Math.abs(lo + v * (hi - lo) - cur) < 0.5 ? cur : lo + v * (hi - lo);
        const sw = at === cur ? stopWord || stopWordOf(rig, posEnd(cur)) : '';
        return sw ? `${sw} · ${fmtLen(Math.abs(cur - origin))}` : posWords(posAxis, at - origin, axes);
      },
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
    // The lane turns the mic about the model's aim home (a guitar mic faces
    // the top at az = −90°); the kick's home is 0, 0. A lesson may let a mic
    // swing further left–right (aimAzLimit, up to 180°: face the other way).
    const home = rig.lesson.model.aimHome ?? { az: 0, el: 0 };
    const h0 = aimAxis === 'az' ? home.az : home.el;
    const a = (aimAxis === 'az' ? pose.az : pose.el) - h0;
    const lim = aimAxis === 'az' ? rig.lesson.model.aimAzLimit ?? AIM_MAX : AIM_MAX;
    // As POSITION: the lane spans the turn the mic really has (reachOf), in
    // whole degrees; home (double-tap) is the aim home when it is in reach.
    const ar = reachOf(rig, m.slot, pose, aimAxis, h0 - lim, h0 + lim);
    const afits = ar.hi - ar.lo >= 2;
    const A0 = afits ? Math.ceil(ar.lo - 1e-6) : h0 - lim;
    const A1 = afits ? Math.floor(ar.hi + 1e-6) : h0 + lim;
    const angAt = (v: number) => Math.round(A0 + v * (A1 - A0));
    const aimEnd = (abs: number): Blocked => (!afits ? null : Math.abs(abs - A0) < 1 ? ar.loStop : Math.abs(abs - A1) < 1 ? ar.hiStop : null);
    const words = (x: number) => `${aimAxis === 'az' ? (x >= 0 ? 'to the right' : 'to the left') : x >= 0 ? 'tilted up' : 'tilted down'} ${fmtAngle(Math.abs(x))}`;
    out.push({
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: Math.min(1, Math.max(0, (a + h0 - A0) / (A1 - A0))),
      home: h0 >= A0 && h0 <= A1 ? (h0 - A0) / (A1 - A0) : undefined,
      onChange: (v) => {
        const ang = angAt(v);
        aimHeld.note(v, rig.preview(slot, aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang }));
      },
      onCommit: () => rig.commit(slot),
      format: (v) => {
        const h = aimHeld.at(v);
        if (h) {
          const abs = aimAxis === 'az' ? h.pose.az : h.pose.el;
          const sw = stopWordOf(rig, h.blocked ?? aimEnd(abs));
          return `${sw ? `${sw} · ` : ''}${words(Math.round(abs - h0))}`;
        }
        const want = angAt(v) - h0;
        const live = Math.abs(want - a) >= 1;
        const x = live ? want : a;
        const sw = live ? '' : stopWord || stopWordOf(rig, aimEnd(a + h0));
        return `${sw ? `${sw} · ` : ''}${words(x)}`;
      },
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
