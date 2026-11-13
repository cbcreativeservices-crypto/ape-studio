/**
 * Page 7 — EVENTS AND INSTANCES.
 *
 * One event, two generators. The learner adds a second generator, starts
 * both, changes the SPEED of one, stops one and removes the second while it
 * runs: each instance is its own, and a loop needs someone to stop it.
 *
 * WHERE THE SPEED LIVES (lead's decision 6, accuracy audit A4): in this
 * model the value is kept on the generator, the game object (GaMachine.speed:
 * a speed set while nothing plays is kept, and a new instance starts at it),
 * and the playing instance on that object follows it. The text says so, and
 * says once that real tools differ on exactly this.
 *
 * Three keys: SPEED 1 and SPEED 2 (two lanes side by side, so "one changed,
 * the other did not" is read straight off the dock) and the GENERATORS tray
 * (each generator on or off, add, remove, and the rule for what a removal
 * does to a loop: the planted fault `orphanLoop` is that rule set wrong).
 * The word "machine" is kept for a player's computer (page 18); here the
 * objects are always generators.
 *
 * Common mistake taught against: keeping one value for every copy, so all
 * the generators change together.
 */
import { useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaCopies, type GaMachine } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { TrayBox, TrayChip, TrayRow, onOff, useCountWhen } from './chbBits';
import { chbOrphans } from './data/chbScene';
import { G07 } from './guides/p07';
import { gaFact, pct, speedKey, useSince } from './shared';

const ASSETS = ['gen_hum', 'gen_air'] as const;
const TERMS = gaTerms('Audio event (game)', 'Playback instance', 'Audio Emitter', 'One-shot asset');
const G1 = 'generator-1';
const G2 = 'generator-2';

const setOrphanRule = (on: boolean) => {
  if (gaGet().faults.orphanLoop !== on) gaDispatch({ type: 'fault', patch: { orphanLoop: on } });
};

/** The GENERATORS tray: every switch, add and remove on this page, in two
 *  rows and nothing else (the tray's room on a phone is 196 pt: lead's
 *  decision 15). With generator 2 in the scene the first row takes two
 *  lines: about 188 pt in all. No note says that an instance has lost its
 *  owner: that is the planted fault's symptom, read from PLAYING and the
 *  log (lead's decision 10). */
function GeneratorsTray() {
  const s = useGa();
  const m1 = s.machines.find((m) => m.id === G1);
  const m2 = s.machines.find((m) => m.id === G2);
  return (
    <TrayBox>
      <TrayRow head="ONE EVENT, PLAY_GENERATOR, FOR BOTH">
        <TrayChip label={onOff('GENERATOR 1', !!m1?.on)} selected={!!m1?.on} onPress={() => gaDispatch({ type: 'machine', id: G1, on: !m1?.on })} />
        {m2 ? <TrayChip label={onOff('GENERATOR 2', m2.on)} selected={m2.on} onPress={() => gaDispatch({ type: 'machine', id: G2, on: !m2.on })} /> : null}
        {m2 ? <TrayChip label="REMOVE GENERATOR 2" onPress={() => gaDispatch({ type: 'removeMachine', id: G2 })} /> : <TrayChip label="ADD GENERATOR 2" onPress={() => gaDispatch({ type: 'addMachine' })} />}
      </TrayRow>
      <TrayRow head="WHEN A GENERATOR IS REMOVED">
        <TrayChip label={marked('STOP ITS LOOP', !s.faults.orphanLoop)} selected={!s.faults.orphanLoop} onPress={() => setOrphanRule(false)} />
        <TrayChip label={marked('LEAVE IT PLAYING', s.faults.orphanLoop)} selected={s.faults.orphanLoop} onPress={() => setOrphanRule(true)} />
      </TrayRow>
    </TrayBox>
  );
}

