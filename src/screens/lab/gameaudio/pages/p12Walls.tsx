/**
 * Page 12 — WALLS, DOORS AND ROOMS (Chapter 3, Space).
 *
 * With the generator running in the workshop and the learner in the
 * courtyard, the closed door turns the generator down and filters it;
 * opening it brings it back. The treatment is the model's own
 * (gaWorld.OBSTRUCTED: −9 dB and a 900 Hz low-pass, one second-order filter,
 * so 12 dB per octave), read here through pages/data/chcSpace so the page
 * never states a number the model does not use.
 *
 * NO LINE OF SIGHT (accuracy audit A3). The model treats a source on two
 * facts only: listener and source in different rooms, and the door closed.
 * The page says so, and what a real game adds.
 *
 * ROOM switches the workshop's reverb send (`option` `reverb`) for a dry /
 * reverberant comparison, best heard on a footstep inside the room. The
 * reverb is real and quiet; the model logs each change as "SETTING workshop
 * reverb: ON / OFF". With sound off the learner reads the result in the ROOM
 * tray, on the card and in the log. A device that could not load the room
 * reverb says so (model `gaReverbAvailable`), and so does this page.
 *
 * THE CARD NEVER PRINTS A TREATMENT ON A SOUND THAT IS NOT PLAYING (walk
 * audit W2-21): with the generator off, or past its maximum distance at the
 * far west end of the path, the two rows say what the door WOULD do, and a
 * note under them says why (chcSpace `wallRows`).
 *
 * Five ideas are kept apart in plain words: a blocked direct path, sound
 * through a wall, reflections, reverberation, bending through a doorway.
 *
 * SAID ONCE IN THE LESSON, AND ONCE IN THE CHECK: what is heard is an
 * authored treatment (a level change and a filter), not a simulation of how
 * sound passes a wall.
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
import { gaReverbAvailable, listenerOf, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { zoneAt } from '../model/gaWorld';
import { GA_ASSETS } from '../sounds/gaSoundBank';
import { ReadCard, TrayChip, onOff, tray } from './chcBits';
import { WALK_Y, WALL_DB, WALL_FILTER_SLOPE, WALL_HZ, chcSpace, statusWord, walkLine, walkPlace, walkV, walkX, wallRows } from './data/chcSpace';
import { G12 } from './guides/p12';
import { doorKey, doorWord, useSince } from './shared';

const ASSETS: readonly string[] = ['door', 'door_rattle', 'gen_hum', 'gen_air', 'ir_room', ...GA_ASSETS.filter((a) => a.id.startsWith('fs_')).map((a) => a.id)];
const TERMS = gaTerms('Audio Occlusion', 'Obstruction', 'Reverb zone', 'Acoustic portal');
const STEP_M = 0.7;
/** Step 3's paragraph on a device that could not load the room reverb (the
 *  model says so: `gaReverbAvailable`). The page does not pretend. */
const NO_REVERB = 'REVERB would send sounds made in the workshop to a reverb. This device could not load the room reverb, so REVERB and DRY sound the same here. The note in ROOM and the log still show your choice.';

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
  formatShort: () => walkPlace(gaGet()),
  nudges: [
    { label: '‹ STEP WEST', onPress: () => stepAlong(-STEP_M), a11y: 'Walk one step west, toward the courtyard' },
    { label: 'STEP EAST ›', onPress: () => stepAlong(STEP_M), a11y: 'Walk one step east, toward the workshop' },
  ],
});

/** What the ROOM setting does now, in words (the tray covers the card and
 *  the log, so the tray says it too). */
