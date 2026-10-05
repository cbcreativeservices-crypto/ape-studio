/**
 * THE DOUBLE BASS's look, shared by C06a (plucked) and C06b (bowed): the
 * bass on its endpin, the bassist standing behind it, the plucking hand's
 * path or the bow's sweep hatched — projected from the same posture the
 * collisions and the zones use (bass.ts) — plus the face-on portrait, the
 * HOW IT SOUNDS page (plucked or bowed string) and the WHERE IT SITS plan
 * (a jazz trio: the kit to the bassist's right, the piano to the left).
 */
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { bowedHitTest, bowedLabels, makeBowedInstrument, makeBowedPortrait } from './BowedArt';
import { makeBowedSoundPage } from './BowedSoundPage';
import { makeBowedSettingPage, type PlanObject } from './BowedSettingPage';
import { BASS_A, BASS_BOW, BASS_PLUCK, BASS_SPEC, BASS_VIEWS } from './bass.ts';
import { BASS_HEARING, type BassKind } from './bassWords.ts';

const L = BASS_SPEC.string.mm;

const LABELS = {
  side: {
    bridge: { du: 80, dv: -20 },
    fb: { du: 90, dv: -30 },
    scroll: { du: 80, dv: -10 },
    tail: { du: 90, dv: 40 },
    endpin: { du: 60, dv: -40 },
    player: { du: -150, dv: 40, align: 'right' as const },
  },
  top: {
    bridge: { du: 80, dv: -40 },
    fhole: { du: 70, dv: 60 },
    scroll: { du: 60, dv: -60 },
    bow: { du: 0, dv: 60, align: 'center' as const },
    sweep: { du: 0, dv: 90, align: 'center' as const },
    player: { du: -60, dv: -40, align: 'right' as const },
  },
};

/** The drum kit to the bassist's right, the piano to the left (a typical trio). */
export const BASS_KIT_AT = { x: 150, z: 1550 };

