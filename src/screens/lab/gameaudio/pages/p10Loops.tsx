/**
 * Page 10 — LOOPS, AMBIENCE AND ZONES (chapter 2 closes).
 *
 * One-shots and loops; a loop's join; beds and a local emitter; entering and
 * leaving a zone. The learner starts the scene, opens the door, walks from
 * the courtyard into the workshop and reads ONE cross-fade per crossing;
 * swaps the courtyard wind for the cut with no loop preparation and hears
 * the jump at its join; then meets the planted fault `bedPileUp`: every
 * position update starts the bed again and the copies stack.
 *
 * Three keys: FACING (the lane) and STEP walk the player for real, and the
 * SCENE tray holds the scene, the door, two shortcuts for a learner who has
 * walked into a corner, the wind file, and the rule for when a bed starts
 * (the fault is that rule set wrong).
 *
 * Common mistake taught against: starting a new background loop on every
 * update while the player stays in one area.
 */
import { useRef, useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, listenerOf, type GaLogKind } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { zoneAt } from '../model/gaWorld';
import { TrayBox, TrayChip, TrayLog, TrayNote, TrayRow, onOff, useCountWhen } from './chbBits';
import { CHB_FOOTSTEP_ASSETS, chbBeds, chbLoops, chbRoute } from './data/chbScene';
import { G10 } from './guides/p10';
import { facingKey, gaFact, stepKey, useSince } from './shared';

const ASSETS: readonly string[] = ['amb_room', 'amb_yard', 'amb_yard_raw', 'fountain', 'door', 'door_rattle', ...CHB_FOOTSTEP_ASSETS];
const TERMS = gaTerms('Ambience zone', 'Ambient loop', 'Loop Point', 'Crossfade', 'Room Tone');
/** The page's log leaves out the four lines every footstep prints, so a ZONE
 *  line (kind `state`) is still in view after the walk that caused it. The
 *  lesson says so; the tray's own log is complete. */
const PAGE_LOG: readonly GaLogKind[] = ['state', 'mix', 'failed'];

const setRawLoop = (on: boolean) => {
  if (gaGet().options.rawYardLoop !== on) gaDispatch({ type: 'option', patch: { rawYardLoop: on } });
};
const setPileUp = (on: boolean) => {
  if (gaGet().faults.bedPileUp !== on) gaDispatch({ type: 'fault', patch: { bedPileUp: on } });
};

