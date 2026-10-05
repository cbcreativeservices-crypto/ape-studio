/**
 * FREE-REED PAGES — the Kick journey (LESSON_JOURNEY.md) for Lab 3's
 * harmonica (A10) and accordion (A11): meet → how it sounds → where it sits
 * → microphones → placement (worked example first) → studio or live → two
 * mics → troubleshoot → practice.
 *
 * Reused, never copied:
 *   • the hand-drum factory (shared/hand/handPages) carries the setting,
 *     microphone, placement, context, two-mic and practice pages, with the
 *     lesson's own words (HandSpec.words) where it would say "drum";
 *   • the suspended-metal family's MEET page (a drawing of the instrument,
 *     its parts named by tap, the variant chosen in the dock) and its
 *     variant chips;
 *   • HOW IT SOUNDS is the free reed's own (ReedSound.tsx).
 * A lesson's variants can be two source PATHS (the harmonica's stand mic or
 * amp speaker) or the instrument's state (the accordion's bellows): each
 * variant may bring its own placement words and zones (`handByVariant`), and
 * a page may be PINNED to one variant (`pin`) where only that one makes
 * sense (the harmonica's live-monitor exercise is at the stand mic).
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing loops.
 */
import type { ReactNode } from 'react';
import type { PageId, VariantId } from '../../../engine/model/types.ts';
import type { PageProps } from '../../../pages/pageTypes';
import { makeHandPages, type HandSpec } from '../hand/handPages';
import { MetalInstrument, VariantContext, type MeetSpec, type VariantCtx } from '../metal/metalPages';
import { makeReedSound, type ReedSoundSpec } from './ReedSound';

export type FreeReedSpec = {
  meet: MeetSpec;
  sound: ReedSoundSpec;
  hand: HandSpec;
  handByVariant?: Partial<Record<VariantId, HandSpec>>;
  /** Pages shown in ONE variant whatever the learner last chose. */
  pin?: Partial<Record<PageId, VariantId>>;
};

type PageFn = (p: PageProps) => ReactNode;

export function makeFreeReedPages(spec: FreeReedSpec): Record<PageId, PageFn> {
  const sound = makeReedSound(spec.sound);
  const base = makeHandPages(spec.hand, sound);
  const byV: Record<string, Record<PageId, PageFn>> = {};
  for (const [v, h] of Object.entries(spec.handByVariant ?? {})) if (h) byV[v] = makeHandPages(h, sound);
  const pick = (id: PageId): PageFn =>
    function FreeReedVariantPage(p: PageProps) {
      const v = spec.pin?.[id] ?? p.variant;
      const P = (byV[v] ?? base)[id];
      const ctx: VariantCtx = { variant: v, setVariant: p.setVariant, options: spec.pin?.[id] ? [] : p.lesson.model.variants.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })), key: spec.meet.variantKey };
      return (
        <VariantContext.Provider value={ctx}>
          <P key={v} {...p} variant={v} />
        </VariantContext.Provider>
      );
    };
  return {
    ...base,
    instrument: MetalInstrument(spec.meet),
    sound,
    placement: pick('placement'),
    context: pick('context'),
    twoMic: pick('twoMic'),
  };
}
