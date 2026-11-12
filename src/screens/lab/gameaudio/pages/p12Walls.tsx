/**
 * Page 12 — WALLS, DOORS AND ROOMS (Chapter 3, Space).
 *
 * With the generator running in the workshop and the learner in the
 * courtyard, the closed door turns the generator down and filters it;
 * opening it brings it back. The treatment is the model's own
 * (gaWorld.OBSTRUCTED: −9 dB and a 900 Hz low-pass), read here through
 * pages/data/chcSpace so the page never states a number the model does not
 * use. ROOM switches the workshop's reverb send (`option` `reverb`) for a
 * dry / reverberant comparison, best heard on a footstep inside the room;
 * the model logs each real change as "SETTING workshop reverb: ON / OFF".
 *
 * Five ideas are kept apart in plain words: a blocked direct path, sound
 * through a wall, reflections, reverberation, bending around a corner.
 *
 * SAID ONCE, HERE: what is heard is an authored treatment (a level change and
 * a filter), not a simulation of how sound passes a wall.
 *
 * Common mistake taught against: presenting a filter switch as real acoustics.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { listenerOf, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { zoneAt } from '../model/gaWorld';
import { GA_ASSETS } from '../sounds/gaSoundBank';
import { ReadCard, TrayChip, onOff, tray } from './chcBits';
import { WALK_Y, WALL_DB, WALL_HZ, chcSpace, walkLine, walkV, walkX } from './data/chcSpace';
import { G12 } from './guides/p12';
import { doorKey, doorWord, useSince } from './shared';

const ASSETS: readonly string[] = ['door', 'door_rattle', 'gen_hum', 'gen_air', 'ir_room', ...GA_ASSETS.filter((a) => a.id.startsWith('fs_')).map((a) => a.id)];
const TERMS = gaTerms('Audio Occlusion', 'Obstruction', 'Reverb zone', 'Acoustic portal');
const STEP_M = 0.7;

/** Walk one step east or west, turning to face that way first. */
function stepAlong(dx: number): void {
  const facing = dx > 0 ? 90 : 270;
  if (gaGet().chars.player.facing !== facing) gaDispatch({ type: 'face', who: 'player', facing });
  gaDispatch({ type: 'step', who: 'player', dx, dy: 0 });
}

/** WALK: your place along the stone path, west to east. The model keeps you
 *  out of the wall and stops you at a closed door, so the lane shows where
 *  you really are, not where the finger asked to go. */
const walkKey = (s: GaState): DockParam => ({
  kind: 'fader',
  id: 'walk',
  label: 'WALK',
  value: walkV(s.chars.player.x),
  onChange: (v) => {
    const p = gaGet().chars.player;
    const x = walkX(v);
    if (x === p.x && p.y === WALK_Y) return;
    const facing = x >= p.x ? 90 : 270;
    if (x !== p.x && p.facing !== facing) gaDispatch({ type: 'face', who: 'player', facing });
    gaDispatch({ type: 'move', who: 'player', x, y: WALK_Y });
  },
  format: () => walkLine(gaGet()),
  formatShort: () => (zoneAt(gaGet().chars.player) === 'room' ? 'INSIDE' : 'OUTSIDE'),
  nudges: [
    { label: '‹ STEP WEST', onPress: () => stepAlong(-STEP_M), a11y: 'Walk one step west, toward the courtyard' },
    { label: 'STEP EAST ›', onPress: () => stepAlong(STEP_M), a11y: 'Walk one step east, toward the workshop' },
  ],
});

