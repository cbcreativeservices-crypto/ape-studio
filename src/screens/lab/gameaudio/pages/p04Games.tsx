/**
 * Page 4 — KINDS OF GAMES (handoff lesson 3 and section 5).
 *
 * Genre, perspective and play mode are three SEPARATE choices. The learner
 * browses twelve kinds of game (pages/data/gaGenres) and then does the one
 * thing that changes most between them: moves the LISTENER from the player
 * to an overhead camera, and reads what that does to one sound.
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
import { ChABullets, ChACard, ChAEmpty, ChARow, ChATray, ChATrayNote, ChATrayPick, ChATrayRow } from './chAViews';
import { GA_GAME_CHOICES, GA_GENRES, GA_GENRES_TO_OPEN, gaGenre, type GaGenreId } from './data/gaGenres';
import { G04 } from './guides/p04';
import { facingKey, useSince } from './shared';

const ASSETS = ['gen_hum', 'gen_air', 'fountain'] as const;
const TERMS = gaTerms('Audio listener', 'Listener position', 'Listener orientation', 'Split-screen audio');

/** Where the generator sits, left to right, for whoever is listening now:
 *  the model's own stereo pan, in words and a number (never color alone). */
function genPan(s: GaState): { v: string; a11y: string } {
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
function ListenerTray() {
  const s = useGa();
  const gen = s.machines.find((m) => m.id === 'generator-1');
  const on = !!gen?.on;
  return (
    <ChATray>
      <ChATrayRow
        head="WHOSE EARS"
        chips={[
          { label: 'YOUR EARS', mark: true, on: s.listenerMode === 'player', onPress: () => gaDispatch({ type: 'listener', mode: 'player' }) },
          { label: 'OVERHEAD CAMERA', mark: true, on: s.listenerMode === 'camera', onPress: () => gaDispatch({ type: 'listener', mode: 'camera' }) },
        ]}
      />
      <ChATrayNote>{LISTENER_NOTE[s.listenerMode]}</ChATrayNote>
      <ChATrayRow head="A SOUND TO LISTEN TO" chips={[{ label: on ? 'GENERATOR 1 · ON' : 'GENERATOR 1 · OFF', on, onPress: () => gaDispatch({ type: 'machine', id: 'generator-1', on: !on }) }]} />
    </ChATray>
  );
}

/** The GAMES tray: the chosen kind's description FIRST, then the twelve
 *  chips, so what the student is asked to read is never under the fold. */
function GamesTray({ genre, onPick }: { genre: GaGenreId | null; onPick: (id: GaGenreId) => void }) {
  const card = gaGenre(genre);
  return (
    <ChATray>
      <ChATrayPick name={card ? card.name.toUpperCase() : 'NO KIND CHOSEN YET'}>{card ? `${card.why} Often first: ${card.emphasis.join(' · ')}.` : 'Pick a kind of game below. Its description appears here.'}</ChATrayPick>
      <ChATrayRow head="TWELVE KINDS OF GAME" chips={GA_GENRES.map((g) => ({ label: g.label, mark: true, on: g.id === genre, onPress: () => onPick(g.id) }))} />
    </ChATray>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const [genre, setGenre] = useState<GaGenreId | null>(null);
  const [opened, setOpened] = useState<readonly GaGenreId[]>([]);
  const card = gaGenre(genre);

  // "the player turned while the camera was the listener": the model counts
  // every turn; this notes which listener was in use when the count rose
  const turns = since('turned');
  const turnsSeen = useRef(turns);
  const turnedUnderCamera = useRef(false);
  if (turns > turnsSeen.current) {
    if (s.listenerMode === 'camera') turnedUnderCamera.current = true;
    turnsSeen.current = turns;
  }

  const goals = [
    { label: 'Open three kinds of game', hit: opened.length >= GA_GENRES_TO_OPEN },
    { label: 'Listen from the overhead camera', hit: since('listener:camera') > 0 },
    { label: 'Turn YOU while the camera listens', hit: turnedUnderCamera.current },
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
    render: () => <ListenerTray />,
  };
  const pickGenre = (next: GaGenreId) => {
    setGenre(next);
    setOpened((was) => (was.includes(next) ? was : [...was, next]));
  };
  // a tray the page draws itself (not an options key): the shared options
  // tray puts a long list's description under its chips, below the fold
  const gamesKey: DockParam = {
    kind: 'group',
    id: 'games',
    label: 'GAMES',
    valueLabel: card?.short ?? 'PICK',
    valueA11y: card ? card.name : 'no kind of game chosen yet',
    render: () => <GamesTray genre={genre} onPick={pickGenre} />,
  };

  return (
    <GaRack
      spec={{
        keys: [facingKey(s), listenerKey, gamesKey],
        initialParam: 'facing',
        readouts: [
          { k: 'LISTENER', v: camera ? 'CAMERA' : 'YOU', vA11y: camera ? 'the overhead camera is listening' : 'you, the player, are listening', flex: 1.2 },
          { k: 'GEN PAN', v: pan.v, vA11y: pan.a11y, flex: 1.2 },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The scene is drawn from above, the way a strategy game shows its map. Until now the listener has been on YOU.</Look>
        <P>Genre, perspective and play mode are three separate choices. A puzzle can be played in first person, and a racing game can be seen from above.</P>
        <ChACard eyebrow="THREE SEPARATE CHOICES" title="GENRE · PERSPECTIVE · PLAY MODE">
          {GA_GAME_CHOICES.map((c) => (
            <ChARow key={c.id} label={`${c.label} — ${c.asks.toUpperCase()}`}>
              {c.examples}
            </ChARow>
          ))}
        </ChACard>
        <P>Each kind of game puts different sounds first. All kinds are built from the same parts.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open GAMES and pick a kind of game. Read its card, then pick two more.</Do>
        {card ? (
          <ChACard eyebrow="KIND OF GAME" title={card.name.toUpperCase()} sub={card.why}>
            <ChARow label="SOUNDS IT OFTEN PUTS FIRST">
              <ChABullets items={card.emphasis} />
            </ChARow>
          </ChACard>
        ) : (
          <ChAEmpty>No kind of game is open yet. The GAMES key is in the dock at the bottom.</ChAEmpty>
        )}
        <P>A card shows a typical emphasis, not a rule. Many games combine several kinds.</P>
      </Step>
      <Step n={3}>
        <P>One thing changes with the perspective: where the game puts its listener.</P>
        <Do>Open LISTENER and switch GENERATOR 1 on. Move FACING to 0°, so YOU face up the picture, and read GEN PAN. Then choose OVERHEAD CAMERA and read it again.</Do>
        <P>For your ears the generator is far to the right. For the camera it sits nearer the center, because the camera is high above the scene. Now move FACING: YOU turn in the picture and GEN PAN stays still. The character is not the listener.</P>
        <P>Level follows the listener too: for the camera, each sound’s level depends on its distance from the middle of the scene, not from YOU. The rings show the level for whoever is listening.</P>
        <Do>Then open LISTENER and choose YOUR EARS. The listener is on YOU again.</Do>
        <P>With more than one player, the team also decides who hears each sound. Players who share one screen share one pair of speakers.</P>
        <Note tone="mistake">Placing every sound on the visible player character in every camera mode. The camera and the listener can be in different places; the team chooses.</Note>
        <ActivityLog state={s} lines={4} />
      </Step>
      <Step n={4}>
        <P>Each listener goal is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You move the listener from the player to the overhead camera. The generator has not moved. Why does its pan change?"
          options={[
            'Direction and distance are measured from the listener, and the listener is now in another place',
            'The generator’s sound file was replaced by an overhead version',
            'In an overhead view every sound plays in the center',
            'Pan follows the visible player character, and the character turned',
          ]}
          correct={0}
          explain="The game measures every sound against the listener. Move the listener and each sound’s direction and distance change, with nothing restarted."
          wrong={[
            undefined,
            'No file changed. The same sound kept playing; only the place it is measured from moved.',
            'Sounds still sit to the left or the right of the camera. They sit less far to the side, because the camera is high above them.',
            'That is the common mistake. The character did not turn, and with the camera listening, turning the character changes nothing.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P04: PageDef = { title: 'Kinds of games', short: 'GAMES', Component: Page, manualDone: true, rack: true, guide: G04 };
