/**
 * gaHudTypes — the contract for the Game Audio lab's INSTRUMENT STRIP (the
 * "HUD"): a band under the scene, inside the pinned display, that shows the
 * one thing a page teaches and the scene cannot draw: bus meters, voice
 * slots, the music's bars and beats, a packet on its way. Owner 2026-11-12:
 * "make sure all screens show and user adjust appropriate animations".
 *
 * THE TRUTH RULE. A HUD is drawn FROM THE MODEL'S STATE and the model's own
 * clock (`state.t`, each voice's `born`, `music.t0`), never on a decorative
 * timer. What moves is what the model has playing; with sound off it still
 * moves, because the scene simulates (the bezel says SOUND OFF). Levels are
 * the model's COMPUTED levels (after distance, wall, bus, mute/solo, duck and
 * the lab LEVEL) in the house loudness colors (features/tools/levelColor).
 *
 * A HUD is READ-ONLY: no control lives on the glass. The learner changes it
 * with the page's dock keys. It respects `useDecorativeMotion()`: with motion
 * reduced the same information is shown still, never lost.
 *
 * One component per id. It fills the box it is given (`w` by `h` points; `h`
 * is GA_HUD_H on a phone, and in FULL SCREEN it grows with the scene: about
 * 49 at 1x, 93 at FIT, 99 at 2x on a 390-wide phone) and keeps every word at
 * 9 pt or more. `arg` is a page's own choice (which output, which topic).
 *
 * Types only.
 */
import type { JSX } from 'react';
import type { GaState } from '../../model/gaModel';

export type GaHudId =
  | 'level' // page 1: the three sounds SCENE starts, and the lab LEVEL over them
  | 'cats' // page 5: the kinds of game sound, lit while one of that kind plays
  | 'chain' // page 6: file -> event -> instance -> voice, link by link
  | 'sync' // page 8: the four kinds of game information, as they are sent
  | 'takes' // page 9: the last takes: which one, its pitch and level change
  | 'beds' // page 10: the two beds cross-fading, the loop and its join
  | 'output' // pages 3 and 13: what reaches each ear or loudspeaker
  | 'wall' // page 12: the wall's filter curve, the level change, the reverb send
  | 'music' // pages 14 and 22: bars, beats, the play line, layers, a waiting change
  | 'lines' // page 15: the line that speaks, its length, its priority, its language
  | 'mix' // pages 16 and 22: one meter per bus, its fader, mute, solo, the duck
  | 'voices' // page 17: one slot per voice of the budget; stolen, refused, virtual
  | 'net'; // page 18: an action on its way to each player, and a duplicate dropped

export type GaHudProps = { w: number; h: number; state: GaState; arg?: string };
export type GaHudMap = Partial<Record<GaHudId, (p: GaHudProps) => JSX.Element | null>>;

/** The strip's height on a phone, in points. */
export const GA_HUD_H = 48;
/** NOT USED BY THE RACK ANY MORE (kept for old imports): in FULL SCREEN the
 *  strip is as tall as the scene's width times 48/360 (GaLab's glass), so a
 *  strip must draw itself to whatever `h` it is handed. */
export const GA_HUD_H_FULL = 72;
