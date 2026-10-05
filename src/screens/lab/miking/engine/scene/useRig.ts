/**
 * useRig — who owns the placement state (blueprint §5.1).
 *
 *   SHARED VALUES (UI thread): each mic's pose and blocked part. A drag writes
 *   them directly in the gesture's worklets; the canvas reads them; React does
 *   NOT re-render while a finger moves.
 *   REACT STATE (JS): the committed mics, the variant, the reference surface.
 *   It learns about a drag only when the gesture ENDS (`commit`), and about a
 *   fader move on each move (ParamLane's existing per-move pattern).
 *
 * Every move goes through `constrainMove`, so a pose can never be inside a
 * solid — from a drag, a fader, or "go to zone".
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { CompiledScene, Lesson, MicBody, MicPattern, MicPose, MicSlot, MicState, Readouts, VariantId, Vec3 } from '../model/types.ts';
import { viewsOf } from '../model/types.ts';
import { checkAssembly, compileScene, constrainMove, pinToSurface, type Blocked, type Bounds } from '../geometry/collision.ts';
import { deriveReadouts, type ReadoutCtx } from '../geometry/readouts.ts';
import { zonesAvailable } from '../geometry/zones.ts';
import { micBodyOf } from '../model/validate.ts';
import { micType } from '../../data/micTypes.ts';
import { withStop } from './readoutText.ts';

export type SurfacePin = { top: { min: Vec3; max: Vec3 }; halfWidth: number } | null;

export type Rig = {
  lesson: Lesson;
  variant: VariantId;
  setVariant: (v: VariantId) => void;
  scene: CompiledScene;
  bounds: Bounds;
  mics: MicState[];
  pose: Record<MicSlot, SharedValue<MicPose>>;
  blocked: Record<MicSlot, SharedValue<Blocked>>;
  body: Record<MicSlot, MicBody>;
  pin: Record<MicSlot, SurfacePin>;
  /** Readout context per slot (plain data; safe to capture in worklets). */
  ctx: Record<MicSlot, ReadoutCtx>;
  surfaceId: string;
  setSurfaceId: (id: string) => void;
  lineId: string;
  /** The mic the dock edits (page 5). */
  active: MicSlot;
  setActive: (s: MicSlot) => void;
  /** Move toward `to` (constrained). Writes the shared value AND React. */
  moveTo: (slot: MicSlot, to: MicPose) => { pose: MicPose; blocked: Blocked };
  /** "Go to zone": jump straight to a validated pose (clear → placed;
   *  blocked → stays, and says why). No magnetic snapping anywhere else. */
  jumpTo: (slot: MicSlot, to: MicPose) => Blocked;
  /** Gesture end: copy the shared pose into React state. */
  commit: (slot: MicSlot) => void;
  setType: (slot: MicSlot, typeId: string) => void;
  setPattern: (slot: MicSlot, p: MicPattern) => void;
  setPolarity: (slot: MicSlot, pol: 1 | -1) => void;
  setOn: (slot: MicSlot, on: boolean) => void;
  readouts: (slot: MicSlot) => Readouts;
  /** The part that STOPPED the last move (a clear pose that a drag, a fader
   *  or a zone jump could not take further), committed with the pose. The
   *  live strip reads the same value from `blocked`; `shown()` folds it in so
   *  every readout says "✕ <part>" together (readoutText.withStop). */
  stop: Record<MicSlot, Blocked>;
  /** The readouts as SHOWN (bezel, NOW line, canvas label): `readouts`
   *  plus the stop reason. Credit keeps using `readouts` (real geometry). */
  shown: (slot: MicSlot) => Readouts;
  /** Bumped by every commit — pages watch it for credit events. */
  version: number;
};

export type RigInit = { variant?: VariantId; mics: { slot: MicSlot; typeId: string; pattern: MicPattern; pose: MicPose; polarity?: 1 | -1; on?: boolean }[] };

function pinFor(lesson: Lesson, typeId: string): SurfacePin {
  const t = micType(typeId);
  if (t.mount !== 'surface' || !t.surfacePartId) return null;
  const part = lesson.model.parts.find((p) => p.id === t.surfacePartId);
  if (!part || part.solid?.kind !== 'box') return null;
  return { top: { min: part.solid.min, max: part.solid.max }, halfWidth: (t.body.width?.mm ?? 0) / 2 };
}

/** Bounds a mic's front may occupy: the side and top view boxes together
 *  (the variant's own boxes, when it frames another drum). */
export function boundsOf(lesson: Lesson, variant: VariantId): Bounds {
  const v = viewsOf(lesson.model, variant);
  const s = v.side!;
  const t = v.top!;
  return { min: { x: Math.max(s.u0, t.u0) + 20, y: s.v0 + 20, z: t.v0 + 20 }, max: { x: Math.min(s.u1, t.u1) - 20, y: s.v1 - 20, z: t.v1 - 20 } };
}

