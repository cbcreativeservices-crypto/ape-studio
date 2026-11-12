/**
 * Page 19 — TESTING AND FAULT FINDING (plan page 19; handoff lesson 18).
 *
 * Testing in context, in situations that can be repeated, with the log
 * open. The bench plants FIVE faults, each one wrong setting (a missing
 * file, a wrong bus, an excessive repeat, a wrong scope, an orphan loop).
 * Each has its own card; TEST holds the actions that reproduce a symptom
 * (with two places to stand, so the scope fault can be shown from anywhere)
 * and FIX holds the five settings.
 *
 * The bench is data/gaFaults: a fault counts as fixed only when it was
 * planted on this page (every page opens on a clean scene, so no fault
 * arrives from elsewhere), its symptom really happened (the reducer's
 * facts, compared across two states), and its setting is right again — so
 * nobody fixes a fault by pressing two buttons without looking.
 *
 * Common mistake taught against: declaring success because the picture
 * changed.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Caption, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { Tray, TrayChip, TrayGrid, TrayLast, onOff, useWatch } from './chdKit';
import { FAULTS, FAULT_IDS, benchAdvance, benchStart, faultActions, faultFixed, faultOpen, faultSet, faultsOpen, fixChoices, settingsWrong, standMoves, standingOn, type FaultId, type StandId } from './data/gaFaults';
import { G19 } from './guides/p19';

const ASSETS = ['door', 'door_rattle', 'gen_hum', 'gen_air', 'vo_greeting', 'vo_greeting_long', 'fs_wood_1', 'fs_wood_2', 'fs_wood_3', 'fs_wood_4', 'fs_stone_1', 'fs_stone_2', 'fs_stone_3', 'fs_stone_4', 'fs_gravel_1', 'fs_gravel_2', 'fs_gravel_3', 'fs_gravel_4'] as const;
const TERMS = gaTerms('Audio profiling', 'Quality assurance', 'Audio asset', 'Playback instance');

const setFault = (id: FaultId, on: boolean): void => {
  for (const a of faultActions(id, on)) gaDispatch(a);
};

/** TEST tray: the actions that reproduce each symptom, and two places for
 *  YOU to stand (the wrong-surface fault needs you off the wood floor). */
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
  return (
    <Tray>
      <TrayGrid head="DOOR · VOICE · FOOTSTEPS" cols={4}>
        <TrayChip
          label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'}
          onPress={() => {
            setBlocked(false);
            gaDispatch({ type: 'door' });
          }}
        />
        <TrayChip label="GUIDE LINE" selected={gaPlaying(s, 'vo_greeting')} onPress={() => gaDispatch({ type: 'post', event: 'vo_greeting', owner: 'guide' })} />
        <TrayChip label="STEP · GUIDE" onPress={() => gaDispatch({ type: 'step', who: 'guide' })} />
        <TrayChip label="STEP · YOU" onPress={() => gaDispatch({ type: 'step', who: 'player' })} />
      </TrayGrid>
      <TrayGrid head={blocked ? 'THE DOOR IS CLOSED: PRESS OPEN DOOR, THEN CHOOSE AGAIN' : 'WHERE YOU STAND'} cols={2}>
        <TrayChip label={marked('STONE PATH', here === 'path')} selected={here === 'path'} onPress={() => stand('path')} />
        <TrayChip label={marked('WORKSHOP', here === 'workshop')} selected={here === 'workshop'} onPress={() => stand('workshop')} />
      </TrayGrid>
      <TrayGrid head="GENERATORS" cols={3}>
        <TrayChip label={onOff('GENERATOR 1', !!m1?.on)} selected={!!m1?.on} onPress={() => gaDispatch({ type: 'machine', id: 'generator-1', on: !gaGet().machines.find((m) => m.id === 'generator-1')?.on })} />
        {m2 ? <TrayChip label={onOff('GENERATOR 2', m2.on)} selected={m2.on} onPress={() => gaDispatch({ type: 'machine', id: 'generator-2', on: !gaGet().machines.find((m) => m.id === 'generator-2')?.on })} /> : null}
        {m2 ? <TrayChip label="REMOVE GENERATOR 2" onPress={() => gaDispatch({ type: 'removeMachine', id: 'generator-2' })} /> : <TrayChip label="ADD GENERATOR 2" onPress={() => gaDispatch({ type: 'addMachine' })} />}
      </TrayGrid>
      <TrayLast lines={2} caption />
    </Tray>
  );
}

/** FIX tray: the five settings, one row each: its name, then its two
 *  values. The value that is in now carries the filled mark. */