const genWord = (m: GaMachine | undefined): string => (!m ? 'NONE' : m.on ? `ON ${pct(m.speed)}` : 'OFF');
const genA11y = (n: number, m: GaMachine | undefined): string => `generator ${n} ${!m ? 'is not in the scene' : m.on ? `is running at speed ${pct(m.speed)}` : 'is stopped'}`;

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [check, setCheck] = useState(false);
  const m1 = s.machines.find((m) => m.id === G1);
  const m2 = s.machines.find((m) => m.id === G2);
  const copies = gaCopies(s, 'generator');
  const running = s.machines.filter((m) => m.on).length;
  const orphans = chbOrphans(s).length;

  // a speed moved on a PLAYING instance while two instances were playing
  const movedOne = useCountWhen(gaFact(s, `speed:${G1}`) + gaFact(s, `speed:${G2}`), copies >= 2) > 0;
  // a generator was stopped and an instance was still playing afterwards
  const stoppedOne = useCountWhen(gaFact(s, 'machineStopped'), copies >= 1) > 0;

  // the planted fault's symptom happened on this visit: a removal left a loop with no owner
  const orphanSeen = since('orphan') > 0;
  // the card is active while the rule is wrong, and afterward while the orphan loop still plays
  const faultArmed = s.faults.orphanLoop || (orphanSeen && orphans > 0);

  const goals = [
    { label: 'Run two generators from one event', hit: copies >= 2 && since('inst:generator') > 0 },
    { label: 'Run the two generators at different speeds', hit: movedOne && copies >= 2 && !!m1 && !!m2 && m1.speed !== m2.speed },
    { label: 'Stop one: the other keeps running', hit: stoppedOne },
    { label: 'Remove generator 2 while it runs', hit: since('cleanRemove') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const generatorsKey: DockParam = {
    kind: 'group',
    id: 'machines',
    label: 'GENERATORS',
    valueLabel: `${running} ON`,
    valueA11y: `${genA11y(1, m1)}; ${genA11y(2, m2)}`,
    render: () => <GeneratorsTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [speedKey(s, G1, 'SPEED 1'), speedKey(s, G2, 'SPEED 2'), generatorsKey],
        initialParam: `speed-${G1}`,
        readouts: [
          { k: 'GEN 1', v: genWord(m1), vA11y: genA11y(1, m1) },
          { k: 'GEN 2', v: genWord(m2), vA11y: genA11y(2, m2) },
        ],
        showNames: true,
        show: { ids: true },
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The workshop has one generator. You will add a second one below it. Each is an emitter: a place a sound comes from.</Look>
        <P>An event is a definition. Each time the game posts it for an object, the audio side makes one playing instance for that object. Two generators give two instances of one event.</P>
        <P>A one-shot, such as the door, ends by itself. A loop plays until something stops it.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open GENERATORS. Choose ADD GENERATOR 2, then switch GENERATOR 1 and GENERATOR 2 on.</Do>
        <P>The log shows the event name twice, each with its START lines. PLAYING counts instances. VOICES counts the sound files playing now. Each generator plays a hum and a fan, so two instances use four voices.</P>
        <ActivityLog state={s} lines={6} />
      </Step>
      <Step n={3}>
        <Do>Move SPEED 2 only. In GENERATORS, switch GENERATOR 1 off. Then choose REMOVE GENERATOR 2 while it runs. Last, start the fault on the TROUBLESHOOT card.</Do>
        <P>The VALUE line names GENERATOR 2 and its instance. Generator 1 keeps its speed. Switching it off fades its instance, and generator 2 runs on. Removing generator 2 stops its instance too: a loop does not end by itself.</P>
        <P>Here the speed is kept on the generator, and its instance follows it. Some tools keep such a value on the object, others on the playing instance. Check which in the tool you use.</P>
        <Note tone="mistake">One speed for every copy, so all generators change together. Each generator’s speed is kept for that generator, not on the event.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
        <FaultCard
          title="THE LOOP WITH NO OWNER"
          symptom="Start the fault. Add generator 2, switch it on, then remove it. The generator leaves the picture, but its instance is still playing, and no control for it exists any more."
          // still active after the rule is corrected, while the orphan loop plays on
          armed={faultArmed}
          fixed={orphanSeen && !s.faults.orphanLoop && orphans === 0}
          seen={orphanSeen}
          onStart={() => setOrphanRule(true)}
          hints={[
            'Watch PLAYING in the readouts when you remove generator 2. It does not go down.',
            'The FAULT line in the log says ORPHAN and gives an instance. No object owns that instance now.',
            '■ STOP silences it. Then open GENERATORS and read the rule under WHEN A GENERATOR IS REMOVED.',
          ]}
          why="The loop was started for an object. When the object was removed, nothing told its instance to stop, so the sound played on with no owner. Stopping an object’s sounds is part of removing the object."
        />
        {faultArmed ? <ActivityLog state={s} lines={4} /> : null}
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="QUESTION"
          question="Two generators run from the same event. The game raises the speed of generator 2. What changes?"
          options={[
            'Only the instance that follows generator 2',
            'Both instances, because they share one event',
            'Nothing, until generator 2 is started again',
            'A third instance starts at the new speed',
          ]}
          correct={0}
          explain="The event is shared, but the speed is kept for each generator. Generator 2’s instance follows the new value, so generator 1 does not change."
          wrong={[
            undefined,
            'The event is only the definition. Ask where a value is stored.',
            'A parameter changes an instance while it plays. Nothing has to start again.',
            'A value change starts nothing new, so PLAYING does not change.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P07: PageDef = { title: 'Events and instances', short: 'INSTANCES', Component: Page, manualDone: true, rack: true, guide: G07 };
