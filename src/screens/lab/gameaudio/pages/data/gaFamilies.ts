/**
 * gaFamilies — page 5 ("Kinds of game sound"): the families of game sound
 * and what each is for, the mix categories the page can solo, and the small
 * rule that moves a solo from one category to another. Pure TypeScript; no
 * React Native (test/gameAudioChAFamilies).
 *
 * A FAMILY is a role (what a sound is for). A CATEGORY is a bus in this
 * lab's mix. They are not the same list: the wind and the fountain are two
 * families in one category, and the overheat alarm — a sound from an object
 * in the world — belongs to the effects, not to the ambience. The page's
 * lesson rests on that, so the test pins each family's event to the bus the
 * model really routes it to.
 *
 * `event` is the model event that plays the family on this page; the page's
 * first goal counts the fact `inst:<event>` (an instance really started).
 * Music and voice chat are named, and have their own pages later in the lab.
 */
import { GA_BUSES, type GaBus } from '../../engine/gaEngineProtocol.ts';
import type { GaEventId } from '../../model/gaDefs.ts';

export type GaFamilyId = 'bed' | 'local' | 'movement' | 'action' | 'impact' | 'dialogue' | 'interface' | 'music' | 'chat';

export type GaFamily = {
  id: GaFamilyId;
  name: string;
  /** What the family is for, in one sentence. */
  what: string;
  /** The model event that plays it on this page (null: named only). */
  event: GaEventId | null;
  /** The control in the PLAY tray that plays it. */
  key: string | null;
  /** Where it is in this scene, or where the lab comes back to it: a full
   *  sentence, shown after `what`. */
  here: string;
};

export const GA_FAMILIES: readonly GaFamily[] = [
  { id: 'bed', name: 'Ambience bed', what: 'A broad background with no single place.', event: 'bed_yard', key: 'SCENE', here: 'Here: the courtyard wind and the workshop’s room tone.' },
  { id: 'local', name: 'Local environment', what: 'A steady sound that has a place. It gets quieter as the listener moves away.', event: 'fountain', key: 'SCENE', here: 'Here: the fountain.' },
  { id: 'movement', name: 'Movement', what: 'What a body does as it moves: steps, clothing, equipment.', event: 'footstep', key: 'STEP', here: 'Here: your footsteps.' },
  { id: 'action', name: 'Actions', what: 'One thing that happens once: a door, a switch, a pickup.', event: 'door_open', key: 'OPEN DOOR', here: 'Here: the door, then its loose latch.' },
  { id: 'impact', name: 'Impacts and secondary detail', what: 'A hit, and the smaller sounds that follow it.', event: 'crate_impact', key: 'CRATE', here: 'Here: the crate, then its debris.' },
  { id: 'dialogue', name: 'Dialogue', what: 'Words from a character or a narrator.', event: 'vo_greeting', key: 'GUIDE LINE', here: 'Here: the guide’s greeting.' },
  { id: 'interface', name: 'Interface', what: 'Feedback for the player, outside the world of the scene.', event: 'ui_confirm', key: 'INTERFACE', here: 'Here: a confirm cue.' },
  { id: 'music', name: 'Music', what: 'The score. It keeps its own beat and bars.', event: null, key: null, here: 'It has its own page later in this lab.' },
  { id: 'chat', name: 'Voice chat', what: 'Other people speaking live.', event: null, key: null, here: 'It has its own page later in this lab.' },
];

/** The families this page can play, as the facts the model counts. */
export const GA_FAMILY_FACTS: readonly string[] = GA_FAMILIES.filter((f) => f.event !== null).map((f) => `inst:${f.event}`);

/** How many different families the first goal asks for. */
export const GA_FAMILIES_TO_TRY = 6;

/** How many of the page's families have really played, given a count of
 *  each fact since the page opened. */
export const gaFamiliesTried = (since: (fact: string) => number): number => GA_FAMILY_FACTS.filter((k) => since(k) > 0).length;

/* ── the categories the SOLO tray offers ────────────────────────────────── */

export type GaSoloCategory = {
  bus: GaBus;
  label: string;
  /** For the dock key: a real word of 7 letters at most. */
  short: string;
  /** What the category holds on this page (the log's own name for it is
   *  given where it differs from the label). */
  blurb: string;
};

export const GA_SOLO_CATEGORIES: readonly GaSoloCategory[] = [
  { bus: 'ambience', label: 'AMBIENCE', short: 'AMBIENT', blurb: 'The courtyard wind, the room tone and the fountain: the sounds of the place itself.' },
  { bus: 'sfx', label: 'EFFECTS', short: 'EFFECTS', blurb: 'Steps, the door, the crate, the generator and its alarm. The log writes this category as “sfx”.' },
  { bus: 'dialogue', label: 'DIALOGUE', short: 'SPEECH', blurb: 'The guide’s spoken lines.' },
  { bus: 'ui', label: 'INTERFACE', short: 'UI', blurb: 'Sounds for the player only, such as the confirm cue. The log writes this category as “ui”.' },
];

export const GA_SOLO_OFF = 'off';

/** The category soloed now (the first, if another page left several). */
export const gaSoloNow = (bus: Readonly<Record<GaBus, { solo: boolean }>>): GaBus | null => GA_BUSES.find((b) => bus[b].solo) ?? null;

/** The bus changes that leave exactly `pick` soloed (null = none). The new
 *  solo is set BEFORE the old one is cleared, so the mix never opens fully
 *  in between; a bus already as wanted is left alone (no empty log line). */
export function gaSoloPlan(bus: Readonly<Record<GaBus, { solo: boolean }>>, pick: GaBus | null): { bus: GaBus; solo: boolean }[] {
  const on = GA_BUSES.filter((b) => b === pick && !bus[b].solo).map((b) => ({ bus: b, solo: true }));
  const off = GA_BUSES.filter((b) => b !== pick && bus[b].solo).map((b) => ({ bus: b, solo: false }));
  return [...on, ...off];
}
