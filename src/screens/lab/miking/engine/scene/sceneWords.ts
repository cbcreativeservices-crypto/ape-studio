/**
 * The scene in words from the rig's COMMITTED state (blueprint §9): the
 * canvas accessibility label and the well's NOW line. Same rounding as the
 * bezel (≈ 5 mm, ≈ 5°).
 */
import type { MicSlot, ViewId } from '../model/types.ts';
import { copyOf } from '../model/copy.ts';
import { describeNow, describeScene, type MicDescription, type SceneDescription } from '../a11y/describe.ts';
import { PATTERN_LABELS } from '../physics/polar.ts';
import { micType } from '../../data/micTypes.ts';
import type { Rig } from './useRig.ts';
import type { ReadoutWords } from './readoutText.ts';

type RefWords = Pick<ReadoutWords, 'surfaceLabel' | 'lineLabel' | 'minusWords' | 'minusKey' | 'plusWords' | 'plusKey' | 'lineWords'>;

/** The reference head and line every readout names (one place). */
export function refLabels(rig: Pick<Rig, 'lesson' | 'surfaceId' | 'lineId'> & { refOf?: Rig['refOf'] }, slot?: MicSlot): RefWords {
  const ref = slot && rig.refOf ? rig.refOf(slot) : { surfaceId: rig.surfaceId, lineId: rig.lineId };
  const s = rig.lesson.model.surfaces.find((q) => q.id === ref.surfaceId);
  const l = rig.lesson.model.lines.find((q) => q.id === ref.lineId);
  return {
    surfaceLabel: s?.label ?? 'the reference head',
    lineLabel: l?.label ?? 'the reference line',
    ...(s?.minus ? { minusWords: s.minus.words, minusKey: s.minus.key } : {}),
    ...(s?.plus ? { plusWords: s.plus.words, plusKey: s.plus.key } : {}),
    ...(l?.words ? { lineWords: l.words } : {}),
  };
}

/** The words a slot's readouts are printed with (strip, bezel). */
export function readoutWords(rig: Rig, slot: MicSlot): ReadoutWords {
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  return { slot, ...refLabels(rig, slot), showAim: micType(m.typeId).mount !== 'surface' };
}

export function micWords(rig: Rig, slot: MicSlot): MicDescription {
  const where = copyOf(rig.lesson).where;
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const t = micType(m.typeId);
  // The readouts as SHOWN (with the stop reason): the same value the bezel
  // and the live strip print (readoutText.ts).
  const r = rig.shown(slot);
  const W = copyOf(rig.lesson).words;
  const z = r.zoneId ? rig.lesson.zones.find((q) => q.id === r.zoneId) ?? null : null;
  return {
    slot,
    typeLabel: t.label.toLowerCase(),
    patternLabel: t.patterns.find((p) => p.id === m.pattern)?.label ?? PATTERN_LABELS[m.pattern],
    readouts: r,
    ...refLabels(rig, slot),
    zoneLabel: z ? `${z.label}, ${z.band}` : null,
    showAim: t.mount !== 'surface',
    where: where ?? { inside: W.inside, outside: W.outside },
    axisWords: W.axis,
  };
}

/** The instrument in words for this variant (the lesson's copy). */
export function sceneSubject(rig: Pick<Rig, 'lesson' | 'variant'>): string {
  return copyOf(rig.lesson).sceneSubject[rig.variant] ?? `a ${rig.lesson.model.name}`;
}

export function sceneDescription(rig: Rig, view: ViewId, slots: MicSlot[], extra?: string): SceneDescription {
  const c = copyOf(rig.lesson);
  const W = c.words;
  // A lesson's own per-view words (the hand drums) win over its family's.
  const viewWords = { side: c.viewWords?.side ?? W.viewSide, top: c.viewWords?.top ?? W.viewTop };
  return { view, subject: sceneSubject(rig), viewWords, mics: slots.filter((s) => rig.mics.some((m) => m.slot === s && m.on)).map((s) => micWords(rig, s)), extra };
}

export function sceneLabel(rig: Rig, view: ViewId, slots: MicSlot[], extra?: string): string {
  return describeScene(sceneDescription(rig, view, slots, extra));
}

export function nowText(rig: Rig, slots: MicSlot[]): string {
  return describeNow(sceneDescription(rig, 'side', slots));
}