function reverbWord(reverb: boolean, available: boolean, inside: boolean): string {
  if (!reverb) return 'DRY: nothing is sent to the reverb.';
  if (!available) return 'REVERB is chosen, but this device could not load the room reverb.';
  return inside ? 'REVERB: workshop sounds also go to a reverb. You are inside: more is sent.' : 'REVERB: workshop sounds also go to a reverb. You are outside: less is sent.';
}

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
      <Text style={tray.head}>THE SOURCE · WORKSHOP SOUNDS: REVERB OR DRY</Text>
      <View style={tray.row}>
        <TrayChip label={onOff('GENERATOR 1', gen)} selected={gen} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gen })} />
        <TrayChip label={marked('REVERB', reverb)} selected={reverb} onPress={() => setReverb(true)} />
        <TrayChip label={marked('DRY', !reverb)} selected={!reverb} onPress={() => setReverb(false)} />
      </View>
      <Text style={tray.note}>{reverbWord(reverb, gaReverbAvailable(s), zoneAt(listenerOf(s)) === 'room')}</Text>
    </View>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const gen = chcSpace(s, 'generator-1');
  const wall = wallRows(gen);
  const inside = zoneAt(listenerOf(s)) === 'room';
  const reverbOk = gaReverbAvailable(s);
  const goals = [
    { label: 'Run GENERATOR 1 behind the closed door: GEN 1 reads MUFFLED', hit: since('inst:generator') > 0 && wall.sounding && gen.obstructed },
    { label: 'Open the door while it runs: GEN 1 reads CLEAR', hit: since('doorOpened') > 0 && wall.sounding && s.doorOpen },
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
    valueA11y: `workshop sounds are ${s.options.reverb ? (reverbOk ? 'sent to the reverb' : 'set to reverb, which this device cannot play') : 'dry'}; generator 1 is ${gen.playing ? 'running' : 'off'}`,
    render: () => <RoomTray />,
  };
  const genWord = !gen.playing ? 'OFF' : gen.virtual ? 'VIRTUAL' : gen.obstructed ? 'MUFFLED' : 'CLEAR';
  const cardNote = !gen.playing
    ? gen.obstructed
      ? 'GENERATOR 1 is off, so nothing is changed yet. The two rows say what the closed door would do.'
      : undefined
    : gen.virtual
      ? `You are past GENERATOR 1’s maximum distance (${gen.atten.max} m), so it is virtual and nothing plays. Walk east to bring it back.`
      : undefined;

  return (
    <GaRack
      spec={{
        keys: [walkKey(s), doorKey(s), roomKey],
        initialParam: 'walk',
        hud: 'wall',
        readouts: [
          { k: 'DOOR', v: doorWord(s) },
          { k: 'GEN 1', v: genWord, vA11y: `generator 1 is ${genWord.toLowerCase()}` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>A wall with one door stands between the courtyard and the workshop. The strip under the picture shows what the door and the room do to the generator’s sound.</Look>
        <P>Several things can happen between a source and you. A wall can block the direct path. Sound can pass through the wall, reflect from surfaces, or bend through a doorway. Many reflections together make reverberation.</P>
        <P>Tools often call a blocked direct path in one space obstruction: the echoes still arrive. A source behind a wall is occlusion: the whole sound is lower and duller, as with this door.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open ROOM and switch GENERATOR 1 on. Press the door key several times.</Do>
        <P>
          Closed, the door turns the generator down by {Math.abs(WALL_DB)} dB. A low-pass filter at about {WALL_HZ} Hz ({WALL_FILTER_SLOPE}) also turns down its high part. The strip’s curve shows both. Open, both are gone.
        </P>
        <P>This scene tests no line of sight, only a different room and a closed door. A real game also tests the straight line to the source.</P>
        <ReadCard
          title="GENERATOR 1 · FROM WHERE YOU ARE"
          rows={[
            { k: 'STATUS', v: statusWord(gen) },
            { k: 'DOOR', v: s.doorOpen ? 'Open' : 'Closed' },
            { k: 'LEVEL CHANGE', v: wall.level },
            { k: 'FILTER', v: wall.filter },
            { k: 'WORKSHOP REVERB', v: !s.options.reverb ? 'Off (dry)' : !reverbOk ? 'Not available on this device' : inside ? 'On, and you are inside' : 'On, heard from outside' },
          ]}
          note={cardNote}
        />
        <ActivityLog state={s} lines={4} />
      </Step>
      <Step n={3}>
        <Do>Open the door, drag WALK into the workshop and press a STEP key. In ROOM, compare REVERB with DRY.</Do>
        {reverbOk ? <P>REVERB sends sounds made in the workshop to a reverb too. After a footstep, listen for a short, quiet tail of room sound. With SOUND off, watch the strip’s REVERB window: DRY flattens the tail.</P> : <P>{NO_REVERB}</P>}
        <Note tone="mistake">Believing a muffled sound behind a wall is calculated acoustics. A designer chose this level change and filter.</Note>
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
            'Lowers its level and filters it: a designer’s treatment',
            'Calculates how the sound passes through the wall material',
            'Stops the generator until the door is opened once more',
            'Adds more reverb to it, because the room is now closed',
          ]}
          correct={0}
          explain={`The scene applies two authored changes: ${Math.abs(WALL_DB)} dB less level, and a low-pass filter at about ${WALL_HZ} Hz. That suggests a wall well enough for the player to understand the scene. Nothing is calculated from the wall itself.`}
          wrong={[
            undefined,
            'Nothing here knows what the wall is made of. Simulating that is a much larger job, and many games do not need it.',
            'The generator keeps playing: the log shows no stop for it.',
            'Reverb belongs to the ROOM setting. The door changes level and tone. It adds no reverb.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P12: PageDef = { title: 'Walls, doors and rooms', short: 'WALLS', Component: Page, manualDone: true, rack: true, guide: G12 };
