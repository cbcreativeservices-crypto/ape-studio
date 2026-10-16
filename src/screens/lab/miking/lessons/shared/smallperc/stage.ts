/**
 * SMALL-PERCUSSION FAMILY — the stage and the studio round a standing
 * percussionist (THE SETTING and STUDIO OR LIVE): the two floor monitors the
 * monitor exercise uses, their plan things, and the stage / studio items —
 * one set, so every lesson's stage reads the same. Positions are ILLUSTRATIVE
 * (no source gives them); the words take the instrument's name.
 */
import type { SettingItem, Wedge } from '../../../engine/model/types.ts';
import type { PlanThing } from './family.ts';
import type { PlanCueSpec } from '../handdrums/handPlanModel.ts';

const ILL = (reason: string) => ({ kind: 'illustrative' as const, reason });

export function standingWedges(the: string): Wedge[] {
  return [
    {
      id: 'downstage',
      label: 'a floor wedge downstage of the player, facing back toward them',
      short: 'DOWNSTAGE',
      p: { x: 1400, y: 0, z: -600 },
      lift: 150,
      faces: { x: -1, y: 0, z: 0.3 },
      note: 'It sits on the audience side, behind the mic and off to one side — the case a pattern’s null can help with.',
      prov: ILL('a typical stage layout; no source gives the position'),
    },
    {
      id: 'fill',
      label: 'the player’s own wedge, downstage, angled up at them',
      short: 'OWN MON.',
      // downstage in front of the player, angled up at them (the usual wedge
      // spot — owner 2026-10-16; it stood behind them, facing their back)
      p: { x: 1300, y: 0, z: 520 },
      lift: 150,
      faces: { x: -0.93, y: 0, z: -0.37 },
      note: `In front of the player, angled up at them — the usual wedge spot: behind a mic facing ${the}, near a cardioid’s rear null. Behind the player it would sit in FRONT of that mic, where no pattern null reaches it.`,
      prov: ILL('a typical stage layout; no source gives the position'),
    },
  ];
}

/** The stage and studio things on the plan (the station things are each lesson's own). */
export const STAGE_THINGS: PlanThing[] = [
  { id: 'downstage', kind: 'wedge', u: 1400, v: -600, face: Math.PI - 0.3, scene: 'stage' },
  { id: 'fill', kind: 'wedge', u: 1300, v: 520, face: Math.PI + 0.38, scene: 'stage' },
  { id: 'audience', kind: 'audience', u: 2150, v: 0, scene: 'stage' },
  { id: 'area', kind: 'micstand', u: 650, v: 650, scene: 'studio' },
  { id: 'room', kind: 'room', u: 0, v: 0, scene: 'studio' },
];

/**
 * The studio's headphone mix for the usual station (the player at the
 * station, the drum kit up and to the left, a singer up and to the right):
 * each performer's personal mixer at their side, fed from the CONTROL ROOM
 * on the room's right-hand wall (collision pass 2026-10-15). `main` = the
 * lesson's own instrument thing (its player is drawn by the lesson's art).
 */
export function stationCue(main: string): PlanCueSpec {
  return {
    wall: 'u1',
    hubAt: 300,
    stations: [
      { of: main, at: { u: -400, v: -680 } },
      { of: 'kit', at: { u: -2265, v: -1000 }, via: [{ u: -2265, v: -420 }] },
      { of: 'vocal', at: { u: 650, v: -1800 } },
    ],
  };
}

export function stageItems(the: string, areaNote: string): SettingItem[] {
  return [
    { id: 'downstage', label: 'a floor wedge downstage of the player', short: 'WEDGE', note: `On the audience side, behind a mic facing ${the} and off to one side — a case a pattern’s null can help with.`, prov: ILL('a typical stage layout; no source gives the position'), tag: 'MONITOR', scene: 'stage' },
    { id: 'fill', label: 'the player’s own monitor', short: 'OWN MON.', note: `In front of the player, angled up at them — the usual wedge spot, behind a mic facing ${the} and near a cardioid’s rear null. Behind the player it would face the mic’s front, where no pattern rejects it.`, prov: ILL('a typical stage layout; no source gives the position'), tag: 'MONITOR', scene: 'stage' },
    { id: 'audience', label: 'the audience and the PA', short: 'AUDIENCE · PA', note: 'The PA faces the audience; every extra open mic hears it — one reason to keep the mic count down.', prov: ILL('a typical stage layout'), tag: 'FEEDBACK PATH', scene: 'stage' },
    { id: 'area', label: 'an area or overhead mic', short: 'AREA MIC', note: areaNote, prov: ILL('a typical recording layout'), tag: 'MAIN PICKUP', scene: 'studio' },
    { id: 'room', label: 'the room', short: 'THE ROOM', note: 'In a quiet, pleasant room a mic a little farther back adds air and smooths the motion; fans and reflections come in with it.', prov: ILL('a generic studio room'), tag: 'ROOM SOUND', scene: 'studio' },
  ];
}
