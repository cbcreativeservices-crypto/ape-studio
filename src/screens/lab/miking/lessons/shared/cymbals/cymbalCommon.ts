/**
 * THE CYMBAL LESSONS' SHARED DATA — the stage's two monitors (the same
 * positions every Lab 1 kit lesson uses: LESSON_JOURNEY §6 stage 3), the
 * setting's stage / studio items, the practice sheet, and the one
 * "about these starting points" note. Pure data; starting-points voice.
 */
import type { Lesson, SettingItem, Wedge } from '../../../engine/model/types.ts';
import { KICK_GEOM } from '../../m01Kick/geometry.ts';
import { KIT_FLOOR_Y } from '../kitPlanModel.ts';

const stage = (reason: string) => ({ kind: 'illustrative', reason }) as const;

/** The drummer's fill beside the throne and a downstage wedge (M01's places). */
export function stageWedges(fillNote: string, downNote: string): Wedge[] {
  return [
    { id: 'fill', label: 'the drummer’s own fill, on the floor beside the throne', short: 'DRUM FILL', p: { x: -450, y: KIT_FLOOR_Y, z: 750 }, lift: 150, faces: { x: -0.2, y: 0, z: -1 }, note: fillNote, prov: stage('a typical stage layout (the kick lesson’s same monitor); no source gives the position') },
    { id: 'downstage', label: 'a floor wedge for another player, downstage of the drums, facing upstage', short: 'DOWNSTAGE', p: { x: KICK_GEOM.L + 900, y: KIT_FLOOR_Y, z: -450 }, lift: 150, faces: { x: -1, y: 0, z: 0 }, note: downNote, prov: stage('a typical stage layout (the kick lesson’s same monitor); no source gives the position') },
  ];
}

/** The setting's stage and studio items (the plan's monitors, audience, room). */
export function stageItems(name: string): SettingItem[] {
  return [
    { id: 'fill', label: 'the drummer’s fill (monitor)', short: 'DRUM FILL', note: 'A floor monitor beside the throne so the drummer can hear the band — loud, and low on the floor.', prov: stage('a typical stage layout'), tag: 'MONITOR', scene: 'stage' },
    { id: 'downstage', label: 'a downstage wedge (another player’s monitor)', short: 'WEDGE', note: 'Out on the audience side, facing back toward the stage.', prov: stage('a typical stage layout'), tag: 'MONITOR', scene: 'stage' },
    { id: 'audience', label: 'audience and the PA', short: 'AUDIENCE · PA', note: `Live, the audience already hears the acoustic ${name}; the PA adds what the room needs.`, prov: stage('direction only'), tag: 'FRONT SIDE', scene: 'stage' },
    { id: 'room', label: 'the room', short: 'THE ROOM', note: `In a studio there are no wedges on the floor, and the overheads and the room often carry the ${name}.`, prov: stage('a generic room'), tag: 'ROOM SOUND', scene: 'studio' },
  ];
}

export const THRONE_ITEM = (note: string): SettingItem => ({ id: 'throne', label: 'drum throne (the player’s seat)', short: 'THRONE', note, prov: stage('the shared 5-piece kit'), tag: 'KEEP CLEAR', scene: 'all' });

export function stageWords(name: string): Pick<Lesson['setting'], 'stage' | 'studio'> {
  return {
    stage: `LIVE: monitors feed the players, the PA faces the audience, and every open mic hears the whole loud kit. Spill and the gain available before feedback push toward close, aimed pickup — with as few open mics as the music needs.`,
    studio: `STUDIO: no wedges on the floor, repeated trials are practical when the drummer stops, and the overheads may already carry the ${name}.`,
  };
}

export function accuracyDetail(what: string): string {
  return `ABOUT THESE STARTING POINTS. After our research, here is where we suggest you begin — ideas and concepts to consider, not rules. Every cymbal, player and room is different: move the mic, experiment, and trust your ears and the room. The lab is silent and draws a simplified picture: a typical 5-piece kit, ${what}, the swing and the stick’s path as drawn keep-outs, mic patterns as textbook shapes, and motion drawn larger so you can see it. Distances are rounded to about 5 mm and measured to the mic’s front. Place real mics with the drummer stopped.`;
}

export function practiceSheet(name: string, plans: readonly string[], aimWords: string): Lesson['practice']['fields'] {
  return [
    { id: 'cym', label: `${name[0].toUpperCase()}${name.slice(1)} (size, weight, how it is mounted)`, kind: 'text' },
    { id: 'plan', label: 'Plan', kind: 'choice', choices: [...plans] },
    { id: 'mic', label: 'Mic type', kind: 'choice', choices: ['small condenser', 'small dynamic', 'clip-on condenser', 'other'] },
    { id: 'zone', label: 'Starting position you tried', kind: 'text' },
    { id: 'distance', label: 'Distance, from which face of the cymbal', kind: 'text' },
    { id: 'aim', label: aimWords, kind: 'text' },
    { id: 'notes', label: 'What you heard (tendencies, in words)', kind: 'text' },
  ];
}

/** The unknowns every cymbal lesson shares (the lesson adds its own). */
export const COMMON_UNKNOWNS: Lesson['unknowns'] = [
  { text: 'Every kit position and height is a drawing default of the shared kit — so no HEIGHT-above-floor readout is shown.', dims: ['yFloor'] },
  { text: 'The cymbals’ swing (± 60 mm at the edge) and the hi-hats’ opening travel, drawn as keep-outs — values for the owner to approve.', dims: ['cym'] },
  { text: 'The cymbal profiles (8 % rise, 32 % bell), felts, sleeves, wing nuts, tilters, stands and booms — the shared cymbal family’s drawing defaults.', dims: [] },
  { text: 'The stick’s side of each cymbal (± 80° about the throne, a stick’s 406.4 mm up) — drawn illustratively.', dims: [] },
  { text: 'Where each mic’s distances are measured from, and its acoustic centre — the lab measures to the mic’s front, square to the cymbal’s edge plane, rounded to ≈ 5 mm.', dims: [] },
];
