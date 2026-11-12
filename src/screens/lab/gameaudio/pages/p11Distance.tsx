/**
 * Page 11 — EMITTERS AND DISTANCE (Chapter 3, Space).
 *
 * A positioned sound has an emitter (where it comes from) and is measured
 * against the listener (where the ears are and which way they face). The
 * learner picks a source, turns with FACING, walks with STEP, and reads
 * DISTANCE and PAN, worked out from model/gaWorld by pages/data/chcSpace.
 *
 * The distance rule is the model's own (gaWorld.attenuationGain): full level
 * inside the minimum; level halved (−6 dB) per doubling beyond it; over the
 * last fifth of the range an extra fade, so it is silent at the maximum. In
 * this scene a loop that passes its maximum goes VIRTUAL (the model's log
 * line, and its `virtual` fact). The page opens on a clean scene (YOU on the
 * stone path, facing the closed door, nothing running), so every step says
 * what to switch on.
 *
 * Said plainly, because it is the lesson: what is heard here is LEFT / RIGHT
 * PAN AND LEVEL only. A source straight ahead and one straight behind pan the
 * same. The scene knows the difference; this output cannot show it.
 *
 * Common mistake taught against: calling ordinary left/right panning complete
 * 3D sound.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying } from '../model/gaModel';
import { gaDispatch, useGa } from '../model/gaStore';
import { GA_ASSETS } from '../sounds/gaSoundBank';
import { ReadCard, TrayChip, onOff, tray } from './chcBits';
import { CHC_SOURCES, chcSpace, directionWord, levelWord, panShort, panWord, type ChcSource } from './data/chcSpace';
import { G11 } from './guides/p11';
import { facingKey, stepKey, useSince } from './shared';

const ASSETS: readonly string[] = ['door', 'door_rattle', 'gen_hum', 'gen_air', 'fountain', 'amb_room', 'amb_yard', 'ir_room', ...GA_ASSETS.filter((a) => a.id.startsWith('fs_')).map((a) => a.id)];
const TERMS = gaTerms('Audio Emitter', 'Attenuation curve', 'Minimum distance', 'Maximum distance', 'Positional audio', 'Cone attenuation');

/** The SOURCES tray: which source to measure, and what is switched on. */
function SourcesTray({ src, setSrc }: { src: ChcSource; setSrc: (s: ChcSource) => void }) {
  const s = useGa();
  const gen = !!s.machines[0]?.on;
  const scene = gaPlaying(s, 'fountain');
  return (
    <View style={tray.tray}>
      <Text style={tray.head}>SOURCE TO MEASURE</Text>
      <View style={tray.row}>
        <TrayChip label={marked('GENERATOR', src === 'generator-1')} selected={src === 'generator-1'} onPress={() => setSrc('generator-1')} />
        <TrayChip label={marked('FOUNTAIN', src === 'fountain')} selected={src === 'fountain'} onPress={() => setSrc('fountain')} />
      </View>
      <Text style={tray.head}>SWITCH ON</Text>
      <View style={tray.row}>
        <TrayChip label={onOff('GENERATOR 1', gen)} selected={gen} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gen })} />
        <TrayChip label={onOff('SCENE', scene)} selected={scene} onPress={() => gaDispatch({ type: 'scene', on: !scene })} />
        <TrayChip label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'} onPress={() => gaDispatch({ type: 'door' })} />
      </View>
      <Text style={tray.note}>SCENE is the fountain and the background sound of each place.</Text>
    </View>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [src, setSrc] = useState<ChcSource>('generator-1');
  const [check, setCheck] = useState(false);
  const r = chcSpace(s, src);
  const name = CHC_SOURCES[src].name;
  const genOn = gaPlaying(s, 'generator');
  const sceneOn = gaPlaying(s, 'fountain');
  const goals = [
    { label: 'Run the generator and the scene', hit: since('inst:generator') > 0 && genOn && sceneOn },
    { label: 'Turn until the source is behind you', hit: since('turned') > 0 && Math.abs(r.bearingDeg) >= 170 },
    { label: 'Walk until a sound goes VIRTUAL', hit: since('virtual') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const onWord = genOn && sceneOn ? 'BOTH' : genOn ? 'GEN 1' : sceneOn ? 'SCENE' : 'NONE';
  const sourcesKey: DockParam = {
    kind: 'group',
    id: 'sources',
    label: 'SOURCES',
    valueLabel: onWord,
    valueA11y: `switched on: ${genOn && sceneOn ? 'the generator and the scene' : genOn ? 'the generator' : sceneOn ? 'the scene' : 'nothing'}; measuring the ${name.toLowerCase()}`,
    render: () => <SourcesTray src={src} setSrc={setSrc} />,
  };

  return (
    <GaRack
      spec={{
        keys: [facingKey(s), stepKey(), sourcesKey],
        initialParam: 'facing',
        readouts: [
          { k: 'DISTANCE', v: `${r.distanceM.toFixed(1)} m`, vA11y: `the ${name.toLowerCase()} is ${r.distanceM.toFixed(1)} meters away` },
          { k: 'PAN', v: panShort(r.pan), vA11y: `pan ${panWord(r.pan).toLowerCase()}` },
        ],
        select: src,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>Two dashed rings surround the source you chose: MIN, its minimum distance, and MAX, its maximum. A dotted line joins it to you.</Look>
        <P>Every positioned sound has an emitter, the spot it comes from. The game compares it with the listener: where you stand and which way you face.</P>
        <P>Inside the minimum the sound is at full level. Beyond it the level halves, a drop of 6 dB, each time the distance doubles. Over the last fifth of the way to the maximum it also fades, so it reaches silence at the maximum. A real game draws its own curve for each sound.</P>
        <P>Some sources aim their sound, like a flashlight. That is cone attenuation. The sources on this page send sound equally in every direction.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open SOURCES. Switch GENERATOR 1 and SCENE on, press OPEN DOOR, and choose a source. Then move FACING and press STEP.</Do>
        <P>DISTANCE follows where you stand. PAN follows the angle between your facing and the source.</P>
        <ReadCard
          title={`THE ${name}, FROM WHERE YOU ARE`}
          rows={[
            { k: 'STATE', v: !r.playing ? 'Not switched on' : r.virtual ? 'VIRTUAL: tracked, not played' : 'Playing' },
            { k: 'DISTANCE', v: `${r.distanceM.toFixed(1)} m (minimum ${r.atten.min} m, maximum ${r.atten.max} m)` },
            { k: 'LEVEL FROM DISTANCE', v: levelWord(r) },
            { k: 'DIRECTION', v: directionWord(r.bearingDeg) },
            { k: 'PAN', v: panWord(r.pan) },
          ]}
          note={r.obstructed ? 'The closed door is in the way, so this source is also turned down and filtered. The next page is about that.' : undefined}
        />
      </Step>
      <Step n={3}>
        <Do>Choose GENERATOR. Turn until it is behind you. Then press STEP until STATE on the card reads VIRTUAL.</Do>
        <P>Straight ahead and straight behind both pan to the center and sound the same. This page plays left and right pan and level, nothing more. The scene knows the source is behind you; this output cannot show it.</P>
        <P>In this scene, a loop that passes its maximum distance becomes virtual: the game tracks it, plays nothing, and brings it back when you return.</P>
        <ActivityLog state={s} lines={4} only={['state']} />
        <Note tone="mistake">Calling ordinary left and right panning complete 3D sound. Pan and level cannot tell front from back, or above from below.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The generator is straight behind you, 4 m away. What does the output on this page do with it?"
          options={[
            'Plays it at the center, the same as if it were straight ahead',
            'Plays it in the left ear only',
            'Makes it silent, because you are not facing it',
            'Makes it sound as if it comes from behind you',
          ]}
          correct={0}
          explain="A left and right pan has no front or back. Straight ahead and straight behind are both the center, so they sound the same. Only the level, set by distance, says anything more."
          wrong={[
            undefined,
            'A sound goes to one side only when it is on that side of where you face. Straight behind is neither left nor right.',
            'Level follows distance here, not where you look. At 4 m the generator is well inside its maximum distance.',
            'The scene knows it is behind you, but a left and right pan cannot show that. Front and back need a different way of rendering, such as the headphone 3D on the Output formats page.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P11: PageDef = { title: 'Emitters and distance', short: 'DISTANCE', Component: Page, manualDone: true, rack: true, guide: G11 };
