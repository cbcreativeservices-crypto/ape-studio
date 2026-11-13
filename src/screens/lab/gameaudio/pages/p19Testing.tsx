/**
 * Page 19 — TESTING AND FAULT FINDING (plan page 19; handoff lesson 18).
 *
 * Testing in context, in situations that can be repeated, with the log
 * open. The bench plants FIVE faults, each one wrong setting (a missing
 * file, a wrong bus, an excessive repeat, a wrong scope, an orphan loop).
 * TEST holds the actions that reproduce a symptom (with two places to
 * stand, so the scope fault can be shown from anywhere) and FIX holds the
 * five settings.
 *
 * ONE CARD AT A TIME (walk audit W2-19): step 4 shows the card of the fault
 * the learner has chosen (five chips, each with its status mark), with the
 * log under it, not five cards and a long scroll under an open tray.
 *
 * THE TRAYS FIT (chdKit, W2-03): TEST is three rows of chips with no log
 * strip; FIX first chooses ONE setting, then shows that setting's two
 * values, so all five settings are reachable above the fold.
 *
 * The bench is data/gaFaults: a fault counts as fixed only when it was
 * planted on this page (every page opens on a clean scene, so no fault
 * arrives from elsewhere), its symptom really happened (the reducer's
 * facts, compared across two states), and its setting is correct again —
 * so nobody fixes a fault by pressing two buttons without looking.
 *
 * Common mistake taught against: declaring success because the picture
 * changed.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import type { GaHudId } from '../scene/hud';
import { gaCount } from '../bitsLogic';
import { ActivityLog, Caption, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { Tray, TrayChip, TrayGrid, TrayNote, onOff, speaking, useWatch } from './chdKit';
import { FAULTS, FAULT_IDS, FAULT_STATUS_MARK, FAULT_STATUS_WORD, benchAdvance, benchStart, faultActions, faultDef, faultFixed, faultOpen, faultSet, faultStatus, faultsOpen, fixChoices, nextFault, settingsWrong, standMoves, standingOn, stepInPlace, type Bench, type FaultId, type StandId } from './data/gaFaults';
import { G19 } from './guides/p19';

const ASSETS = ['door', 'door_rattle', 'gen_hum', 'gen_air', 'vo_greeting', 'vo_greeting_long', 'fs_wood_1', 'fs_wood_2', 'fs_wood_3', 'fs_wood_4', 'fs_stone_1', 'fs_stone_2', 'fs_stone_3', 'fs_stone_4', 'fs_gravel_1', 'fs_gravel_2', 'fs_gravel_3', 'fs_gravel_4'] as const;
const TERMS = gaTerms('Audio profiling', 'Quality assurance', 'Audio asset', 'Playback instance');

/** The strip under the picture follows the fault whose card is on screen:
 *  the one thing that shows THAT fault's symptom (lead's decision 1).
 *    missing file   chain   the event asks for a file, the file is missing
 *    wrong bus      mix     the guide speaks and no bus is ducked
 *    one take       takes   the same take, step after step
 *    scope          sync    the guide's own surface switch shows YOUR surface
 *    orphan loop    voices  the loop still holds its voices with no owner */
const FAULT_HUD: Readonly<Record<FaultId, GaHudId>> = { missingFile: 'chain', wrongBus: 'mix', repeat: 'takes', scope: 'sync', orphan: 'voices' };

const setFault = (id: FaultId, on: boolean): void => {
  for (const a of faultActions(id, on)) gaDispatch(a);
};

/** TEST tray: the actions that reproduce each symptom, two places for YOU
 *  to stand (the wrong-surface fault needs you off the wood floor), and the
 *  generators. ALWAYS three rows, no log strip (chdKit: designed for 200
 *  points; the readouts, the strip and the log in step 4 say what a press
 *  did). The rows never change in number: when the tray grew a row for
 *  GENERATOR 2 every chip moved up under the finger, and a second tap on
 *  ADD GENERATOR 2 landed on REMOVE GENERATOR 2 (seen at 390 x 844). ADD
 *  turns into GENERATOR 2 in its own place. The STEP chips step in place, so they can be pressed
 *  as often as a test needs (data/gaFaults `stepInPlace`). */
