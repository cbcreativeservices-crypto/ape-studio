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
 *
 * `GA_PLAY` is the PLAY tray as model actions: the page dispatches these and
 * the test runs these, so what is proven is what the learner presses.
 */
import { GA_BUSES, type GaBus } from '../../engine/gaEngineProtocol.ts';
import { GA_BUS_NAME, type GaEventId } from '../../model/gaDefs.ts';
import type { GaAction } from '../../model/gaModel.ts';

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
  { id: 'local', name: 'Local environment', what: 'A sound that has a place in the scene. It gets quieter as the listener moves away.', event: 'fountain', key: 'SCENE', here: 'Here: the fountain, and a bird that calls now and then.' },
  { id: 'movement', name: 'Movement', what: 'What a body does as it moves: steps, clothing, equipment.', event: 'footstep', key: 'STEP', here: 'Here: your footsteps.' },
  { id: 'action', name: 'Actions', what: 'One thing that happens once: a door, a switch, a pickup.', event: 'door_open', key: 'OPEN DOOR', here: 'Here: the door, then its loose latch.' },
  { id: 'impact', name: 'Impacts and secondary detail', what: 'A hit, and the smaller sounds that follow it.', event: 'crate_impact', key: 'CRATE', here: 'Here: the crate, then its debris.' },
  { id: 'dialogue', name: 'Dialogue', what: 'Words from a character or a narrator.', event: 'vo_greeting', key: 'GUIDE LINE', here: 'Here: the guide’s greeting.' },
  { id: 'interface', name: 'Interface', what: 'Feedback for the player, outside the world of the scene.', event: 'ui_confirm', key: 'INTERFACE', here: 'Here: a confirm cue.' },
  { id: 'music', name: 'Music', what: 'The score. It keeps its own beat and bars.', event: null, key: null, here: 'It has its own page later in this lab.' },
  { id: 'chat', name: 'Voice chat', what: 'Other people speaking live.', event: null, key: null, here: 'It has its own page later in this lab.' },
];

/** THE PLAY TRAY, key by key, as the model action each one dispatches.
 *  SCENE and ALARM are switches (the page sends the opposite of what is on);
 *  the others play once per press.
 *
 *  STEP is a step IN PLACE (walk audit W1 F08): this page has no FACING key,
 *  so a walking step carried YOU through the open door to the far wall of
 *  the workshop with no way back, and the page's sentences about the alarm
 *  and the fountain stopped being true. YOU stay where the page opened. */
export const GA_PLAY: Readonly<Record<'SCENE' | 'ALARM' | 'STEP' | 'OPEN DOOR' | 'CRATE' | 'GUIDE LINE' | 'INTERFACE', GaAction>> = {
  SCENE: { type: 'scene', on: true },
  ALARM: { type: 'alarm', on: true },
  STEP: { type: 'step', who: 'player', dx: 0, dy: 0 },
  'OPEN DOOR': { type: 'door' },
  CRATE: { type: 'post', event: 'crate_impact', owner: 'crate' },
  'GUIDE LINE': { type: 'post', event: 'vo_greeting', owner: 'guide' },
  INTERFACE: { type: 'post', event: 'ui_confirm' },
};

/* ── the PLAY tray's result panel (pages/chAViews ChATrayResult) ───────── */

/** How many log lines the result panel shows. */
export const CHA_RESULT_LINES = 2;

/** The lines the result panel shows: what a press ASKED FOR and STARTED.
 *  A STOP line (a one-shot that ended by itself a moment ago) is left out:
 *  measured on page 5, the footstep's "ended (it finished)" line pushed the
 *  door's own START out of the panel right after OPEN DOOR. The full log
 *  is in the well. */
export function chaResultRows<T extends { kind: string }>(log: readonly T[], lines: number): T[] {
  return log.filter((l) => l.kind !== 'stop').slice(-lines).reverse();
}

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
  /** The category's ONE name: the chip, the SOLO readout and the log all
   *  print it (the model's GA_BUS_NAME). The dock key says only ON or OFF:
   *  it used to show a second word, AMBIENT, SPEECH, UI (learning audit
   *  L-07, walk audit W1 F18). */
  label: string;
  /** What the category holds on this page. */
  blurb: string;
};

export const GA_SOLO_CATEGORIES: readonly GaSoloCategory[] = [
  { bus: 'ambience', label: GA_BUS_NAME.ambience, blurb: 'The courtyard wind, the room tone, the fountain and the bird calls: the sounds of the place itself.' },
  { bus: 'sfx', label: GA_BUS_NAME.sfx, blurb: 'Steps, the door, the crate and the generator’s alarm.' },
  { bus: 'dialogue', label: GA_BUS_NAME.dialogue, blurb: 'The guide’s spoken lines.' },
  { bus: 'ui', label: GA_BUS_NAME.ui, blurb: 'Sounds for the player only, such as the confirm cue.' },
];

/** What the SOLO dock key shows: a state word, never a second name. */
export const gaSoloKeyWord = (solo: GaBus | null): string => (solo === null ? 'OFF' : 'ON');

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
