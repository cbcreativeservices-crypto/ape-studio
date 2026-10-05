/**
 * C02 ELECTRIC GUITAR AND GUITAR AMPLIFIERS — its pages: the amplified-chain
 * journey (shared/electric/ampPages.tsx) with this lesson's words and choices.
 * The speaker itself is taught in full in the SPK module; this lesson keeps
 * to the guitar's chain and links there.
 */
import { makeAmpPages, type AmpPagesSpec } from '../shared/electric/ampPages';
import { GUITAR } from '../shared/electric/electricSpec.ts';
import { C02_PLACE_START, C02_WORKED } from './model.ts';

export const C02_SPEC: AmpPagesSpec = {
  rig: 'combo',
  who: 'guitar',
  intro: 'This lesson is about putting a microphone on an electric guitar’s amp. First the guitar and the amp themselves: how a vibrating string becomes a signal and the signal becomes moving air, and where the amp sits. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead. (The speaker itself — cones, cabinets, how a speaker spreads its sound — is covered in full in the Amplified speakers & Leslie module.)',
  shows: [{ id: 'guitar', label: 'ELECTRIC GUITAR, FACE-ON', blurb: 'A solid-body electric guitar. On its own it is very quiet: the pickups turn the strings’ motion into a small signal for the amp.' }],
  instParts: [
    { id: 'el.strings', title: 'STRINGS', text: 'Steel strings, stretched between the nut and the bridge. Picked or plucked, they vibrate — but a solid-body guitar barely sounds in the air. Their motion is what the pickups sense.' },
    { id: 'el.pickups', title: 'PICKUPS', text: 'Magnets wound with fine wire, under the strings. A steel string moving over one makes a small electrical signal. Each pickup senses its own spot on the strings: the neck pickup rounder, the bridge pickup brighter.' },
    { id: 'el.controls', title: 'VOLUME, TONE AND SELECTOR', text: 'The player chooses the pickups and shapes the tone here. These settings are part of their sound — ask, and leave them as set while you place the mic.' },
    { id: 'el.jack', title: 'OUTPUT JACK', text: 'The instrument cable starts here, to the pedals and the amp. The signal is small: it needs the amp to drive a speaker.' },
    { id: 'el.bridge', title: 'BRIDGE', text: 'One fixed end of the vibrating string. The pickup nearest it sits where the note itself barely moves the string.' },
    { id: 'el.neck', title: 'NECK AND FRETS', text: 'Pressing a string against a fret shortens the part that vibrates — and raises the note.' },
    { id: 'el.head', title: 'HEADSTOCK AND TUNERS', text: 'The tuners set each string’s tension, and so its pitch.' },
    { id: 'el.body', title: 'BODY', text: 'Solid wood that holds the pickups, the bridge and the controls. It shapes how the strings sustain, but it is not what you mic.' },
  ],
  figure: { show: 'guitar', title: 'ELECTRIC GUITAR', badge: 'A solid-body electric guitar, face-on · a simplified drawing', label: 'A solid-body electric guitar face-on: headstock with tuners at the left, the neck with frets, three pickups under the strings on the body, the bridge, the control knobs and the output jack.' },
  ampParts: ['spk.grille', 'amp.panel', 'spk.cabinet', 'spk.baffle', 'spk.cone', 'spk.dust', 'spk.surround', 'spk.frame', 'spk.magnet', 'amp.chassis', 'spk.openBack'],
  ampNoun: 'the combo',
  string: { spec: GUITAR, idx: 0, name: 'The low E string (about 82 Hz)' },
  chain: { pedals: 'pedals', rig: 'combo', diBox: true, ampDirect: true },
  workedZone: C02_WORKED,
  placeZone: C02_PLACE_START,
  micDefault: 'instDynCard',
  pairs: ['rear', 'di'],
  mic: {
    intro: 'No brand is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, and the level it is rated for. Dynamics are common close up, especially live; a condenser — or a ribbon, where its maker allows — can be tried when its rating, mounting and power suit the amp and the room. Compare by ear on the amp in front of you.',
    mountLine: (m) => (m.address === 'side' ? 'Mount: a stand in front of the speaker, its marked front side facing the cone' : 'Mount: a stable stand in front of the speaker, kept off the grille cloth'),
  },
  practice: {
    orderNote: 'A one-mic guitar-amp setup, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'eg.prac.gain',
    secondId: 'eg.prac.3',
    mixIds: ['eg.mix.1', 'eg.mix.2', 'eg.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: a reference surface, an electrical stop, and polarity versus delay.',
    sheetNote: 'For a real amp, with the player’s agreement and the amp off or muted while anything moves. Write tendencies in words — what you heard, not a promised result.',
  },
  notes: {
    beam: 'Most guitar amps use 10 in or 12 in speakers: a 12 in cone, as drawn here, beams a little sooner than a 10 in as the pitch rises. Off the axis, the highs fall away first.',
    spots: 'On a guitar amp, the dust cap’s edge is a common first aim. Toward the centre tends to add brightness and pick attack — and fizz on a driven tone; toward the edge tends to be smoother and darker. Speakers vary: check by ear.',
    place: 'This combo’s speaker sits off-centre under the controls — the zones sit on the speaker, not on the middle of the grille. The open back’s zone (behind the amp) starts outside the clear air space the amp needs behind it.',
    context: 'A close mic on a stable stand gives isolation and repeatability on stage; the PA then adds what the stage sound lacks, rather than doubling it.',
  },
  liveCards: [
    { title: 'CLEAN AND EDGE-OF-BREAKUP', text: 'Check quiet notes, the pick’s attack and the player’s dynamics. If the centre sounds brittle, slide outward; if the guitar disappears in the band, try the dust cap’s edge before reaching for EQ.' },
    { title: 'HIGH-GAIN DISTORTION', text: 'The amp is already compressed and rich in upper harmonics. Compare the cap’s edge and off-centre spots for articulation without fizz — and judge it with the bass, drums and other guitar playing.' },
    { title: 'LOW STAGE VOLUME, OR AN ISOLATED AMP', text: 'A small amp at a workable level can still give a useful miked sound. If the amp is moved off stage, make sure the player hears a good monitor mix and the amp still has its ventilation.' },
    { title: 'STUDIO', text: 'A close mic gives isolation; a farther mic or a front-and-rear pair on an open back can add size when the room helps. Record the close mic alone first, then blend, and check in mono.' },
  ],
};

export const C02_PAGES = makeAmpPages(C02_SPEC);
