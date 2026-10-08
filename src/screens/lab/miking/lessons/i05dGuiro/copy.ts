/**
 * I05d GÜIRO — the pages' words, through the family builder
 * (smallperc/copy.ts). Starting-points voice; no source, brand or model names.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';
import { spCopy } from '../shared/smallperc/copy.ts';
import { P0 } from '../shared/smallperc/geom.ts';

export const GU_COPY: LessonCopy = spCopy({
  noun: 'güiro',
  the: 'the güiro',
  p: 'gui',
  variantKey: 'BUILD',
  variantShort: { gourd: 'gourd', fiberglass: 'fiberglass' },
  subject: { gourd: 'a gourd güiro held across the player’s front, scraped with a wooden scraper', fiberglass: 'a fiberglass güiro held across the player’s front, scraped with a plastic scraper' },
  origin: { gourd: P0, fiberglass: P0 },
  refWords: 'the middle of the scraped area',
  instrument: {
    figureBadge: 'A güiro, held and scraped',
    figureLabel: 'Side view of a güiro seen end-on, its ridges on top, cradled in the player’s left hand with the fingers through the holes underneath; a scraper in the right hand rests its tip on the ridges.',
    partsBadge: 'A güiro · tap a part to name it',
    partsLooking: { side: 'Side view · the güiro end-on', top: 'From above · the ridged top' },
    partsIdle: 'A hollow, ridged body and a scraper swept along the ridges, often both ways. The whole stroke — past each end — is the space a mic must keep clear of.',
    variantNotes: {
      gourd: 'GOURD: a natural gourd with a wooden scraper — inspect it for cracks before loud strokes.',
      fiberglass: 'FIBERGLASS: a fiberglass body with a plastic scraper and more than one playing surface — the player may turn it between them.',
    },
  },
  sound: {
    subject: 'The güiro lengthwise, seen from the audience, drawn large',
    looking: { gourd: 'The güiro lengthwise, drawn large', fiberglass: 'The güiro lengthwise, drawn large' },
    cells: [
      { k: 'SCRAPER', at: ['AT ONE END', 'CROSSING', 'CROSSING', 'PAST THE END'], flex: 1 },
      { k: 'RIDGES', at: ['WAITING', 'CLICK, CLICK…', 'CLICK, CLICK…', 'PASSED'], flex: 1 },
      { k: 'SOUND', at: ['—', 'CLICKS', 'RASP + BODY', 'A RASP'], flex: 1.3 },
    ],
    reveal: 'Each ridge the scraper crosses flicks it — a tiny click; many clicks in a row are the rasp, and the hollow body resonates under them. The stroke’s length, pressure and speed shape it.',
    after: 'The güiro, the scraper and the stroke shape the sound before any mic does: a short scrape gives a short sound, a long scrape a long one.',
    shapesNotes: ['The pictures show the order of events and where the sound starts — never its level; the ridges are drawn wider apart than real.'],
    coupledSubject: 'The güiro lengthwise',
    coupledNote: 'Ask the player for the real phrase — short accents, long strokes and returns — before you move a mic: one short stroke does not show where a long one ends.',
    silentNote: 'This lab never plays a sound and draws no frequency curve: a body’s material describes an example, not a fixed microphone curve. The pictures show where the sound comes from.',
    pair: {
      title: 'Long or short scrape',
      badge: 'A simplified picture: how many ridges a stroke crosses, not how loud · ridges drawn wider apart',
      looking: 'The güiro lengthwise',
      prompt: 'Drag SWING to move the scraper, then switch SCRAPE. Watch how many ridges each stroke crosses.',
      key: 'SCRAPE',
      rest: 'the scraper at mid-stroke',
      cells: ['SCRAPE', 'RIDGES CROSSED', 'YOU HEAR'],
      together: {
        option: 'A LONG SCRAPE',
        blurb: 'The whole ridged section: many ridges, a long rasp.',
        short: 'LONG',
        title: 'A LONG SCRAPE',
        card: 'A long scrape crosses the whole ridged section — and past its end: a long sound. A mic placed from one short stroke may miss where it ends.',
        v0: 'LONG',
        v1: 'MANY',
        air: { plus: 'A LONG RASP', minus: 'A LONG RASP', rest: 'A LONG RASP' },
      },
      opposed: {
        option: 'A SHORT SCRAPE',
        blurb: 'A short section: few ridges, a short rasp.',
        short: 'SHORT',
        title: 'A SHORT SCRAPE',
        card: 'A short scrape crosses a few ridges: a short sound, an accent. Short strokes can be quieter — check they reach the mic.',
        v0: 'SHORT',
        v1: 'FEW',
        air: { plus: 'A SHORT RASP', minus: 'A SHORT RASP', rest: 'A SHORT RASP' },
      },
    },
  },
  setting: {
    kitA11y: 'A percussion station from above: the güiro player, other percussion beside them, a drum kit and an amp upstage, a vocal mic downstage.',
    kitLanding: 'Tap anything around the güiro — or step through ITEM — to see what it means for a güiro mic. There is nothing to answer yet.',
    kitIdle: 'A güiro player stands at the percussion station; cymbals and drums sound nearby, and the player may move between instruments.',
    leftHanded: 'Players hold the güiro to suit their hands — check this player, the whole stroke and the holding hand.',
    stageA11y: 'The band on a stage, from above: the percussion station, a floor monitor downstage facing back toward it, the player’s own monitor behind them, the audience and the PA.',
    studioA11y: 'The band in a studio room, from above: the percussion station, an area mic above it, the room’s walls, no monitors.',
    stageIdle: 'Two floor monitors: one downstage of the station facing back toward it, and the player’s own behind them. The PA faces the audience.',
    studioIdle: 'No monitors. A main or percussion mic may already carry the güiro — and the room is part of the sound.',
    before: [
      { title: 'MAP THE WHOLE STROKE', text: 'Have the player play the full part: the ridges used, the scraper past both ends, the return stroke and how the body moves. Stands, booms and cables stay outside all of it.' },
      { title: 'THE SCRAPER AND THE GRIP', text: 'The player’s own scraper and grip — the sound changes with them. Never suggest a harder scraper for a delicate gourd without the player’s agreement.' },
      { title: 'CHECK THE INSTRUMENT', text: 'Inspect a gourd or wooden body for cracks and the scraper for damage. A slipped scraper can hit a capsule — or a hand.' },
    ],
    planTitle: 'At the percussion station',
  },
  placement: {
    workedZone: { gourd: 'gui.body.gourd', fiberglass: 'gui.body.fiberglass' },
    workedAim: 'Face the scraped area — the starting point counts while the mic faces its middle within {tol}°. Distance, height and angle are separate things to try.',
    reveal: 'Facing more of the ridges, more rasp; a little lower and level, more of the hollow body — while still covering the whole stroke. There is no rule that one side is less harsh, so “it depends” is fair too.',
    typeNotes: { smallDynCard: 'A cardioid condenser or another suitable mic can both work; step back when the stroke travels widely.' },
    note: 'Clearance comes first: stop the player before moving a real mic — never across the scraper’s path, never inside a gourd. Watch PEAK meters for the strongest real long scrape.',
    learn: {
      intro: 'What you just did, in words. After our research, a mic roughly 30–60 cm (1–2 ft) from the middle of the scraped area is where we suggest you begin — facing more of the ridges, or a little lower for more body. A common minimum for percussion is about 30 cm. Starting points, not rules.',
      separate: 'Distance, height and angle are separate variables: change one at a time with the whole pattern. Compare the two viewpoints at matched level.',
      clearance: 'Clearance comes first: the scraper’s whole travel, past both ends, both ways, and the holding hand. Keep-clear areas appear as the mic gets close — in red, with the reason, if a move is stopped — and show roughly where to keep clear.',
      tendencies: 'Closer gives more direct rasp but can favour one small section of the stroke; farther takes in the whole path with more room and spill. All tendencies to check by ear.',
    },
  },
  context: {
    variant: 'gourd',
    zone: 'gui.body.gourd',
    shield: ['gui.body.gourd'],
    facing: 'the güiro',
    studioPrompt: 'A studio session has no wedge to reject. The decision changes: does the main or percussion mic already carry the güiro?',
    studioNote: 'Listen to the existing main or percussion mics first; a spot only when the part needs its own level and the spot hears more güiro than spill. Switch back to LIVE for the monitor exercise.',
    points: [
      { title: 'SHARED OR SPOT', text: 'In a quiet arrangement a shared percussion area mic may do; on a loud stage a directional spot near a predictable station, if it is close enough for useful direct sound.' },
      { title: 'A PREDICTABLE STATION', text: 'Give the player a station and leave the whole stroke and the holding hand clear of stands; keep the cable out of the grip and the walking path.' },
      { title: 'THE PATTERN’S NULLS', text: 'Cardioid rejects most behind; supercardioid and hypercardioid have rear lobes and side-rear nulls — place the wedge by the real pattern.' },
      { title: 'NOT ENOUGH LEVEL', text: 'Change the instrument, the station, the nearby stage level or the arrangement — never just more gain.' },
    ],
  },
  twoMic: {
    variant: 'gourd',
    A: 'gui.body.gourd',
    B: 'gui.ridges.gourd',
    learn: [
      'A common situation: a güiro spot and the main or percussion mic that hears it too. The same stroke arrives at different times.',
      'Listen together and in MONO; reposition or rebalance before adding channels. Stereo is an artistic choice for a larger image, not something the ridges require.',
    ],
  },
  facing: 'facing the scraped area',
  reference: 'scraped area',
  axis: 'the line to the scraped area',
});
