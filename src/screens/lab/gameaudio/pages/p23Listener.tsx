/**
 * WHOSE EARS: THE LISTENER (handoff lesson 3). The learner's page 5.
 *
 * THE FILE'S NUMBER IS ITS NAME, NOT ITS PLACE (see pages/index.ts): this
 * page was the second lesson of "Kinds of games" until 2026-11-14, when the
 * owner's decision 5 ("Split a page that holds two lessons into two pages";
 * beginner audit G5, page 4) gave it a page of its own. Every sentence, the
 * tray, the three goals and the check are the old page's, unchanged.
 *
 * The one thing that changes most between kinds of game: where the game
 * puts its LISTENER. The learner moves it from the player to an overhead
 * camera, and reads what that does to one sound.
 *
 * WHAT THE MODEL REALLY DOES (read before changing the text):
 *   - the camera listener is over the middle of the scene, high up
 *     (GA_CAMERA_HEIGHT), and its left and right follow the picture; FACING
 *     turns the player only, so with the camera listening GEN PAN no longer
 *     follows FACING;
 *   - the camera's height only narrows the pan. At FACING 0° the generator
 *     is far to the player's right, and from the camera it sits nearer the
 *     center. At other facings its side can change instead of narrowing,
 *     which is why the page asks for 0° first;
 *   - LEVEL is measured along the ground from the middle of the scene
 *     (gaListenDistance), so nothing drops out of range because the camera
 *     is high: a source near the middle is louder for the camera than one
 *     near an edge, wherever the player stands.
 *
 * The page does not put the listener back when it is left: every page opens
 * with the player listening (GaRack's `enterPage`).
 *
 * Common mistake taught against: placing every sound on the visible player
 * character in every camera mode.
 */