export function bassArt(kind: BassKind): LessonArt {
  const bowed = kind === 'bow';
  const P = bowed ? BASS_BOW : BASS_PLUCK;
  const hands = bowed ? { x: P.bow.frog.x, z: P.bow.frog.z } : { x: P.player.handR.x, z: P.player.handR.z };
  const objects: PlanObject[] = [
    { id: 'bass', kind: 'self', at: { x: BASS_A.bridgeTop.x, z: BASS_A.bridgeTop.z }, r: 360, label: 'bass', scene: 'all' },
    { id: 'hands', kind: 'self', at: hands, r: 170, label: bowed ? 'bow' : 'hands', scene: 'kit' },
    { id: 'endpin', kind: 'self', at: { x: P.endpinTip!.x, z: P.endpinTip!.z }, r: 150, label: 'endpin', scene: 'kit' },
    { id: 'drums', kind: 'kit', at: BASS_KIT_AT, r: 700, label: 'drum kit', short: 'drums', scene: 'kit' },
    { id: 'piano', kind: 'piano', at: { x: 1350, z: -2150 }, yaw: 90, r: 650, label: 'piano', scene: 'kit' },
  ];
  return {
    Instrument: makeBowedInstrument(P, BASS_VIEWS, bowed),
    labels: (view) => bowedLabels(P, view, LABELS, bowed),
    hitTest: (view, _v, u, v, tol) => bowedHitTest(P, view, u, v, tol, bowed),
    figure: makeBowedPortrait(
      BASS_SPEC,
      'A double bass seen face-on, lying with its scroll to the right: the tall arched top with its two f-holes, the bridge, the tailpiece and the endpin, the long fingerboard, the tuning machines and the scroll, four strings; a bass bow beneath, tip at the left and the frog at the right.',
    ),
    pages: {
      sound: makeBowedSoundPage(
        bowed
          ? {
              spec: BASS_SPEC,
              excite: 'bow',
              stringName: 'The open E string',
              hz: BASS_SPEC.lowest.hz,
              points: [
                { id: 'bridge', label: 'NEAR BRIDGE', at: 40 / L, blurb: 'About 4 cm from the bridge: the bow drives the high shapes strongly.' },
                { id: 'mid', label: 'USUAL', at: 100 / L, blurb: 'About 10 cm from the bridge, in the middle of the bow’s usual range.' },
                { id: 'board', label: 'TOWARD BOARD', at: 170 / L, blurb: 'About 17 cm from the bridge, toward the fingerboard.' },
                { id: 'over', label: 'OVER BOARD', at: 320 / L, blurb: 'Over the end of the fingerboard: softer, fewer high shapes.' },
              ],
              pointDefault: 'mid',
              subject: 'The double bass cut across at the bridge, seen along the strings: the arched top and the back, the ribs, the bass bar, the soundpost, the tall bridge, four strings and the bow',
              shapesNote: 'This is a simplified string. On a real bass the thick strings are stiff, the ends are not perfectly still, and the body favours some pitches — but the whole-number pattern, and the still points, hold closely.',
              motionNote: 'This is the ideal bowed string. Real bowing adds roughness — the bow’s bite, and on a bass the rosin’s grip is heavy — and how hard and how fast the bassist bows changes the tone.',
              silentNote: 'This lab never plays a sound and draws no frequency curve for the bass: how a real bass sounds depends on the instrument, the strings, the bow and the player. The pictures show where the sound comes from and where it leaves.',
              reveal: 'The bow never strikes: it grips the string, lets it slip, and grips it again — once every vibration, for as long as it moves.',
            }
          : {
              spec: BASS_SPEC,
              excite: 'pluck',
              stringName: 'The open E string',
              hz: BASS_SPEC.lowest.hz,
              points: [
                { id: 'bridge', label: 'NEAR BRIDGE', at: 60 / L, blurb: 'About 6 cm from the bridge: a brighter, more percussive pluck.' },
                { id: 'mid', label: 'USUAL', at: 180 / L, blurb: 'About 18 cm from the bridge, in the plucking hand’s usual range.' },
                { id: 'board', label: 'END OF BOARD', at: 300 / L, blurb: 'About 30 cm from the bridge, at the end of the fingerboard: rounder, fewer high shapes.' },
              ],
              pointDefault: 'mid',
              subject: 'The double bass cut across at the bridge, seen along the strings: the arched top and the back, the ribs, the bass bar, the soundpost, the tall bridge, four strings and a plucking finger',
              shapesNote: 'This is a simplified string. On a real bass the thick strings are stiff, the ends are not perfectly still, and the body favours some pitches — but the whole-number pattern, and the still points, hold closely.',
              motionNote: 'This is the ideal plucked string, ringing without losses. A real string loses its high shapes first, so the note grows rounder as it dies away — and where and how the bassist plucks changes the tone.',
              silentNote: 'This lab never plays a sound and draws no frequency curve for the bass: how a real bass sounds depends on the instrument, the strings and the player. The pictures show where the sound comes from and where it leaves.',
              reveal: 'Nothing keeps a plucked string going: after the pluck it rings, and the note slowly dies away.',
            },
      ),
      setting: makeBowedSettingPage({
        P,
        hands: kind,
        objects,
        near: { u0: -1500, u1: 2300, v0: -2350, v1: 2450 },
        wide: { u0: -1600, u1: 3700, v0: -2500, v1: 2600 },
        nearA11y: bowed
          ? 'A bass in a small group from above: the bassist standing behind the bass, the bow’s sweep hatched, the endpin, a drum kit to the bassist’s right and a grand piano to the left.'
          : 'A bass in a jazz trio from above: the bassist standing behind the bass, the plucking hand’s path hatched, the endpin, a drum kit to the bassist’s right and a grand piano to the left.',
        wideA11y: { stage: 'The same from above, on a stage: the bassist’s wedge in front, the audience to the right.', studio: 'The same from above, in a studio room.' },
        nearLanding: 'Tap anything around the bassist — or step through ITEM — to see what it means for a bass mic. There is nothing to answer yet.',
        nearIdle: bowed
          ? 'The bassist stands behind the bass; the bow sweeps out to both sides; the endpin and the feet share the floor. The drums and the piano are neighbours a bass mic will hear.'
          : 'The bassist stands behind the bass; the plucking hand works a little above the bridge; the endpin and the feet share the floor. The drums and the piano are neighbours a bass mic will hear.',
        stageIdle: 'A floor wedge in front of the bassist, a loud kit beside — and the bass’s large body reflects both into a mic. The PA carries most of the bass to the audience.',
        studioIdle: 'No monitors on the floor. The room is part of the picture now — and its low-frequency modes can make one note boom.',
        before: [
          { title: 'ASK THE BASSIST FIRST', text: bowed ? 'How do they stand and move? Where does the bow go — long strokes, string crossings, some pizzicato? Is there a pickup? What sound do they want? Hear the bass unamplified in the room, from the low E up.' : 'How do they stand and move? Do they slap? Is there a pickup, and do they use it? What sound do they want? Hear the bass unamplified in the room — low notes, higher walking lines, accents and soft notes.' },
          { title: 'WORK WITH THE BASS AS IT IS', text: 'The bass is valuable, heavy and easy to knock over, and it is the bassist’s. Ask before touching it; nothing presses the bridge, the top, the f-holes or the varnish, no clip goes on without their agreement — and no stand goes where it could tip onto the bass.' },
        ],
        hearing: BASS_HEARING,
      }),
    },
  };
}
