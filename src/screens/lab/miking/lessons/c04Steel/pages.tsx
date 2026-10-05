/**
 * C04 PEDAL STEEL AND LAP STEEL — its pages: the amplified-chain journey
 * (shared/electric/ampPages.tsx) with the steel's own instrument drawings
 * (shared/electric/SteelArt.tsx), its bar-and-pedal string display, and the
 * player's pedal-and-knee-lever keep-clear zone on the stage plan.
 */
import { makeAmpPages, type AmpPagesSpec } from '../shared/electric/ampPages';
import { PEDAL_STEEL } from '../shared/electric/electricSpec.ts';
import { C04_PLACE_START, C04_WORKED } from './model.ts';

const TOP = ['steelTop'] as const;
const SIDE = ['steelSide'] as const;

export const C04_SPEC: AmpPagesSpec = {
  rig: 'combo',
  who: 'steel',
  intro: 'This lesson is about putting a microphone on the amp of a pedal steel or a lap steel. First the instruments: the bar, the pedals and knee levers, the pickup, and how a string’s pitch and signal are made; then the amp, and where the player sits — with their feet and knees busy. Then the microphones, a worked example and your own placements on the amp. Nothing here makes a sound: the lab is silent and shows the physics instead. (The speaker itself is covered in full in the Amplified speakers & Leslie module.)',
  shows: [
    { id: 'steelSide', label: 'PEDAL STEEL, FROM THE SEAT', blurb: 'The pedal steel on its legs, seen from the player’s seat (the player left out): the changer, the keyhead, the knee levers, the pedal rods and pedals, and the volume pedal.' },
    { id: 'steelTop', label: 'PEDAL STEEL, FROM ABOVE', blurb: 'From above: the strings from the keyhead to the changer, the fret markers, the pickup near the changer, the bar on the strings — and the player’s seat and keep-clear zone.' },
    { id: 'lap', label: 'LAP STEEL, FROM ABOVE', blurb: 'A lap steel across the player’s knees, played with a bar; usually no pedals or knee levers. Through an amp, the same miking applies.' },
  ],
  instParts: [
    { id: 'ps.neck', title: 'NECK AND STRINGS', text: 'Ten strings over a flat fretboard with painted fret markers — no frets to press. Some pedal steels have two necks with different tunings.', shows: [...TOP, ...SIDE] },
    { id: 'ps.bar', title: 'THE BAR', text: 'A heavy steel bar the left hand rests on the strings: a movable fret. Only the string between the bar and the changer sounds; sliding the bar glides the pitch.', shows: TOP },
    { id: 'ps.pickup', title: 'PICKUP', text: 'A magnetic pickup near the changer, under the strings: it turns their motion into a small signal for the volume pedal and the amp.', shows: TOP },
    { id: 'ps.changer', title: 'CHANGER', text: 'At the bridge end: fingers that tighten or slacken chosen strings when a pedal or knee lever moves — raising or lowering their pitch.', shows: [...TOP, ...SIDE] },
    { id: 'ps.keyhead', title: 'KEYHEAD', text: 'The tuning keys at the far end, one per string.', shows: [...TOP, ...SIDE] },
    { id: 'ps.pedals', title: 'PEDALS AND PEDAL RODS', text: 'Floor pedals pressed with the left foot; rods carry each pedal’s movement up to the changer. The player’s feet work here continuously — keep clear.', shows: [...TOP, ...SIDE] },
    { id: 'ps.knee', title: 'KNEE LEVERS', text: 'Levers under the body, pushed sideways with the knees, each changing chosen strings’ pitch. Nothing may block the player’s knees.', shows: SIDE },
    { id: 'ps.volume', title: 'VOLUME PEDAL', text: 'Pressed with the right foot to swell the sound — part of how the steel is played. Its range sets the loudest moments you must leave headroom for.', shows: SIDE },
    { id: 'ps.legs', title: 'LEGS', text: 'Four adjustable legs hold the steel at the player’s height, over the pedals.', shows: SIDE },
    { id: 'ls.body', title: 'LAP STEEL', text: 'A simpler steel played across the knees with a bar; usually no pedals or knee levers. An electric one is miked at its amp, like the pedal steel. (A resonator played in the lap has its own lesson.)', shows: ['lap'] },
  ],
  figure: { show: 'steelSide', title: 'PEDAL STEEL', badge: 'A pedal steel on its legs, from the player’s seat · a simplified drawing', label: 'A pedal steel guitar on four legs, seen from the player’s seat: the long body with the changer at the right and the keyhead at the left, four knee levers hanging under the body, pedal rods down to three floor pedals, and a volume pedal on the floor.' },
  ampParts: ['spk.grille', 'amp.panel', 'spk.cabinet', 'spk.baffle', 'spk.cone', 'spk.dust', 'spk.surround', 'spk.frame', 'spk.magnet', 'amp.chassis', 'spk.openBack'],
  ampNoun: 'the steel’s amp',
  string: { spec: PEDAL_STEEL, idx: 5, name: 'One steel string (B, about 247 Hz)', steel: true },
  chain: { pedals: 'volume', rig: 'combo', diBox: true, ampDirect: true },
  workedZone: C04_WORKED,
  placeZone: C04_PLACE_START,
  micDefault: 'instDynCard',
  pairs: ['rear', 'di'],
  mic: {
    intro: 'No brand is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, its level rating and pad. A dynamic close up is robust on a stage; a condenser can be tried where its rating, mounting and spill suit. Compare by ear on the amp in front of you.',
    mountLine: () => 'Mount: a low, stable stand in front of the speaker, clear of the player’s pedals',
  },
  practice: {
    orderNote: 'A one-mic setup for a steel player’s amp, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'ps.prac.gain',
    secondId: 'ps.prac.3',
    mixIds: ['ps.mix.1', 'ps.mix.2', 'ps.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a reference surface, an electrical stop, and timing versus polarity.',
    sheetNote: 'For a real rig, with the player’s agreement and the amp off or muted while anything moves — and the pedal zone clear throughout. Write tendencies in words.',
  },
  notes: {
    beam: 'A steel’s long, high sustains sit where a 12 in cone beams: off the axis, the highs fall away first. Keep the mic on the speaker’s axis for clarity, or move off it to soften.',
    spots: 'On a steel amp, the dust cap’s edge is a common first aim. Toward the centre tends to brighten bar attacks and high notes — sometimes too sharp; toward the edge, smoother. Check by ear.',
    place: 'These are general amp starting points, tested on a steel’s amp — not steel-specific coordinates. The open back’s zone starts outside the clear air space the amp needs behind it.',
    context: 'Keep the stand low and stable at the amp, out of the pedal, knee-lever and volume-pedal zone, and make sure a tilted amp cannot tip.',
  },
  liveCards: [
    { title: 'CLEAR, ARTICULATE CLEAN STEEL', text: 'Start at the cap’s edge and listen for harmonics and pitch movement in the band. If it is too hard, slide outward before broad EQ.' },
    { title: 'ROUNDER, LESS POINTED STEEL', text: 'Compare the outer cone and a modestly farther view — and check the steel stays distinct beside keys and guitar.' },
    { title: 'DRIVEN LAP STEEL', text: 'Through pedals or an overdriven amp: judge picked attacks and long slides. The centre can stress upper harmonics and noise; off-centre may balance better.' },
    { title: 'STUDIO', text: 'One good close mic first. A second mic, a room mic or a direct path only for a stated goal, each heard alone and together in mono.' },
  ],
};

export const C04_PAGES = makeAmpPages(C04_SPEC);