import { useRef, useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { listenerOf, type GaState } from '../model/gaModel';
import { gaDispatch, useGa } from '../model/gaStore';
import { PLACES, stereoPan } from '../model/gaWorld';
import { ChATray, ChATrayNote, ChATrayRow } from './chAViews';
import { G23 } from './guides/p23';
import { facingKey, useSince } from './shared';

const ASSETS = ['gen_hum', 'gen_air', 'fountain'] as const;
// owner 2026-11-15: "build waves 1 thru 3" (GA-01): Positional audio came here from the distance page
const TERMS = gaTerms('Audio listener', 'Listener position', 'Listener orientation', 'Positional audio');

/** Where the generator sits, left to right, for whoever is listening now:
 *  the model's own stereo pan, in words and a number (never color alone).
 *  A generator that is not played has no pan: "—", as the Emitters and
 *  distance page prints it (round-2 bug test 2026-11-13, R2-GA1-07). */
function genPan(s: GaState): { v: string; a11y: string } {
  const inst = s.inst.find((i) => i.event === 'generator' && i.owner === 'generator-1');
  const voices = inst ? s.voices.filter((v) => v.inst === inst.id) : [];
  if (!voices.length) return { v: '—', a11y: 'no pan: generator 1 is not playing' };
  if (voices.every((v) => v.state === 'virtual')) return { v: '—', a11y: 'no pan: generator 1 is virtual, tracked and not played' };
  const pan = stereoPan(listenerOf(s), PLACES.generator);
  const n = Math.round(Math.abs(pan) * 100);
  if (n < 3) return { v: 'CENTER', a11y: 'the generator is in the center' };
  return { v: `${pan < 0 ? 'L' : 'R'} ${n}%`, a11y: `the generator is ${n} percent to the ${pan < 0 ? 'left' : 'right'}` };
}

const LISTENER_NOTE: Record<GaState['listenerMode'], string> = {
  player: 'The listener is on YOU. Left and right follow the way you face.',
  camera: 'The listener is a camera high above the middle of the scene. Left and right follow the picture, level follows the distance from the middle, and FACING turns only the character.',
};

/** The LISTENER tray: whose ears, and one sound to judge them by. */
function ListenerTray({ onCamera }: { onCamera: () => void }) {
  const s = useGa();
  const gen = s.machines.find((m) => m.id === 'generator-1');
  const on = !!gen?.on;
  return (
    <ChATray>
      <ChATrayRow
        head="WHOSE EARS"
        chips={[
          { label: 'YOUR EARS', mark: true, on: s.listenerMode === 'player', onPress: () => gaDispatch({ type: 'listener', mode: 'player' }) },
          {
            label: 'OVERHEAD CAMERA',
            mark: true,
            on: s.listenerMode === 'camera',
            onPress: () => {
              onCamera();
              gaDispatch({ type: 'listener', mode: 'camera' });
            },
          },
        ]}
      />
      <ChATrayNote>{LISTENER_NOTE[s.listenerMode]}</ChATrayNote>
      <ChATrayRow head="A SOUND TO LISTEN TO" chips={[{ label: on ? 'GENERATOR 1 · ON' : 'GENERATOR 1 · OFF', on, onPress: () => gaDispatch({ type: 'machine', id: 'generator-1', on: !on }) }]} />
    </ChATray>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);

  // "the player turned while the camera was the listener": the model counts
  // every turn; this notes which listener was in use when the count rose
  const turns = since('turned');
  const turnsSeen = useRef(turns);
  const turnedUnderCamera = useRef(false);
  if (turns > turnsSeen.current) {
    if (s.listenerMode === 'camera') turnedUnderCamera.current = true;
    turnsSeen.current = turns;
  }

  // the camera chosen BY THE LEARNER in the LISTENER tray
  const [choseCamera, setChoseCamera] = useState(false);

  const goals = [
    { label: 'Listen from the overhead camera', hit: choseCamera && since('listener:camera') > 0 },
    { label: 'Move FACING while the camera listens', hit: turnedUnderCamera.current },
    { label: 'Choose YOUR EARS again', hit: since('listener:player') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const pan = genPan(s);
  const camera = s.listenerMode === 'camera';

  const listenerKey: DockParam = {
    kind: 'group',
    id: 'listener',
    label: 'LISTENER',
    valueLabel: camera ? 'CAMERA' : 'YOU',
    valueA11y: camera ? 'the overhead camera is listening' : 'you, the player, are listening',
    render: () => <ListenerTray onCamera={() => setChoseCamera(true)} />,
  };

  return (
    <GaRack
      spec={{
        keys: [facingKey(s), listenerKey],
        initialParam: 'facing',
        readouts: [
          { k: 'LISTENER', kNarrow: 'EARS', v: camera ? 'CAMERA' : 'YOU', vA11y: camera ? 'the overhead camera is listening' : 'you, the player, are listening', flex: 1.2 },
          { k: 'GEN PAN', v: pan.v, vA11y: pan.a11y, flex: 1.2 },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The amber wedge on YOU marks the listener: the game’s ears. Until now the listener has been on YOU.</Look>
        <P>One thing changes with the perspective: where the game puts its listener.</P>
        <P>Level follows the listener too: for the camera, each sound’s level depends on its distance from the middle of the scene, not from YOU.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do parts={['Open LISTENER and switch GENERATOR 1 on.', 'Move FACING to 0°, so YOU face the top of the picture, and read GEN PAN.', 'Choose OVERHEAD CAMERA and read GEN PAN again.']} />
        <P>At 0°, for your ears the generator is far to the right. For the camera it sits nearer the center, because the camera is high above the scene.</P>
      </Step>
      <Step n={3}>
        <Do>Now move FACING. Then choose YOUR EARS again.</Do>
        <P>With the camera listening, YOU turn, and GEN PAN stays still. The character is not the listener.</P>
        <Note tone="mistake">Placing every sound on the visible player character in every camera mode. The team chooses where the listener goes.</Note>
        <ActivityLog state={s} lines={4} />
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow=""
          question="You move the listener from the player to the overhead camera. The generator has not moved. Why does its pan change?"
          options={[
            'Direction is measured from the listener, and it has moved',
            'The generator’s sound file was replaced by an overhead version',
            'In an overhead view, every sound is placed in the center',
            'Pan follows the visible player character, and the character turned',
          ]}
          correct={0}
          explain="The game measures every sound against the listener. Move the listener and each sound’s direction and distance change, with nothing restarted."
          wrong={[
            undefined,
            'No file changed. The same sound kept playing; only the place it is measured from moved.',
            'Sounds still sit to the left or the right of the camera, as the picture shows them. Their pan is now measured from the camera, not from YOU.',
            'That is the common mistake. The character did not turn, and with the camera listening, turning the character changes nothing.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P23: PageDef = { title: 'Whose ears: the listener', short: 'LISTENER', Component: Page, manualDone: true, rack: true, guide: G23 };
