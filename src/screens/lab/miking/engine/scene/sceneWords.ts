/**
 * The scene in words from the rig's COMMITTED state (blueprint §9): the
 * canvas accessibility label and the well's NOW line. Same rounding as the
 * bezel (≈ 5 mm, ≈ 5°).
 */
import type { MicSlot, ViewId } from '../model/types.ts';
import { describeNow, describeScene, type MicDescription, type SceneDescription } from '../a11y/describe.ts';
import { PATTERN_LABELS } from '../physics/polar.ts';
import { micType } from '../../data/micTypes.ts';
import type { Rig } from './useRig.ts';
import type { ReadoutWords } from './readoutText.ts';

/** The reference head and line every readout names (one place). */
export function refLabels(rig: Pick<Rig, 'lesson' | 'surfaceId' | 'lineId'>): { surfaceLabel: string; lineLabel: string } {
  return {
    surfaceLabel: rig.lesson.model.surfaces.find((s) => s.id === rig.surfaceId)?.label ?? 'the reference head',
    lineLabel: rig.lesson.model.lines.find((l) => l.id === rig.lineId)?.label ?? 'the reference line',
  };
}

/** The words a slot's readouts are printed with (strip, bezel). */
export function readoutWords(rig: Rig, slot: MicSlot): ReadoutWords {
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  return { slot, ...refLabels(rig), showAim: micType(m.typeId).mount !== 'surface' };
}

export function micWords(rig: Rig, slot: MicSlot): MicDescription {
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const t = micType(m.typeId);
  // The readouts as SHOWN (with the stop reason): the same value the bezel
  // and the live strip print (readoutText.ts).
  const r = rig.shown(slot);
  const z = r.zoneId ? rig.lesson.zones.find((q) => q.id === r.zoneId) ?? null : null;
  return {
    slot,
    typeLabel: t.label.toLowerCase(),
    patternLabel: t.patterns.find((p) => p.id === m.pattern)?.label ?? PATTERN_LABELS[m.pattern],
    readouts: r,
    ...refLabels(rig),
    zoneLabel: z ? `${z.label}, ${z.band}` : null,
    zoneKind: z ? z.kind : null,
    showAim: t.mount !== 'surface',
  };
}

export function sceneDescription(rig: Rig, view: ViewId, slots: MicSlot[], extra?: string): SceneDescription {
  const variant = rig.lesson.model.variants.find((v) => v.id === rig.variant);
  const subject = `a ${rig.lesson.model.name} with ${variant?.id === 'intact' ? 'an intact' : 'a ported'} front head`;
  return { view, subject, mics: slots.filter((s) => rig.mics.some((m) => m.slot === s && m.on)).map((s) => micWords(rig, s)), extra };
}

export function sceneLabel(rig: Rig, view: ViewId, slots: MicSlot[], extra?: string): string {
  return describeScene(sceneDescription(rig, view, slots, extra));
}

export function nowText(rig: Rig, slots: MicSlot[]): string {
  return describeNow(sceneDescription(rig, 'side', slots));
}