/** The SCENE tray: the background, the door, the wind file, the start rule. */
function SceneTray() {
  const s = useGa();
  const [blocked, setBlocked] = useState(false);
  const beds = chbBeds(s);
  const sceneOn = beds.room + beds.yard > 0 || gaPlaying(s, 'fountain');
  const zone = zoneAt(s.chars.player);
  const goTo = (to: 'stone' | 'workshop') => {
    const now = gaGet();
    const r = chbRoute(now.chars.player, now.doorOpen, to);
    for (const a of r.moves) gaDispatch(a);
    // arrive facing the door, so STEP walks back through it
    if (!r.blocked) gaDispatch({ type: 'face', who: 'player', facing: to === 'workshop' ? 270 : 90 });
    setBlocked(r.blocked);
  };
  return (
    <TrayBox>
      <TrayRow head="SCENE AND DOOR">
        <TrayChip label={onOff('SCENE', sceneOn)} selected={sceneOn} onPress={() => gaDispatch({ type: 'scene', on: !sceneOn })} />
        <TrayChip
          label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'}
          onPress={() => {
            gaDispatch({ type: 'door' });
            setBlocked(false);
          }}
        />
      </TrayRow>
      <TrayRow head="COURTYARD WIND FILE">
        <TrayChip label={marked('PREPARED LOOP', !s.options.rawYardLoop)} selected={!s.options.rawYardLoop} onPress={() => setRawLoop(false)} />
        <TrayChip label={marked('RAW CUT', s.options.rawYardLoop)} selected={s.options.rawYardLoop} onPress={() => setRawLoop(true)} />
      </TrayRow>
      {/* the log sits under the two rows the lesson uses, so it is in view
          on a phone; the fault's rule and the shortcuts follow it */}
      <TrayLog state={s} lines={2} />
      <TrayRow head="A BED STARTS">
        <TrayChip label={marked('ONCE, WITH THE SCENE', !s.faults.bedPileUp)} selected={!s.faults.bedPileUp} onPress={() => setPileUp(false)} />
        <TrayChip label={marked('ON EVERY UPDATE', s.faults.bedPileUp)} selected={s.faults.bedPileUp} onPress={() => setPileUp(true)} />
      </TrayRow>
      <TrayRow head="GO STRAIGHT TO">
        <TrayChip label={marked('COURTYARD', zone === 'yard')} selected={zone === 'yard'} onPress={() => goTo('stone')} />
        <TrayChip label={marked('WORKSHOP', zone === 'room')} selected={zone === 'room'} onPress={() => goTo('workshop')} />
      </TrayRow>
      {blocked && !s.doorOpen ? <TrayNote>The door is closed, so you stopped in front of it. Choose OPEN DOOR, then choose the place again.</TrayNote> : null}
    </TrayBox>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const beds = chbBeds(s);
  const zone = zoneAt(listenerOf(s));
  const sceneOn = beds.room + beds.yard > 0 || gaPlaying(s, 'fountain');
  const loops = chbLoops(s);

  // crossings that really cross-faded the beds (the model's own count)
  const crossings = since('zoneCrossFade');
  // ■ STOP was pressed while loops were playing, and none is left
  const loopsBefore = useRef(loops);
  const silenced = useCountWhen(gaFact(s, 'stopAll'), loopsBefore.current > 0 && loops === 0) > 0;
  loopsBefore.current = loops;

  const goals = [
    { label: 'Cross the doorway twice with the scene running', hit: crossings >= 2 },
    { label: 'Stand in the courtyard while the raw cut plays', hit: since('take:bed_yard::amb_yard_raw') > 0 && beds.raw && zone === 'yard' },
    { label: 'Silence every loop with ■ STOP', hit: silenced },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const sceneKey: DockParam = {
    kind: 'group',
    id: 'scene',
    label: 'SCENE',
    valueLabel: sceneOn ? 'RUNNING' : 'STOPPED',
    valueA11y: `the scene’s background is ${sceneOn ? 'running' : 'stopped'}; the door is ${s.doorOpen ? 'open' : 'closed'}`,
    render: () => <SceneTray />,
  };
  const rawNow = sceneOn ? beds.raw : s.options.rawYardLoop;

  return (
    <GaRack
      spec={{
        keys: [facingKey(s), stepKey('player'), sceneKey],
        initialParam: 'facing',
        readouts: [
          { k: 'ZONE', v: zone === 'room' ? 'ROOM' : 'YARD', vA11y: `the listener is in the ${zone === 'room' ? 'workshop' : 'courtyard'}` },
          { k: 'WIND FILE', v: rawNow ? 'RAW' : 'LOOP', vA11y: rawNow ? 'the courtyard wind is the cut with no loop preparation' : 'the courtyard wind is the prepared loop' },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The courtyard and the workshop are two ambience zones, joined by one door. The fountain is a local emitter: its sound has a place.</Look>
        <P>A one-shot plays once. A loop repeats, so the join where its end meets its start has to be prepared, or you hear a jump on every pass. A bed is a loop with no position: courtyard wind, workshop room tone.</P>
        <P>Both beds start once, with the scene. When the listener enters another zone, one bed fades down while the other fades up: a cross-fade. A fade smooths a change; it does not repair a badly cut loop.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>In SCENE, switch SCENE on and choose OPEN DOOR. Close the tray. Press STEP until you pass the doorway, then find the ZONE line in the log. Set FACING near 270° and walk back.</Do>
        <P>Each crossing prints one ZONE line: one cross-fade of about a second and a half. No bed starts or stops; only their levels change. The log on this page shows only STATE, MIX and FAULT lines.</P>
        <ActivityLog state={s} lines={6} only={PAGE_LOG} />
      </Step>
      <Step n={3}>
        <Do>In the courtyard, choose RAW CUT in SCENE and listen for 30 seconds. Then choose PREPARED LOOP.</Do>
        <P>A MIX line names the swap. The raw cut is a wind file cut with no loop preparation: it ends in a gust and begins in a lull, so the level jumps at the join every 10 seconds. The prepared loop was blended across its join.</P>
        <Note tone="mistake">Starting a new background loop on every position update while the player stays in one area. The copies stack, get louder and use up voices.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You stay inside the workshop and walk around. How many copies of the room tone are playing?"
          options={[
            'One: it started once, with the scene',
            'One for every step you take',
            'One for every position update from the game',
            'None while you move: it starts again when you stand still',
          ]}
          correct={0}
          explain="In this scene both beds start once, with the scene, and a crossing only changes their levels. Many games start a bed when the listener enters its zone. In both designs, moving inside the zone starts nothing."
          wrong={[
            undefined,
            'A step is a trigger for a footstep, not for the bed.',
            'That is the fault on this page: every update starts another copy, and the copies stack.',
            'A bed does not follow your movement inside its zone. It keeps playing.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
      <FaultCard
        title="THE BACKGROUND THAT KEEPS GROWING"
        symptom="Start the fault and switch SCENE on. Take several steps without crossing the doorway. The background becomes louder with each step, and PLAYING and VOICES climb."
        // still "in" after the rule is put right, while the stacked copies play on
        armed={s.faults.bedPileUp || (since('bedPileUp') > 0 && (beds.room > 1 || beds.yard > 1))}
        fixed={since('bedPileUp') > 0 && !s.faults.bedPileUp && beds.room <= 1 && beds.yard <= 1}
        onStart={() => setPileUp(true)}
        hints={[
          'With SCENE on, take several steps without crossing the doorway. Watch PLAYING and VOICES in the readouts.',
          'The FAULT lines in the log say a bed was STARTED AGAIN by a position update, and count the copies.',
          'Open SCENE and change the rule under A BED STARTS. The extra copies are still playing: ■ STOP silences everything, then switch SCENE on again.',
        ]}
        why="The game reported your position many times while you stayed in one zone, and each report started the bed again. A bed needs one start. Here both beds start once, with the scene, and a crossing only changes their levels. A change of rule does not remove copies that are already playing, so they had to be stopped."
      />
    </GaRack>
  );
}

export const P10: PageDef = { title: 'Loops, ambience and zones', short: 'ZONES', Component: Page, manualDone: true, rack: true, guide: G10 };