function FixTray() {
  const s = useGa();
  return (
    <Tray>
      {FAULTS.map((f) => {
        const wrongNow = faultSet(f.id, s);
        return (
          <View key={f.id} style={styles.fixRow}>
            <Text style={styles.fixName}>{f.setting}</Text>
            {fixChoices(f).map((c) => {
              const current = c.right !== wrongNow;
              return (
                <View key={c.label} style={styles.fixHalf}>
                  <TrayChip
                    label={`${current ? '●' : '○'} ${c.label}`}
                    a11y={`${f.setting}: ${c.label}, ${current ? 'chosen now' : 'not chosen'}`}
                    selected={current}
                    onPress={() => {
                      if (!current) setFault(f.id, !c.right);
                    }}
                  />
                </View>
              );
            })}
          </View>
        );
      })}
    </Tray>
  );
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const bench = useWatch(s, benchStart, benchAdvance);
  const [check, setCheck] = useState(false);

  const goals = [...FAULTS.map((f) => ({ label: f.goal, hit: faultFixed(f.id, bench, s) })), { label: 'Pass the check', hit: check }];
  const latched = useVisitGoals(ctx, goals);
  const open = faultsOpen(bench, s);
  const fixed = latched.slice(0, FAULTS.length).filter(Boolean).length;
  const wrong = settingsWrong(s);
  const firstOpen = FAULT_IDS.find((id) => faultOpen(id, bench, s));

  const testKey: DockParam = { kind: 'group', id: 'test', label: 'TEST', valueLabel: 'ACTIONS', valueA11y: 'the actions that reproduce each symptom', render: () => <TestTray /> };
  const fixKey: DockParam = {
    kind: 'group',
    id: 'fix',
    label: 'FIX',
    valueLabel: wrong ? `${wrong} WRONG` : 'ALL OK',
    valueA11y: wrong ? `${wrong} of the settings are wrong now` : 'every setting is right now',
    render: () => <FixTray />,
  };

  return (
    <GaRack
      spec={{
        keys: [testKey, fixKey, masterKey(s)],
        initialParam: 'master',
        readouts: [
          { k: 'FAULTS', v: String(open), vA11y: `${open} faults are in the scene now` },
          { k: 'FIXED', v: String(fixed), vA11y: `${fixed} faults fixed on this visit` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The scene is now a test room. Five of its settings can be wrong, and the picture alone does not show which.</Look>
        <P>A sound can be good by itself and still fail in the game: triggered at the wrong moment, sent to the wrong bus, or left playing. So game audio is tested in context, in situations you can repeat exactly, with the log open. Watching the audio engine while the game runs is audio profiling.</P>
        <P>A full test also covers pause and resume, leaving a scene and returning, quiet and busy moments, and each kind of output: phone speaker, headphones, loudspeakers.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open TEST and try each action while nothing is wrong. Read the log after each one.</Do>
        <P>An action that works leaves a pattern. A door press or a step prints two GAME lines, the trigger and then the event. START lines follow, and each ends with the bus the sound went to. A fault is a place where this pattern breaks.</P>
        <ActivityLog state={s} lines={5} />
      </Step>
      <Step n={3}>
        <Do>Start fault 1 on its card in step 4. Repeat the action, read the log, compare it with the picture, and only then open FIX.</Do>
        <P>Each fault is one wrong setting. It counts as fixed after you have seen its symptom and put the setting right: finding comes before fixing. After a fix, run the same action again and read the log.</P>
        <Note tone="mistake">Declaring success because the picture changed. An animation shows that the game acted. A START line shows that the audio side started it. Your ears confirm it reached you.</Note>
      </Step>
      <Step n={4}>
        <P>Work through the five faults in order. The log appears under the first fault that is still in.</P>
        <GoalChips goals={goals} latched={latched} />
        {FAULTS.map((f) => (
          <FaultRow key={f.id} id={f.id} open={faultOpen(f.id, bench, s)} fixed={faultFixed(f.id, bench, s)} showLog={firstOpen === f.id} />
        ))}
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="In a game, a door swings open and you hear nothing. What is the most useful first step?"
          options={[
            'Read the log: was the event posted, did a START follow, and on which bus?',
            'Raise the master level',
            'Replace the door sound with a louder one',
            'Accept it: the door opened, so the sound played',
          ]}
          correct={0}
          explain="The log separates the possible causes. No GAME line: the trigger failed. A FAULT line: the file is missing. A START on the wrong bus: the routing is wrong. Each has a different repair."
          wrong={[
            undefined,
            'If nothing started, there is nothing to make louder. First find out whether a sound started at all.',
            'The sound itself may be fine. A missing file, a wrong bus or a missed trigger would silence any sound.',
            'The animation and the sound are separate things. One can run without the other.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

/** One fault's card, with the log under it while it is the one to work on. */
function FaultRow({ id, open, fixed, showLog }: { id: FaultId; open: boolean; fixed: boolean; showLog: boolean }) {
  const s = useGa();
  const f = FAULTS.find((x) => x.id === id);
  if (!f) return null;
  return (
    <>
      <FaultCard title={f.title} symptom={f.symptom} armed={open} fixed={fixed} onStart={() => setFault(id, true)} hints={f.hints} why={f.why} />
      {open && showLog ? (
        <>
          {id === 'wrongBus' ? <Caption state={s} /> : null}
          <ActivityLog state={s} lines={4} />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  fixRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fixName: { flex: 0.8, color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.8 },
  fixHalf: { flex: 1 },
});

export const P19: PageDef = { title: 'Testing and fault finding', short: 'TESTING', Component: Page, manualDone: true, rack: true, guide: G19 };
