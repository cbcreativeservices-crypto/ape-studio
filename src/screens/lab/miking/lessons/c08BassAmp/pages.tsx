/**
 * C08 ELECTRIC BASS, FRETTED AND FRETLESS — its pages: the amplified-chain
 * journey (shared/electric/ampPages.tsx) on the speaker family's bass
 * cabinet, with the DI drawn and blended as its own electrical source.
 */
import { makeAmpPages, type AmpPagesSpec } from '../shared/electric/ampPages';
import { BASS } from '../shared/electric/electricSpec.ts';
import { C08_PLACE_START, C08_WORKED } from './model.ts';

export const C08_SPEC: AmpPagesSpec = {
  rig: 'bass',
  who: 'bass',
  intro: 'This lesson is about putting a microphone on an electric bass’s cabinet — and about the DI that so often sits beside it. First the bass and its rig: how a string becomes a signal and the signal becomes moving air, the DI’s separate path, and where the rig sits. Then the microphones, a worked example, your own placements, and the mic blended with a DI. Nothing here makes a sound: the lab is silent and shows the physics instead. (The speaker itself is covered in full in the Amplified speakers & Leslie module.)',
  shows: [
    { id: 'bass', label: 'FRETTED BASS, FACE-ON', blurb: 'A four-string electric bass with frets. The pickups turn the strings’ motion into a small signal for the head.' },
    { id: 'bassFretless', label: 'FRETLESS BASS, FACE-ON', blurb: 'The same bass with a smooth fingerboard: the player stops the string with a fingertip, so notes can slide. Position markers sit along the edge.' },
  ],
  instParts: [
    { id: 'el.strings', title: 'STRINGS', text: 'Four (or five) heavy steel strings. The open low E is about 41 Hz; a five-string’s low B about 31 Hz. Their motion over the pickups is the signal.' },
    { id: 'el.pickups', title: 'PICKUPS', text: 'Magnets wound with fine wire under the strings. Each senses its own spot: the neck pickup more of the note itself, the bridge pickup more of the upper harmonics. Some basses are active, with a battery-powered preamp — and a hotter output.' },
    { id: 'el.controls', title: 'VOLUME AND TONE', text: 'The player’s blend of pickups and tone — part of their sound. Ask, and leave them as set.' },
    { id: 'el.jack', title: 'OUTPUT JACK', text: 'The cable to the pedals, a DI box or the head starts here.' },
    { id: 'el.bridge', title: 'BRIDGE', text: 'One fixed end of the vibrating string.' },
    { id: 'el.neck', title: 'NECK', text: 'Fretted: pressing a string to a fret shortens it and raises the note. Fretless: a fingertip stops the string anywhere, so notes can slide.' },
    { id: 'el.head', title: 'HEADSTOCK AND TUNERS', text: 'Large tuners set each string’s tension, and so its pitch.' },
    { id: 'el.body', title: 'BODY', text: 'Solid wood holding the pickups, the bridge and the controls. It is not what you mic.' },
  ],
  figure: { show: 'bass', title: 'ELECTRIC BASS', badge: 'A four-string electric bass, face-on · a simplified drawing', label: 'A four-string electric bass face-on: headstock with four large tuners at the left, a long fretted neck, two pickups under the strings on the body, the bridge, the controls and the output jack.' },
  ampParts: ['amp.head', 'spk.grille', 'spk.cabinet', 'spk.baffle', 'spk.cone', 'spk.dust', 'spk.surround', 'spk.frame', 'spk.magnet', 'spk.horn', 'spk.back'],
  ampNoun: 'the bass cabinet',
  string: { spec: BASS, idx: 0, name: 'The low E string (about 41 Hz)' },
  chain: { pedals: 'pedals', rig: 'stack', diBox: true, ampDirect: true },
  workedZone: C08_WORKED,
  placeZone: C08_PLACE_START,
  micDefault: 'kickDynCard',
  pairs: ['di'],
  mic: {
    intro: 'No brand is required. Choose by what the job needs: a low-frequency response that reaches the lowest notes, the level it handles without distorting, its pattern, power and mount. A low-frequency dynamic close in and a condenser farther back are both common. Compare by ear, at matched level.',
    mountLine: () => 'Mount: a stable stand in front of one woofer, kept off the grille cloth',
  },
  practice: {
    orderNote: 'A mic-and-DI bass setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'ba.prac.gain',
    secondId: 'ba.prac.3',
    mixIds: ['ba.mix.1', 'ba.mix.2', 'ba.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a reference surface, an electrical stop, and timing versus polarity.',
    sheetNote: 'For a real rig, with the player’s agreement, levels at zero while anything is connected, and the speaker connection left as it is. Write tendencies in words.',
  },
  notes: {
    beam: 'At bass pitches a cabinet spreads its sound wide — the beam you see here belongs to the higher harmonics. A 10 in woofer beams a little later than this 12 in cone as the pitch rises; the horn takes over the very top.',
    spots: 'On a bass woofer, toward the centre tends to add bite — slap, pick, fretless articulation — and toward the edge tends to be warmer. (A 10 in woofer has the same parts as this 12 in one, a little smaller.)',
    place: 'The zones sit on ONE woofer — the lower right, ringed on page 1. Close (2.5–15 cm) for focus; 10–45 cm for room to breathe; the two overlap between 10 and 15 cm, a natural first try. The horn sits above, off this cut.',
    context: 'Live, a DI usually carries the dependable low end; the mic adds the cabinet’s character, blended underneath and checked in mono.',
  },
  liveCards: [
    { title: 'FINGERSTYLE OR PICK, CLEAN', text: 'Compare the dust cap’s edge and the outer cone for low-mid body, then move toward the centre only as far as the articulation needs. Judge it with the kick drum and the keys.' },
    { title: 'SLAP AND POP', text: 'Set the gain for the strongest pop. The centre or the horn can add attack — and clank or hiss; a DI may already carry the transient detail.' },
    { title: 'DRIVEN OR EFFECTS-HEAVY', text: 'A DI before the pedals misses the effect the cabinet mic hears; label what each path carries. The outer cone may sit more smoothly than the centre.' },
    { title: 'FRETLESS', text: 'Listen to whole phrases: slides, sustained notes, the lowest register. Ask the player what they want — fretless is not automatically darker.' },
  ],
};

export const C08_PAGES = makeAmpPages(C08_SPEC);
