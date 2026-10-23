/**
 * A01 TRUMPET AND FLUGELHORN — the look (charter §2 layer 3), drawn only
 * from the shared brass family: the horn and its standing player, projected
 * from the same poses the collisions and the zones use. Its own HOW IT
 * SOUNDS and WHERE IT SITS pages, and ORIENT's portrait of both horns.
 */
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { partIn } from '../shared/bowed/bowedModel.ts';
import { brassHitTest, brassLabels, makeBrassInstrument, makeBrassPortrait } from '../shared/brass/BrassArt';
import { makeBrassSoundPage } from '../shared/brass/BrassSoundPage';
import { makeBrassSettingPage } from '../shared/brass/BrassSettingPage';
import { A01_PLAN } from './plan.ts';
import { A01_MODEL, FH, TP } from './geometry.ts';

const POSES = { trumpet: TP, flugelhorn: FH };
const pose = (v: string) => (v === 'flugelhorn' ? FH : TP);

export const A01_ART: LessonArt = {
  Instrument: makeBrassInstrument(POSES, 'trumpet'),
  labels: (view, variant) => brassLabels(pose(variant), view),
  hitTest: (view, variant, u, v, tol) => {
    const id = brassHitTest(pose(variant), view, u, v, tol);
    return id ? partIn(A01_MODEL, id, variant) : null;
  },
  labelsYieldToMic: true,
  figure: makeBrassPortrait(
    [
      {
        P: TP,
        title: 'TRUMPET',
        labels: [
          { id: 'bell', text: 'BELL', at: (P) => P.H({ x: -40, y: -P.spec.bell.mm / 2 + 4, z: 0 }), du: 30, dv: -95 },
          { id: 'valves', text: 'VALVES', at: (P) => P.valves[1].button, du: 0, dv: -80 },
          { id: 'lead', text: 'LEADPIPE', short: 'LEAD', at: (P) => P.tubes.find((t) => t.id === 'leadpipe')!.pts[0], du: 60, dv: -95 },
          { id: 'mp', text: 'MOUTHPIECE', short: 'MOUTHPC', at: (P) => P.mouthpiece.cup, du: -20, dv: 175, align: 'left' },
          { id: 'tune', text: 'TUNING SLIDE', short: 'TUNING', at: (P) => P.tubes.find((t) => t.id === 'mainSlide')!.pts[7], du: 40, dv: 110 },
          { id: 'v3', text: 'VALVE SLIDES', short: 'SLIDES', at: (P) => P.tubes.find((t) => t.id === 'slide3')!.pts[2], du: -40, dv: 110 },
        ],
      },
      {
        P: FH,
        title: 'FLUGELHORN',
        labels: [
          { id: 'bell', text: 'WIDER BELL', short: 'BELL', at: (P) => P.H({ x: -40, y: -P.spec.bell.mm / 2 + 4, z: 0 }), du: 40, dv: -100 },
          { id: 'valves', text: 'VALVES', at: (P) => P.valves[1].button, du: -10, dv: -80 },
          { id: 'mp', text: 'MOUTHPIECE', short: 'MOUTHPC', at: (P) => P.mouthpiece.cup, du: -20, dv: 175, align: 'left' },
          { id: 'cone', text: 'CONICAL TUBE', short: 'CONICAL', at: (P) => P.H({ x: -P.spec.flare.mm * 0.6, y: 6, z: -20 }), du: 40, dv: 120 },
        ],
      },
    ],
    'A trumpet above and a flugelhorn below, each seen from the front and to the side so the bell’s opening shows: the bell, the three valves with their buttons, the leadpipe and mouthpiece, the tuning and valve slides. The flugelhorn’s bell is wider and its tube widens more gradually.',
  ),
  pages: {
    sound: makeBrassSoundPage({
      poses: POSES,
      fallback: 'trumpet',
      bands: {
        trumpet: {
          low: 'Low down the trumpet spreads its sound nearly all round — even toward the player’s back.',
          mid: 'In the middle the front starts to win: the sound spreads less to the sides and behind.',
          high: 'From about 1 kHz up, the sound gathers forward along the bell’s axis, more so as the pitch rises — evenly round the axis, and much the same whether the player is loud or soft.',
        },
        flugelhorn: {
          low: 'Low down a flugelhorn spreads its sound nearly all round, like every brass bell.',
          mid: 'In the middle the front starts to win.',
          high: 'Up high the sound beams forward along the bell’s axis. Its larger bell narrows the beam a little sooner than a trumpet’s — the brass family’s trend, as no flugelhorn was measured on its own.',
        },
      },
      mutes: {
        trumpet: {
          straight: 'A cone held in the bell by cork strips: a thinner, more nasal colour, quieter, and it reaches a few centimetres past the rim.',
          cup: 'A straight mute with a cup facing back at the bell: darker and softer — and the cup reaches farther past the rim than the open bell.',
          harmon: 'A bulb sealed in the bell with a stem through it: a buzzy, focused tone that comes out of the stem and its cup — close to the sound’s new source.',
          plunger: 'A rubber cup the left hand moves in front of the bell, opening and closing for the “wah”. The hand and the cup move all the time: nothing goes in their way.',
        },
        flugelhorn: {
          straight: 'A flugelhorn straight mute, if the part asks for one: quieter and thinner, and it reaches past the rim. Many flugelhorn parts are played open.',
          cup: 'A cup mute made for the flugelhorn’s wider bell: darker and softer, reaching past the rim.',
          plunger: 'A plunger or a hand over the bell, if the part asks: it moves in front of the bell all the time.',
        },
      },
      tubeNote: {
        trumpet: 'The trumpet’s tube is about 1.5 m long, unwound; the valves add loops to it. The loop lengths here are the ideal ones — a real horn’s slides are set by the player’s ear.',
        flugelhorn: 'The flugelhorn works the same way: three valves, each adding a loop. Its tube widens gradually along most of its length — part of its rounder sound.',
      },
      silentNote: 'This lab never plays a sound and draws no frequency curve for the horn: how a real trumpet or flugelhorn sounds depends on the horn, the mouthpiece, the player and the room. The pictures show where the sound comes from and where it goes.',
      reveal: 'The lips are the source, but the tube decides the note: the standing wave in the air column locks the lips to it. And the bell decides where the sound goes.',
    }),
    setting: makeBrassSettingPage({
      ...A01_PLAN,
      nearA11y: 'A trumpet player from above, the bell pointing right toward the audience: a music stand to the left, a second trumpet and a trombone beside, a singer at a mic in front and to the left, the drum kit behind.',
      wideA11y: { stage: 'The same from above, on a stage: the player’s wedge in front, another wedge for the singer, the audience below.', studio: 'The same from above, in a studio room, with a main pair in front of the section; beside each player a headphone mixer on its stand, each wired back to the control room at the room’s edge.' },
      nearLanding: 'Tap anything around the player — or step through ITEM — to see what it means for a trumpet mic. There is nothing to answer yet.',
      nearIdle: 'The bell points out toward the audience — and wherever the player turns. The valve hands work all the time. Everything else is a neighbour a trumpet mic will hear — or a person the bell can blast.',
      stageIdle: 'Two floor monitors: the player’s own wedge in front, and the singer’s. Monitors, the PA and a loud band all reach a trumpet mic.',
      studioIdle: 'No monitors on the floor: each player hears the band on headphones, from a personal mixer beside them. The room — and a main pair, when the trumpet plays in a section — are part of the picture now.',
      before: [
        { title: 'ASK THE PLAYER FIRST', text: 'Hear the actual part: quiet lyrical notes, the strongest high attacks, falls and shakes, and every mute change. Watch how far the bell moves, and whether the player turns toward the band or a conductor. Hear the horn from where the audience would — the player hears it from behind the bell, which is different.' },
        { title: 'WORK WITH THE HORN AS IT IS', text: 'The horn is the player’s. Nothing clamps to the bell or its finish without their agreement and a clip made for it; nothing touches the valves, the slides or the mute’s path. The player puts mutes in and takes them out.' },
        { title: 'ONE HORN HERE', text: 'This lesson is one trumpet. Miking a whole horn section — several horns sharing mics, their spacing and their blend — is a topic of its own, with ensembles and voice. Here, when other horns play, hear the section first and treat this mic as a spot.' },
      ],
      hearing: 'Protect your hearing during soundcheck and on loud stages. NIOSH advises no more than 85 dBA averaged over 8 hours a day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — a mic’s maximum SPL rating and the input meter say nothing about it. A trumpet can be very loud close to its bell: keep the bell from firing at anyone’s ear, and use hearing protection where it is loud.',
    }),
  },
  stepCounts: { sound: 5 },
};