/** The first reference surface / line offered in a variant. */
function firstSurface(lesson: Lesson, v: VariantId): string {
  return (lesson.model.surfaces.find((s) => !s.variants || s.variants.includes(v)) ?? lesson.model.surfaces[0])?.id ?? '';
}
function firstLine(lesson: Lesson, v: VariantId): string {
  return (lesson.model.lines.find((l) => !l.variants || l.variants.includes(v)) ?? lesson.model.lines[0])?.id ?? '';
}

export function useRig(lesson: Lesson, init: RigInit): Rig {
  const [variant, setVariantRaw] = useState<VariantId>(init.variant ?? lesson.model.defaultVariant);
  const scene = useMemo(() => compileScene(lesson.model, variant), [lesson, variant]);
  const bounds = useMemo(() => boundsOf(lesson, variant), [lesson, variant]);
  // A surface mic STARTS on its surface, like every later move (a zone's
  // start pose is a point in the zone; the plate rests on the pillow's top).
  // Before this, page 5's boundary plate began floating at the drum's centre
  // line until it was first moved.
  const [mics, setMics] = useState<MicState[]>(() =>
    init.mics.map((m) => {
      const pn = pinFor(lesson, m.typeId);
      const pose = pn ? pinToSurface(m.pose, pn.top, micBodyOf(micType(m.typeId)), pn.halfWidth) : m.pose;
      return { slot: m.slot, typeId: m.typeId, pattern: m.pattern, pose, polarity: m.polarity ?? 1, on: m.on ?? true };
    }),
  );
  const micsRef = useRef(mics);
  micsRef.current = mics;
  const first = (s: MicSlot) => mics.find((m) => m.slot === s) ?? mics[0];
  const poseA = useSharedValue<MicPose>(first('A').pose);
  const poseB = useSharedValue<MicPose>(first('B').pose);
  const blockedA = useSharedValue<Blocked>(null);
  const blockedB = useSharedValue<Blocked>(null);
  const pose = useMemo(() => ({ A: poseA, B: poseB }), [poseA, poseB]);
  const blocked = useMemo(() => ({ A: blockedA, B: blockedB }), [blockedA, blockedB]);
  const [surfaceId, setSurfaceId] = useState(() => firstSurface(lesson, init.variant ?? lesson.model.defaultVariant));
  const [active, setActive] = useState<MicSlot>('A');
  const [version, setVersion] = useState(0);
  const [stop, setStop] = useState<Record<MicSlot, Blocked>>({ A: null, B: null });
  const setStopOf = useCallback((slot: MicSlot, b: Blocked) => setStop((prev) => (prev[slot] === b ? prev : { ...prev, [slot]: b })), []);

  const typeA = first('A').typeId;
  const typeB = first('B').typeId;
  const body = useMemo(() => ({ A: micBodyOf(micType(typeA)), B: micBodyOf(micType(typeB)) }), [typeA, typeB]);
  const pin = useMemo(() => ({ A: pinFor(lesson, typeA), B: pinFor(lesson, typeB) }), [lesson, typeA, typeB]);
  const lineId = useMemo(() => firstLine(lesson, variant), [lesson, variant]);
  const ctx = useMemo(() => {
    const mk = (typeId: string, b: MicBody): ReadoutCtx => ({ scene, surfaces: lesson.model.surfaces, lines: lesson.model.lines, zones: lesson.zones, variant, micTypeId: typeId, body: b });
    return { A: mk(typeA, body.A), B: mk(typeB, body.B) };
  }, [scene, lesson, variant, typeA, typeB, body]);

  const write = useCallback((slot: MicSlot, p: MicPose) => {
    setMics((prev) => prev.map((m) => (m.slot === slot ? { ...m, pose: p } : m)));
  }, []);

  const moveTo = useCallback(
    (slot: MicSlot, to: MicPose) => {
      const sv = slot === 'A' ? poseA : poseB;
      const pn = pin[slot];
      const target = pn ? pinToSurface(to, pn.top, body[slot], pn.halfWidth) : to;
      const r = constrainMove(scene, body[slot], sv.value, target, bounds);
      sv.value = r.pose;
      (slot === 'A' ? blockedA : blockedB).value = r.blocked;
      write(slot, r.pose);
      setStopOf(slot, r.blocked);
      setVersion((v) => v + 1);
      return r;
    },
    [poseA, poseB, blockedA, blockedB, pin, body, scene, bounds, write, setStopOf],
  );

  const jumpTo = useCallback(
    (slot: MicSlot, to: MicPose) => {
      const sv = slot === 'A' ? poseA : poseB;
      const pn = pin[slot];
      const target = pn ? pinToSurface(to, pn.top, body[slot], pn.halfWidth) : to;
      const hit = checkAssembly(scene, target, body[slot]);
      (slot === 'A' ? blockedA : blockedB).value = hit;
      if (!hit) {
        sv.value = target;
        write(slot, target);
      }
      setStopOf(slot, hit);
      setVersion((v) => v + 1);
      return hit;
    },
    [poseA, poseB, blockedA, blockedB, pin, body, scene, write, setStopOf],
  );

  const commit = useCallback(
    (slot: MicSlot) => {
      write(slot, (slot === 'A' ? poseA : poseB).value);
      setStopOf(slot, (slot === 'A' ? blockedA : blockedB).value);
      setVersion((v) => v + 1);
    },
    [poseA, poseB, blockedA, blockedB, write, setStopOf],
  );

  /** A pose valid for a (new) type/variant: pinned, or the nearest clear
   *  pose reached from a safe spot, else unchanged with its block shown. */
  const settle = useCallback(
    (slot: MicSlot, typeId: string, sc: CompiledScene) => {
      const sv = slot === 'A' ? poseA : poseB;
      const t = micType(typeId);
      const b = micBodyOf(t);
      const pn = pinFor(lesson, typeId);
      let p = sv.value;
      if (pn) p = pinToSurface(p, pn.top, b, pn.halfWidth);
      else if (micType(micsRef.current.find((m) => m.slot === slot)?.typeId ?? typeId).mount === 'surface') {
        // Leaving the pillow: lift a stand mic to where a stand mic starts.
        const z = lesson.zones.find((q) => q.requires?.micTypeIds?.includes(typeId) && q.requires?.mount !== 'surface');
        if (z) p = z.start;
      }
      // Off this variant's picture (another drum), or a clamp that cannot
      // reach a hoop from here: start where this mic starts on this drum.
      const bd = boundsOf(lesson, sc.variant);
      const off = p.p.x < bd.min.x || p.p.x > bd.max.x || p.p.y < bd.min.y || p.p.y > bd.max.y || p.p.z < bd.min.z || p.p.z > bd.max.z;
      if (off || (t.mount === 'clip' && checkAssembly(sc, p, b)?.partId === 'clamp')) {
        const z = zonesAvailable(lesson.zones, sc.variant, typeId, t.mount)[0];
        if (z) p = pn ? pinToSurface(z.start, pn.top, b, pn.halfWidth) : z.start;
      }
      sv.value = p;
      const hit = checkAssembly(sc, p, b);
      (slot === 'A' ? blockedA : blockedB).value = hit;
      setStopOf(slot, hit);
      return p;
    },
    [poseA, poseB, blockedA, blockedB, lesson, setStopOf],
  );

  const setType = useCallback(
    (slot: MicSlot, typeId: string) => {
      const t = micType(typeId);
      const p = settle(slot, typeId, scene);
      setMics((prev) => prev.map((m) => (m.slot === slot ? { ...m, typeId, pattern: t.patterns[0].id, pose: p } : m)));
      setVersion((v) => v + 1);
    },
    [settle, scene],
  );
  const setVariant = useCallback(
    (v: VariantId) => {
      const sc = compileScene(lesson.model, v);
      const moved: Partial<Record<MicSlot, MicPose>> = {};
      for (const m of micsRef.current) moved[m.slot] = settle(m.slot, m.typeId, sc);
      setMics((prev) => prev.map((m) => (moved[m.slot] ? { ...m, pose: moved[m.slot]! } : m)));
      setVariantRaw(v);
      // A head that is not on this variant's drum gives way to its first one.
      setSurfaceId((cur) => (lesson.model.surfaces.some((s) => s.id === cur && (!s.variants || s.variants.includes(v))) ? cur : firstSurface(lesson, v)));
      setVersion((n) => n + 1);
    },
    [lesson, settle],
  );
  const setPattern = useCallback((slot: MicSlot, p: MicPattern) => setMics((prev) => prev.map((m) => (m.slot === slot ? { ...m, pattern: p } : m))), []);
  const setPolarity = useCallback((slot: MicSlot, pol: 1 | -1) => {
    setMics((prev) => prev.map((m) => (m.slot === slot ? { ...m, polarity: pol } : m)));
    setVersion((v) => v + 1);
  }, []);
  const setOn = useCallback((slot: MicSlot, on: boolean) => setMics((prev) => prev.map((m) => (m.slot === slot ? { ...m, on } : m))), []);

  // From the COMMITTED pose (React state), never `.value` during a render.
  const readouts = useCallback(
    (slot: MicSlot) => deriveReadouts(ctx[slot], (mics.find((m) => m.slot === slot) ?? mics[0]).pose, surfaceId, lineId),
    [ctx, mics, surfaceId, lineId],
  );
  const shown = useCallback((slot: MicSlot) => withStop(readouts(slot), stop[slot]), [readouts, stop]);

  return { lesson, variant, setVariant, scene, bounds, mics, pose, blocked, body, pin, ctx, surfaceId, setSurfaceId, lineId, active, setActive, moveTo, jumpTo, commit, setType, setPattern, setPolarity, setOn, readouts, stop, shown, version };
}
