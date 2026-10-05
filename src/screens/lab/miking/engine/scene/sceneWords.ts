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
export function refLabels(rig: Pick<Rig, 'lesson' | 'surfaceId' | 'lineId'>): { surfaceLabel: string; lineLabel: string; minusWords?: string; minusKey?: string } {
  const s = rig.lesson.model.surfaces.find((q) => q.id === rig.surfaceId);
  return {
    surfaceLabel: s?.label ?? 'the reference head',
    lineLabel: rig.lesson.model.lines.find((l) => l.id === rig.lineId)?.label ?? 'the reference line',
    ...(s?.minus ? { minusWords: s.minus.words, minusKey: s.minus.key } : {}),
  };
}

/** The words a slot's readouts are printed with (strip, bezel). */
export function readoutWords(rig: Rig, slot: MicSlot): ReadoutWords {
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  return { slot, ...refLabels(rig), showAim: micType(m.typeId).mount !== 'surface' };
}

export function micWords(rig: Rig, slot: MicSlot): MicDescription {
  const where = rig.lesson.model.words?.where;
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
    showAim: t.mount !== 'surface',
    ...(where ? { where } : {}),
  };
}

export function sceneDescription(rig: Rig, view: ViewId, slots: MicSlot[], extra?: string): SceneDescription {
  const variant = rig.lesson.model.variants.find((v) => v.id === rig.variant);
  const w = rig.lesson.model.words;
  const subject = w?.subject?.[rig.variant] ?? `a ${rig.lesson.model.name} with ${variant?.id === 'intact' ? 'an intact' : 'a ported'} front head`;
  const viewWords = w?.viewTag ? (view === 'side' ? 'Side view' : 'Top view') + ',' : undefined;
  return { view, subject, mics: slots.filter((s) => rig.mics.some((m) => m.slot === s && m.on)).map((s) => micWords(rig, s)), extra, ...(viewWords ? { viewWords } : {}) };
}

export function sceneLabel(rig: Rig, view: ViewId, slots: MicSlot[], extra?: string): string {
  return describeScene(sceneDescription(rig, view, slots, extra));
}

export function nowText(rig: Rig, slots: MicSlot[]): string {
  return describeNow(sceneDescription(rig, 'side', slots));
}
