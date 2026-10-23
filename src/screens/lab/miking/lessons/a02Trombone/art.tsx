/**
 * A02 TROMBONE AND BASS TROMBONE — the look (charter §2 layer 3), drawn
 * only from the shared brass family: the horn and its standing player, the
 * slide at 1st position, projected from the same poses the collisions and
 * the zones use. Its own HOW IT SOUNDS (the slide's seven positions as an
 * envelope) and WHERE IT SITS pages, and ORIENT's portrait of both horns.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { partIn } from '../shared/bowed/bowedModel.ts';
import { brassHitTest, brassLabels, makeBrassInstrument, makeBrassPortrait } from '../shared/brass/BrassArt';
import { makeBrassSoundPage } from '../shared/brass/BrassSoundPage';
import { makeBrassSettingPage } from '../shared/brass/BrassSettingPage';
import { A02_PLAN } from './plan.ts';
import { A02_MODEL, BT, TB } from './geometry.ts';

const POSES = { tenor: TB, bass: BT };
const pose = (v: string) => (v === 'bass' ? BT : TB);

const SLIDE_LABELS = [
  { id: 'bell', text: 'BELL', at: (P: typeof TB) => P.H({ x: -60, y: -P.spec.bell.mm / 2 + 6, z: 0 }), du: 20, dv: -100 },
  { id: 'slide', text: 'SLIDE', at: (P: typeof TB) => ({ x: P.slide!.crook.x - 220, y: P.slide!.legs[1], z: P.slide!.z }), du: 0, dv: 110 },
  { id: 'crook', text: 'CROOK', at: (P: typeof TB) => P.slide!.crook, du: 40, dv: 100 },
  { id: 'mp', text: 'MOUTHPIECE', short: 'MOUTHPC', at: (P: typeof TB) => P.mouthpiece.cup, du: -20, dv: 120, align: 'left' as const },
  { id: 'tune', text: 'TUNING SLIDE', short: 'TUNING', at: (P: typeof TB) => P.tubes.find((t) => t.id === 'tuning')!.pts[6], du: -20, dv: -100 },
];

export const A02_ART: LessonArt = {
  Instrument: makeBrassInstrument(POSES, 'tenor'),
  labels: (view, variant) => brassLabels(pose(variant), view),
  hitTest: (view, variant, u, v, tol) => {
    const id = brassHitTest(pose(variant), view, u, v, tol);
    return id ? partIn(A02_MODEL, id, variant) : null;
  },
  labelsYieldToMic: true,
  figure: makeBrassPortrait(
    [
      { P: TB, title: 'TENOR TROMBONE', labels: SLIDE_LABELS },
      {
        P: BT,
        title: 'BASS TROMBONE',
        labels: [
          { id: 'bell', text: 'LARGER BELL', short: 'BELL', at: (P) => P.H({ x: -60, y: -P.spec.bell.mm / 2 + 6, z: 0 }), du: 20, dv: -100 },
          { id: 'valves', text: 'TWO VALVES · F AND G♭', short: 'VALVES', at: (P) => P.rotors[0].c, du: -40, dv: -120 },
          { id: 'loops', text: 'EXTRA TUBING', short: 'LOOPS', at: (P) => P.tubes.find((t) => t.id === 'loopF')!.pts[16], du: -30, dv: 110 },
          { id: 'slide', text: 'SLIDE', at: (P) => ({ x: P.slide!.crook.x - 220, y: P.slide!.legs[1], z: P.slide!.z }), du: 40, dv: 110 },
        ],
      },
    ],
    'A tenor trombone above and a bass trombone below, each seen from the front and to the side so the bell’s opening shows: the bell, the long slide with its crook, the mouthpiece, the tuning slide. The bass trombone’s bell is larger, and two rotary valves in its bell section bring in extra loops of tubing.',
  ),
  pages: {
    sound: makeBrassSoundPage({
      poses: POSES,
      fallback: 'tenor',
      bands: {
        tenor: {
          low: 'Low down a trombone spreads its sound nearly all round, as a trumpet does: up to about 400 Hz it stays within about 3 dB of its loudest level in every direction, even behind the player.',
          mid: 'From about 500 Hz the front starts to win.',
          high: 'From about 1 kHz up, the sound gathers strongly along the bell’s axis — the bell works like a megaphone for the higher notes.',
        },
        bass: {
          low: 'Low down a bass trombone spreads its sound nearly all round, like the tenor.',
          mid: 'In the middle the front starts to win — its larger bell starts to beam a little lower in pitch than a tenor’s.',
          high: 'Up high the sound gathers strongly along the bell’s axis. The bass is expected to behave like the tenor, shifted a little lower in pitch by its larger bell.',
        },
      },
      mutes: {
        tenor: {
          straight: 'A cone held in the bell by cork strips: a thinner, more nasal colour, quieter, and it reaches past the rim.',
          cup: 'A straight mute with a cup facing back at the bell: darker and softer — and the cup reaches farther past the rim.',
          harmon: 'A bulb sealed in the bell with a stem through it: a focused, buzzy tone from the stem.',
          plunger: 'A rubber cup the left hand moves in front of the bell — while the right hand works the slide. Both hands move: nothing goes in their way.',
        },
        bass: {
          straight: 'A straight mute made for the larger bass bell: thinner and quieter, reaching past the rim.',
          cup: 'A cup mute for the bass bell: darker and softer, reaching farther past the rim.',
          plunger: 'A plunger in front of the larger bell, worked by the left hand — which also works the valve triggers.',
        },
      },
      tubeNote: {
        tenor: 'The trombone’s tube is about 2.7 m long, unwound. The positions here are the ideal ones on that length: a real player finds them by ear and feel — there are no markers on the slide.',
        bass: 'The bass trombone has the same 2.7 m tube; its valves add loops of tubing for the lowest notes. With the F valve, the slide has six positions over its whole length.',
      },
      silentNote: 'This lab never plays a sound and draws no frequency curve for the horn: how a real trombone sounds depends on the horn, the mouthpiece, the player and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'The lips are the source, but the tube decides the note: the standing wave in the air column locks the lips to it. The slide changes the tube’s length — and moves the crook, the hand and the arm half a metre and more.',
    }),
    setting: makeBrassSettingPage({
      ...A02_PLAN,
      nearA11y: 'A trombonist from above, the bell pointing right toward the audience and the slide reaching past it; the slide’s reach to 7th position dashed. A music stand to the left, a second trombone and a trumpet beside, the drum kit behind.',
      wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another player’s wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair in front of the section; beside each player a headphone mixer on its stand, each wired back to the control room at the room’s edge.' },
      nearLanding: 'Tap anything around the player — or step through ITEM — to see what it means for a trombone mic. There is nothing to answer yet.',
      nearIdle: 'The slide reaches straight out from the player’s mouth, past the bell, and at 7th position about 56 cm farther. The bell points out toward the audience. Everything else is a neighbour a trombone mic will hear.',
      stageIdle: 'Two floor monitors: the player’s own wedge in front — beyond the slide’s reach — and another player’s to the side. Monitors, the PA and a loud band all reach a trombone mic.',
      studioIdle: 'No monitors on the floor: each player hears the band on headphones, from a personal mixer beside them. The room — and a main pair, when the trombone plays in a section — are part of the picture now.',
      before: [
        { title: 'ASK THE PLAYER FIRST', text: 'With the player, map the slide’s full reach in the passage — out to 7th position, the angle they hold it, standing or seated — and any valve and mute use. Hear the real part: quiet phrases, the strongest accents, the lowest notes. Hear it from where the audience would.' },
        { title: 'THE SLIDE IS PRECISION TUBING', text: 'A small bend can spoil its smooth travel. Never touch, push or hold the slide; nothing — stand, boom, cable or clip — goes in its path, and leave a comfortable buffer. If in doubt, stop and move the hardware with the player.' },
        { title: 'ONE HORN HERE', text: 'This lesson is one trombone. Miking a whole horn section — several horns sharing mics, their spacing and their blend — is a topic of its own, with ensembles and voice. Here, when other horns play, hear the section first and treat this mic as a spot.' },
      ],
      hearing: 'Protect your hearing during soundcheck and on loud stages. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating and the input meter say nothing about it. Don’t ask the player to play louder than the music to “test the mic”, and use hearing protection where it is loud.',
    }),
  },
  stepCounts: { sound: 5 },
};
