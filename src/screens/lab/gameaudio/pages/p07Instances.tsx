/**
 * Page 7 — EVENTS AND INSTANCES.
 *
 * One event, two generators. The learner adds a second generator, starts
 * both, changes the SPEED of one, stops one and removes the second while it
 * runs: each instance is its own, and a loop needs someone to stop it.
 *
 * Three keys: SPEED 1 and SPEED 2 (two lanes side by side, so "one changed,
 * the other did not" is read straight off the dock) and the MACHINES tray
 * (each generator on or off, add, remove, and the rule for what a removal
 * does to a loop — the planted fault `orphanLoop` is that rule set wrong).
 *
 * Common mistake taught against: changing every machine because all copies
 * share one value.
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
import { TrayBox, TrayChip, TrayNote, TrayRow, onOff, useCountWhen } from './chbBits';
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

/** The MACHINES tray: every switch, add and remove on this page. Three
 *  one-line rows and no log, so it fits a phone without scrolling; the
 *  readouts above it and the page's own log show what a press did. */
function MachinesTray() {
  const s = useGa();
  const m1 = s.machines.find((m) => m.id === G1);
  const m2 = s.machines.find((m) => m.id === G2);
  const orphans = chbOrphans(s).length;
  return (
    <TrayBox>
      <TrayRow head="ONE EVENT, PLAY_GENERATOR, FOR BOTH">
        <TrayChip label={onOff('GENERATOR 1', !!m1?.on)} selected={!!m1?.on} onPress={() => gaDispatch({ type: 'machine', id: G1, on: !m1?.on })} />
        {m2 ? <TrayChip label={onOff('GENERATOR 2', m2.on)} selected={m2.on} onPress={() => gaDispatch({ type: 'machine', id: G2, on: !m2.on })} /> : null}
      </TrayRow>
      <TrayRow head="THE SECOND GENERATOR">
        {m2 ? <TrayChip label="REMOVE GENERATOR 2" onPress={() => gaDispatch({ type: 'removeMachine', id: G2 })} /> : <TrayChip label="ADD GENERATOR 2" onPress={() => gaDispatch({ type: 'addMachine' })} />}
      </TrayRow>
      <TrayRow head="WHEN A GENERATOR IS REMOVED">
        <TrayChip label={marked('STOP ITS LOOP', !s.faults.orphanLoop)} selected={!s.faults.orphanLoop} onPress={() => setOrphanRule(false)} />
        <TrayChip label={marked('LEAVE IT PLAYING', s.faults.orphanLoop)} selected={s.faults.orphanLoop} onPress={() => setOrphanRule(true)} />
      </TrayRow>
      {orphans ? <TrayNote>An instance is playing with no owner. ■ STOP silences it.</TrayNote> : null}
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

  const goals = [
    { label: 'Run two generators from one event', hit: copies >= 2 && since('inst:generator') > 0 },
    { label: 'Give the two instances different speeds', hit: movedOne && copies >= 2 && !!m1 && !!m2 && m1.speed !== m2.speed },
    { label: 'Stop one: the other keeps running', hit: stoppedOne },
    { label: 'Remove generator 2 while it runs', hit: since('cleanRemove') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const machinesKey: DockParam = {
    kind: 'group',
    id: 'machines',
    label: 'MACHINES',
    valueLabel: `${running} ON`,
    valueA11y: `${genA11y(1, m1)}; ${genA11y(2, m2)}`,
    render: () => <MachinesTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [speedKey(s, G1, 'SPEED 1'), speedKey(s, G2, 'SPEED 2'), machinesKey],
        initialParam: `speed-${G1}`,
        readouts: [
          { k: 'GEN 1', v: genWord(m1), vA11y: genA11y(1, m1) },
          { k: 'GEN 2', v: genWord(m2), vA11y: genA11y(2, m2) },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>You place a second generator below the first. Each one is an emitter: a place in the scene that a sound comes from.</Look>
        <P>An event is a definition. Each time the game posts it for an object, the audio side makes one playing instance for that object. Two generators give two instances of one event, and each instance keeps its own values.</P>
        <P>A one-shot, such as the door, ends by itself. A loop, such as the generator, plays until something stops it. Starting, stopping with a fade, and releasing the voices are different operations. Tools arrange these parts in different ways.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open MACHINES. Choose ADD GENERATOR 2, then switch GENERATOR 1 and GENERATOR 2 on.</Do>
        <P>The log shows the same event name twice, each time with its own START lines. PLAYING counts instances: each start adds 1. VOICES counts the sound files those instances are playing at this moment. Each generator plays a hum and a fan, so two instances use four voices.</P>
        <ActivityLog state={s} lines={6} />
      </Step>
      <Step n={3}>
        <Do>Move SPEED 2 only. In MACHINES, switch GENERATOR 1 off. Do not use ■ STOP in the dock: it stops everything. Then choose REMOVE GENERATOR 2 while it runs.</Do>
        <P>The VALUE line names generator-2 and its instance. Generator 1 keeps its own speed. Switching generator 1 off fades it and releases its voices, and generator 2 keeps running. Removing generator 2 also stops and releases its instance: a loop does not end by itself.</P>
        <Note tone="mistake">Changing every machine because all copies share one value. A speed that belongs to one machine is stored on that machine’s instance, not on the event.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Two generators run from the same event. The game raises the speed of generator 2. What changes?"
          options={[
            'Only the instance that belongs to generator 2',
            'Both instances, because they share one event',
            'Nothing, until generator 2 is started again',
            'A third instance starts at the new speed',
          ]}
          correct={0}
          explain="The event is shared, but each instance has its own values. The speed is set on generator 2’s instance, so generator 1 does not change."
          wrong={[
            undefined,
            'The event is only the definition. Ask where a value is stored.',
            'A parameter changes an instance while it plays. Nothing has to start again.',
            'A value change starts nothing new, so PLAYING does not change.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
      <FaultCard
        title="THE LOOP WITH NO OWNER"
        symptom="Start the fault. Add generator 2, switch it on, then remove it. The generator leaves the picture, but its hum is still there, and no control for it exists any more."
        // still "in" after the rule is put right, while the orphan loop plays on
        armed={s.faults.orphanLoop || (since('orphan') > 0 && orphans > 0)}
        fixed={since('orphan') > 0 && !s.faults.orphanLoop && orphans === 0}
        onStart={() => setOrphanRule(true)}
        hints={[
          'Watch PLAYING in the readouts when you remove generator 2. It does not go down.',
          'The FAULT line in the log says ORPHAN and gives an instance. No object owns that instance now.',
          '■ STOP silences it. Then open MACHINES and read the rule under WHEN A GENERATOR IS REMOVED.',
        ]}
        why="The loop was started for an object. When the object was removed, nothing told its instance to stop, so the sound played on with no owner. Stopping an object’s sounds is part of removing the object."
      />
    </GaRack>
  );
}

export const P07: PageDef = { title: 'Events and instances', short: 'INSTANCES', Component: Page, manualDone: true, rack: true, guide: G07 };
