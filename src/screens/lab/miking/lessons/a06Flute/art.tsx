/**
 * A06 FLUTE — the look (charter §2 layer 3), from the shared woodwind
 * family: the flute in its three designs (silver keyed, dark-wood keyed,
 * boxwood simple-system with open finger holes), the standing player and the
 * air jet (dashed), projected from the same layouts the collisions and the
 * zones use; its own HOW IT SOUNDS and WHERE IT SITS pages; for ORIENT, the
 * three designs side by side — "identify the design first".
 */
import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group } from '@shopify/react-native-skia';
import type { LessonArt } from '../../engine/scene/sceneTypes.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { fitXform } from '../../engine/geometry/frame.ts';
import { useStageTextScale } from '../../../rack/stageAspect';
import { add, scale } from '../../engine/geometry/vec.ts';
import { windLessonArt } from '../shared/woodwinds/windLessonArt';
import { WindBody } from '../shared/woodwinds/WindArt';
import { frameAt, portraitOf, type Layout } from '../shared/woodwinds/windPosture.ts';
import { FLUTE_MODEL, LAYOUTS, layoutOf } from './geometry.ts';

const M = LAYOUTS.metal;
const turn = (L: Layout, dy: number, stand: 0 | 1 = 0) => portraitOf(L, frameAt(L, 300).t, { x: 0, y: -1, z: 0.3 }, { x: 0, y: dy, z: 0 }, stand);
/** ORIENT: the three designs, one above the other. */
const TRIO: { L: Layout; label: string; short: string; dy: number }[] = [
  { L: turn(LAYOUTS.metal, 0), label: 'METAL CONCERT FLUTE · KEYED', short: 'METAL', dy: 0 },
  { L: turn(LAYOUTS.wooden, 150), label: 'WOODEN CONCERT FLUTE · KEYED', short: 'WOODEN', dy: 150 },
  { L: turn(LAYOUTS.simple, 300), label: 'SIMPLE-SYSTEM · OPEN FINGER HOLES', short: 'SIMPLE', dy: 300 },
];
const TRIO_BOX = { u0: -70, u1: 690, v0: -95, v1: 360 };
const pt = (L: Layout, s: number) => frameAt(L, s).p;
const TRIO_LABELS: StaticLabel[] = [
  ...TRIO.map((t, i) => ({ id: `d${i}`, text: t.label, short: t.short, u: 310, v: t.dy - 52, align: 'center' as const, tone: 'amber' as const })),
  { id: 'lip', text: 'LIP PLATE', u: pt(TRIO[0].L, 0).x - 20, v: 62, align: 'center', at: { u: pt(TRIO[0].L, 0).x, v: 12 } },
  { id: 'foot', text: 'FOOT JOINT', u: pt(TRIO[0].L, 600).x, v: 62, align: 'center', at: { u: pt(TRIO[0].L, 600).x, v: 12 } },
  { id: 'holes', text: 'OPEN HOLES', u: pt(TRIO[2].L, 400).x, v: 352, align: 'center', at: { u: pt(TRIO[2].L, 400).x, v: 312 } },
];
function FluteTrio({ w, h }: { w: number; h: number }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('side', TRIO_BOX, w, h, 6), [w, h]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel="Three transverse flutes, one above the other: a silver metal concert flute with padded keys and open-hole rings; the same keyed design in dark wood; and a pale simple-system wooden flute with six open finger holes and only a few keys.">
        <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
          {TRIO.map((t) => (
            <WindBody key={t.short} L={t.L} view="side" />
          ))}
        </Group>
      </Canvas>
      <StaticLabels labels={TRIO_LABELS} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

/** HOW IT SOUNDS: the metal flute stood on end, the embouchure at the top. */
export const SOUND_FIG: Layout = turn(M, 0, 1);
const jetTip = (L: Layout) => add(L.jet!.a, scale(L.jet!.dir, L.jet!.len));

const art = windLessonArt({
  model: FLUTE_MODEL,
  layoutOf,
  labels: {
    side: [
      { id: 'head', text: 'HEAD JOINT · LIP PLATE', short: 'HEAD JOINT', s: 90, side: 1, off: 150 },
      { id: 'body', text: 'BODY · KEYS', short: 'BODY', s: 380, side: -1, off: 150 },
      { id: 'foot', text: 'FOOT END', s: 560, side: 1, off: 150 },
    ],
    top: [
      { id: 'head', text: 'HEAD JOINT', s: 90, side: -1, off: 140 },
      { id: 'body', text: 'BODY · KEYS', short: 'BODY', s: 380, side: 1, off: 150 },
      { id: 'foot', text: 'FOOT END', s: 560, side: -1, off: 140 },
    ],
  },
  points: {
    side: [{ id: 'jet', text: 'AIR JET', at: (L) => jetTip(L), du: 70, dv: 70 }],
    top: [{ id: 'jet', text: 'AIR JET', at: (L) => jetTip(L), du: 90, dv: 40 }],
  },
  portrait: { L: TRIO[0].L, box: TRIO_BOX, labels: [], a11y: '' },
  sound: {
    fig: { L: SOUND_FIG, box: { u0: -260, u1: 420, v0: -200, v1: 720 }, side: -1, subject: 'A metal concert flute stood on end, keys toward you, its air column drawn open' },
    other: 'closed',
    notesNote: 'A simplified fingering on the keyed flute: real fingerings vent and cross-finger, and the third octave uses special fingerings not drawn here. A simple-system flute’s holes sit in other places — the first-open-hole idea is the same.',
    pipeNote: 'The flute is close to the ideal pipe open at both ends: it sounds every multiple, and a little more breath jumps it up an octave. Compare a pipe closed at one end — the clarinet’s kind — with PIPE.',
    silentNote: 'This lab never plays a sound and draws no frequency curve for the flute: how a real flute sounds depends on the instrument, the head joint, the player and the room. The pictures show where the sound is made and where the sound and the air leave.',
    reveal: 'The embouchure hole radiates for every note; the first open hole carries much of the rest — the foot only when every hole is closed.',
  },
  setting: {
    before: [
      { title: 'IDENTIFY THE DESIGN, THEN ASK THE PLAYER', text: 'Metal or wooden, keyed or simple-system? Then: how do they move — the head’s turn, the flute’s swing? Which passages: low and high, soft and strong, tongued and legato, trills? What sound do they want — intimate and airy, natural and roomy, or separated over a band? Hear the flute unamplified first.' },
      { title: 'WORK WITH THE FLUTE AS IT IS', text: 'Ask the player — and for wood, the maker — before attaching anything. Nothing presses wood, bridges a joint, covers a hole or touches a rod or pad; on a simple-system flute, nothing goes over an open finger hole. If the fit is uncertain, use a stand.' },
    ],
    hearing: 'Protect your hearing during rehearsals and soundcheck: a flute’s top register is loud right beside the player’s head, and the brass and percussion behind a section can be loud for long stretches. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it.',
    sectionLanding: 'Tap anything in the section — or step through ITEM — to see what it means for a flute mic. There is nothing to answer yet.',
    sectionIdle: 'The flutes sit in the front row, their feet out to the players’ right; the clarinets sit right behind. Everything near the flute is either the player’s space, the air jet, or a neighbour its mic will hear.',
    stageIdle: 'Two floor monitors: the player’s own wedge in front and another player’s to the side. Monitors, the PA and a loud band all reach a flute mic.',
    studioIdle: 'No monitors on the floor. The room — and a main pair above the conductor — are part of the picture now.',
    a11y: { section: 'The woodwind section from above: flutes and oboes in front, clarinets and bassoons behind, the first flute ringed in amber.', stage: 'The same from above, on a stage: the player’s wedge in front, another wedge to the side, the audience below.', studio: 'The same from above, in a studio room, with a main pair on a tall stand above the conductor.' },
  },
  plan: { own: 'fl1', layoutOf, ownLabel: 'FLUTE 1 · THIS LESSON' },
});

export const FLUTE_ART: LessonArt = { ...art, figure: { aspect: (TRIO_BOX.u1 - TRIO_BOX.u0) / (TRIO_BOX.v1 - TRIO_BOX.v0), render: (w, h) => <FluteTrio w={w} h={h} /> } };