/** The ROOM tray: the generator, and the workshop's reverb send. */
function RoomTray() {
  const s = useGa();
  const gen = !!s.machines[0]?.on;
  const reverb = s.options.reverb;
  const setReverb = (on: boolean) => {
    if (gaGet().options.reverb !== on) gaDispatch({ type: 'option', patch: { reverb: on } });
  };
  return (
    <View style={tray.tray}>
      <Text style={tray.head}>THE SOURCE</Text>
      <View style={tray.row}>
        <TrayChip label={onOff('GENERATOR 1', gen)} selected={gen} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gen })} />
      </View>
      <Text style={tray.head}>SOUNDS MADE IN THE WORKSHOP</Text>
      <View style={tray.row}>
        <TrayChip label={marked('REVERB', reverb)} selected={reverb} onPress={() => setReverb(true)} />
        <TrayChip label={marked('DRY', !reverb)} selected={!reverb} onPress={() => setReverb(false)} />
      </View>
      <Text style={tray.note}>{reverb ? 'REVERB: sounds made in the workshop are also sent to a reverb, more strongly when you stand inside.' : 'DRY: nothing is sent to the reverb.'}</Text>
    </View>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const gen = chcSpace(s, 'generator-1');
  const inside = zoneAt(listenerOf(s)) === 'room';
  const goals = [
    { label: 'Hear the generator through the closed door', hit: since('inst:generator') > 0 && gen.playing && !gen.virtual && gen.obstructed },
    { label: 'Open the door while it runs', hit: since('doorOpened') > 0 && gen.playing && !gen.virtual && s.doorOpen },
    { label: 'Walk into the workshop', hit: since('zoneCross') > 0 && inside },
    { label: 'Switch ROOM to DRY and back to REVERB', hit: since('option:reverb:false') > 0 && since('option:reverb:true') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const roomKey: DockParam = {
    kind: 'group',
    id: 'room',
    label: 'ROOM',
    valueLabel: s.options.reverb ? 'REVERB' : 'DRY',
    valueA11y: `workshop sounds are ${s.options.reverb ? 'sent to the reverb' : 'dry'}; the generator is ${gen.playing ? 'running' : 'off'}`,
    render: () => <RoomTray />,
  };
  const genWord = !gen.playing ? 'OFF' : gen.virtual ? 'VIRTUAL' : gen.obstructed ? 'MUFFLED' : 'CLEAR';

  return (
    <GaRack
      spec={{
        keys: [walkKey(s), doorKey(s), roomKey],
        initialParam: 'walk',
        readouts: [
          { k: 'DOOR', v: doorWord(s) },
          { k: 'GEN 1', v: genWord, vA11y: `the generator is ${genWord.toLowerCase()}` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>One wall with one door stands between the courtyard and the workshop, where the generator is. Its rings turn bluer when its sound reaches you fainter.</Look>
        <P>Five different things can happen between a source and you. The direct path can be blocked. Sound can pass through a wall. It can reflect from surfaces. Many reflections together make reverberation. And sound bends around a corner or through a doorway.</P>
        <P>Tools often call a blocked straight path in the same space obstruction: the direct sound is muffled and the echoes still arrive. They call a source behind a wall occlusion: the whole sound is lower and duller. The closed door in this scene is an occlusion treatment.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open ROOM and switch GENERATOR 1 on. Stand in the courtyard: drag WALK if you are inside. Press the door key several times.</Do>
        <P>
          Closed, the door turns the generator down by {Math.abs(WALL_DB)} dB, and a filter cuts the sound above about {WALL_HZ} Hz, so its high part is missing. Open, both changes are gone.
        </P>
        <ReadCard
          title="THE GENERATOR, FROM WHERE YOU ARE"
          rows={[
            { k: 'STATE', v: !gen.playing ? 'Not switched on' : gen.virtual ? 'VIRTUAL: tracked, not played' : 'Playing' },
            { k: 'DOOR', v: s.doorOpen ? 'Open' : 'Closed' },
            { k: 'LEVEL CHANGE', v: gen.obstructed ? `${Math.abs(WALL_DB)} dB lower` : 'None' },
            { k: 'FILTER', v: gen.obstructed ? `Cuts above about ${WALL_HZ} Hz` : 'None' },
            { k: 'WORKSHOP REVERB', v: s.options.reverb ? (inside ? 'On, and you are inside' : 'On, heard from outside') : 'Off (dry)' },
          ]}
        />
        <ActivityLog state={s} lines={4} />
      </Step>
      <Step n={3}>
        <Do>Open the door and drag WALK into the workshop. Press a STEP key under the slider. Then open ROOM and compare REVERB with DRY.</Do>
        <P>With REVERB on, sounds made in the workshop are also sent to a reverb, so a footstep is followed by a short tail of room sound. DRY removes that, and the log prints the SETTING.</P>
        <Note>What you hear is an authored treatment, not a simulation of how sound passes a wall. Games often change what is realistic so the player can understand the scene.</Note>
        <Note tone="mistake">Believing a muffled sound behind a wall is calculated acoustics. Often it is a level change and a filter that a designer chose.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You stand in the courtyard. The generator runs in the workshop, and the door closes. What does this scene do to the generator’s sound?"
          options={[
            'Lowers its level and filters out its high part: a treatment a designer chose',
            'Calculates how the sound passes through the wall material',
            'Stops the generator until the door opens again',
            'Adds more reverb to it',
          ]}
          correct={0}
          explain={`The scene applies two authored changes: ${Math.abs(WALL_DB)} dB less level, and a filter above about ${WALL_HZ} Hz. That suggests a wall well enough for the player to understand the scene. Nothing is calculated from the wall itself.`}
          wrong={[
            undefined,
            'Nothing here knows what the wall is made of. Simulating that is a much larger job, and many games do not need it.',
            'The generator keeps playing: the log shows no stop for it.',
            'Reverb belongs to the ROOM setting. The door changes level and tone, not the reverb.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P12: PageDef = { title: 'Walls, doors and rooms', short: 'WALLS', Component: Page, manualDone: true, rack: true, guide: G12 };