function TestTray() {
  const s = useGa();
  const [blocked, setBlocked] = useState(false);
  const m1 = s.machines.find((m) => m.id === 'generator-1');
  const m2 = s.machines.find((m) => m.id === 'generator-2');
  const here = standingOn(s);
  const stand = (to: StandId) => {
    const now = gaGet();
    const r = standMoves(now.chars.player, now.doorOpen, to);
    for (const a of r.moves) gaDispatch(a);
    setBlocked(r.blocked);
  };
  const toggle = (id: string) => gaDispatch({ type: 'machine', id, on: !gaGet().machines.find((m) => m.id === id)?.on });
  return (
    <Tray>
      <TrayGrid cols={4}>
        <TrayChip
          label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'}
          onPress={() => {
            setBlocked(false);
            gaDispatch({ type: 'door' });
          }}
        />
        <TrayChip label={speaking('GUIDE LINE', gaPlaying(s, 'vo_greeting'))} selected={gaPlaying(s, 'vo_greeting')} onPress={() => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' })} />
        <TrayChip label="STEP: GUIDE" onPress={() => gaDispatch(stepInPlace('guide'))} />
        <TrayChip label="STEP: YOU" onPress={() => gaDispatch(stepInPlace('player'))} />
      </TrayGrid>
      <TrayGrid head={blocked ? 'THE DOOR IS CLOSED: OPEN IT, THEN CHOOSE AGAIN' : 'WHERE YOU STAND'} cols={2}>
        <TrayChip label={marked('YOU: STONE PATH', here === 'path')} selected={here === 'path'} onPress={() => stand('path')} />
        <TrayChip label={marked('YOU: WORKSHOP', here === 'workshop')} selected={here === 'workshop'} onPress={() => stand('workshop')} />
      </TrayGrid>
      <TrayGrid cols={3}>
        <TrayChip label={onOff('GENERATOR 1', !!m1?.on)} selected={!!m1?.on} onPress={() => toggle('generator-1')} />
        {m2 ? <TrayChip label={onOff('GENERATOR 2', m2.on)} selected={m2.on} onPress={() => toggle('generator-2')} /> : <TrayChip label="ADD GENERATOR 2" onPress={() => gaDispatch({ type: 'addMachine' })} />}
        {m2 ? <TrayChip label="REMOVE GENERATOR 2" onPress={() => gaDispatch({ type: 'removeMachine', id: 'generator-2' })} /> : <TrayNote>No second generator yet.</TrayNote>}
      </TrayGrid>
    </Tray>
  );
}

/** FIX tray: first choose ONE of the five settings (a row of five chips),
 *  then its two values, with the filled mark on the value that is in now.
 *  Two rows, so all five settings are above the fold (W2-03: five rows of
 *  values were 256 points in a 220-point tray). It opens on the setting of
 *  the fault whose card is on screen. The chips name settings, not faults:
 *  nothing here says which value is wrong. */
function FixTray({ start }: { start: FaultId }) {
  const s = useGa();
  const [pick, setPick] = useState<FaultId>(start);
  const f = faultDef(pick);
  const wrongNow = faultSet(f.id, s);
  return (
    <Tray>
      <TrayGrid cols={5}>
        {FAULTS.map((x) => (
          <TrayChip key={x.id} label={marked(x.pick, x.id === pick)} a11y={`Show the setting ${x.setting}`} selected={x.id === pick} onPress={() => setPick(x.id)} />
        ))}
      </TrayGrid>
      <TrayGrid head={f.setting} cols={2}>
        {fixChoices(f).map((c) => {
          const current = c.right !== wrongNow;
          return (
            <TrayChip
              key={c.label}
              label={`${current ? '●' : '○'} ${c.label}`}
              a11y={`${f.setting}: ${c.label}, ${current ? 'chosen now' : 'not chosen'}`}
              selected={current}
              onPress={() => {
                if (!current) setFault(f.id, !c.right);
              }}
            />
          );
        })}
      </TrayGrid>
    </Tray>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const bench = useWatch(s, benchStart, benchAdvance);
  const [check, setCheck] = useState(false);
  /** The fault whose card step 4 shows (and FIX opens on). */
  const [focus, setFocus] = useState<FaultId>(FAULT_IDS[0]);

  const goals = [...FAULTS.map((f) => ({ label: f.goal, hit: faultFixed(f.id, bench, s) })), { label: 'Pass the check', hit: check }];
  const latched = useVisitGoals(ctx, goals);
  const open = faultsOpen(bench, s);
  const fixed = latched.slice(0, FAULTS.length).filter(Boolean).length;
  const wrong = settingsWrong(s);

  const testKey: DockParam = { kind: 'group', id: 'test', label: 'TEST', valueLabel: 'ACTIONS', valueA11y: 'the actions that reproduce each symptom', render: () => <TestTray /> };
  const fixKey: DockParam = {
    kind: 'group',
    id: 'fix',
    label: 'FIX',
    valueLabel: wrong ? `${wrong} WRONG` : 'ALL OK',
    valueA11y: wrong ? `${gaCount(wrong, 'setting is', 'settings are')} wrong now` : 'every setting is correct now',
    render: () => <FixTray start={focus} />,
  };

  return (
    <GaRack
      spec={{
        keys: [testKey, fixKey, masterKey(s)],
        initialParam: 'master',
        hud: FAULT_HUD[focus],
        readouts: [
          { k: 'FAULTS', v: String(open), vA11y: `${gaCount(open, 'fault is', 'faults are')} active now` },
          { k: 'FIXED', v: String(fixed), vA11y: `${gaCount(fixed, 'fault')} fixed on this visit` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>Five of this scene’s settings can be wrong, and the picture alone does not show which.</Look>
        <P>A sound can be good by itself and still fail in the game. It can be triggered at the wrong moment, sent to the wrong bus, or left playing. So game audio is tested in context, in situations you can repeat, with the log open. Watching the audio engine while the game runs is audio profiling.</P>
        <P>A full test also covers pause and resume, leaving a scene and returning, and quiet and busy moments. It covers each kind of output: phone speaker, headphones, loudspeakers.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open TEST and try each action while nothing is wrong. Read the log after each one.</Do>
        <P>An action that works leaves a pattern. A door press or a step prints two GAME lines, the trigger and then the event. START lines follow, and each ends with the bus the sound went to. A fault is a place where this pattern breaks.</P>
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>Start fault 1 on its card in step 4. Repeat the action, read the log, compare it with the picture, and only then open FIX.</Do>
        <P>Each fault is one wrong setting. It counts as fixed after you have seen its symptom and corrected the setting: finding comes before fixing. After a fix, run the same action again.</P>
        <Note tone="mistake">Declaring success because the picture changed. An animation shows that the game acted. A START line shows that the audio side started it. Your ears confirm it reached you.</Note>
      </Step>
      <Step n={4}>
        <P>Choose a fault. Its card and the log are below.</P>
        <GoalChips goals={goals} latched={latched} />
        <FaultPicker focus={focus} bench={bench} onPick={setFocus} />
        <FaultRow id={focus} bench={bench} onNext={setFocus} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="In a game, a door swings open and you hear nothing. What is the most useful first step?"
          options={[
            'Read the log: was the event posted, did a START follow?',
            'Raise the master level',
            'Replace the door sound with a louder one',
            'Check that the door’s sound file is in the project folder',
          ]}
          correct={0}
          explain="The log separates the possible causes. No GAME line: the trigger failed. A FAULT line: the file is missing. A START on the wrong bus: the routing is wrong. Each has a different repair."
          wrong={[
            undefined,
            'If nothing started, there is nothing to make louder. First find out whether a sound started at all.',
            'The sound itself may be fine. A missing file, a wrong bus or a missed trigger would silence any sound.',
            'A file in a folder is only an asset. The log shows whether the event asked for it and whether it started.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

/** The five faults as five chips: the number, and its status as a mark
 *  (○ not started, ● active, ✓ fixed) and in words for a screen reader. */
function FaultPicker({ focus, bench, onPick }: { focus: FaultId; bench: Bench; onPick: (id: FaultId) => void }) {
  const s = useGa();
  return (
    <TrayGrid head="FAULT · ○ NOT STARTED · ● ACTIVE · ✓ FIXED" cols={5}>
      {FAULT_IDS.map((id, i) => {
        const st = faultStatus(id, bench, s);
        return <TrayChip key={id} label={`${id === focus ? '▸ ' : ''}${i + 1} ${FAULT_STATUS_MARK[st]}`} a11y={`Fault ${i + 1}: ${FAULT_STATUS_WORD[st]}${id === focus ? ', shown below' : ''}`} selected={id === focus} onPress={() => onPick(id)} />;
      })}
    </TrayGrid>
  );
}

/** The chosen fault's card, with the log under it while the fault is
 *  active, and a way on to the next fault once it is fixed. */
function FaultRow({ id, bench, onNext }: { id: FaultId; bench: Bench; onNext: (id: FaultId) => void }) {
  const s = useGa();
  const f = faultDef(id);
  const open = faultOpen(id, bench, s);
  const fixed = faultFixed(id, bench, s);
  const next = fixed ? nextFault(id, bench, s) : null;
  return (
    <>
      <FaultCard key={id} title={f.title} symptom={f.symptom} armed={open} fixed={fixed} onStart={() => setFault(id, true)} hints={f.hints} why={f.why} />
      {next ? (
        <View style={styles.next}>
          <TrayChip label={`NEXT: FAULT ${FAULT_IDS.indexOf(next) + 1} ›`} onPress={() => onNext(next)} />
        </View>
      ) : null}
      {open ? (
        <>
          {id === 'wrongBus' ? <Caption state={s} /> : null}
          <ActivityLog state={s} lines={4} />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  next: { alignSelf: 'flex-start', minWidth: 160 },
});

export const P19: PageDef = { title: 'Testing and fault finding', short: 'TESTING', Component: Page, manualDone: true, rack: true, guide: G19 };
