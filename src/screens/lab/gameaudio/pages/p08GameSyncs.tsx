/**
 * Page 8 — TRIGGERS, STATES, SWITCHES, PARAMETERS.
 *
 * Four kinds of game information, and the point of the page: LOCAL versus
 * GLOBAL scope. A foot contact is a trigger; the surface under each
 * character is a switch held by that character; the generator's speed is a
 * parameter on one instance; calm / alert is a state for the whole game.
 *
 * Each kind has one home in the dock:
 *   SPEED   the parameter (its chooser switches the generator on and off)
 *   STEP    a tray: the trigger for each character, where YOU stand (the
 *           switch changes with it), and how the switch is set — the planted
 *           fault `globalSurface` is that setting made wrong
 *   STATE   the global state
 * Steps here are taken IN PLACE, so a surface changes only when the learner
 * chooses another place.
 *
 * Common mistake taught against: applying a character's surface to everyone.
 */
import { useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { surfaceOf, type GaCharId, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, useGa } from '../model/gaStore';
import { SURFACE_NAME, surfaceAt, type GaSurfaceId } from '../model/gaWorld';
import { SyncTable, TrayBox, TrayChip, TrayLog, TrayNote, TrayRow, onOff, useCountWhen, type SyncRow } from './chbBits';
import { CHB_FOOTSTEP_ASSETS, chbGuideOwnSurface, chbPlaceOf, chbRoute, chbSteps, type ChbPlaceId } from './data/chbScene';
import { G08 } from './guides/p08';
import { pct, speedKey, useSince } from './shared';

const ASSETS: readonly string[] = [...CHB_FOOTSTEP_ASSETS, 'gen_hum', 'gen_air', 'door', 'door_rattle'];
const TERMS = gaTerms('Audio trigger', 'Switch group', 'Real-Time Parameter Control (RTPC)', 'Audio state', 'Game Syncs');
const SURFACE_KEY: Record<GaSurfaceId, string> = { wood: 'WOOD', stone: 'STONE', gravel: 'GRAVEL' };

const stepInPlace = (who: GaCharId) => gaDispatch({ type: 'step', who, dx: 0, dy: 0 });
const setGlobalSurface = (on: boolean) => {
  if (gaGet().faults.globalSurface !== on) gaDispatch({ type: 'fault', patch: { globalSurface: on } });
};

/** The STEP tray: the trigger for each character, the place YOU stand, and
 *  how the surface switch is set. */
function StepTray() {
  const s = useGa();
  const [blocked, setBlocked] = useState(false);
  const here = chbPlaceOf(s.chars.player);
  const goTo = (to: ChbPlaceId) => {
    const now = gaGet();
    const r = chbRoute(now.chars.player, now.doorOpen, to);
    for (const a of r.moves) gaDispatch(a);
    setBlocked(r.blocked);
  };
  return (
    <TrayBox>
      {/* Two one-line rows, then the log: what a press did is in view
          without scrolling the tray on a phone. The door is a trigger too
          (the log's own word for it), and it shares the first row so the
          places keep one line. The setting the fault card uses comes last. */}
      <TrayRow head="TRIGGER · ONE THING THAT HAPPENS">
        <TrayChip label="STEP: YOU" onPress={() => stepInPlace('player')} />
        <TrayChip label="STEP: GUIDE" onPress={() => stepInPlace('guide')} />
        <TrayChip
          label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'}
          onPress={() => {
            gaDispatch({ type: 'door' });
            setBlocked(false);
          }}
        />
      </TrayRow>
      <TrayRow head="SWITCH · WHERE YOU STAND">
        <TrayChip label={marked('STONE PATH', here === 'stone')} selected={here === 'stone'} onPress={() => goTo('stone')} />
        <TrayChip label={marked('GRAVEL', here === 'gravel')} selected={here === 'gravel'} onPress={() => goTo('gravel')} />
        <TrayChip label={marked('WORKSHOP', here === 'workshop')} selected={here === 'workshop'} onPress={() => goTo('workshop')} />
      </TrayRow>
      {blocked && !s.doorOpen ? <TrayNote>The door is closed, so you stopped in front of it. Choose OPEN DOOR, then choose the place again.</TrayNote> : null}
      <TrayLog state={s} lines={3} />
      <TrayRow head="THE SURFACE SWITCH IS SET">
        <TrayChip label={marked('FOR EACH CHARACTER', !s.faults.globalSurface)} selected={!s.faults.globalSurface} onPress={() => setGlobalSurface(false)} />
        <TrayChip label={marked('FOR EVERYONE', s.faults.globalSurface)} selected={s.faults.globalSurface} onPress={() => setGlobalSurface(true)} />
      </TrayRow>
    </TrayBox>
  );
}

/** SPEED, with the generator's on and off as its chooser: the parameter and
 *  the instance it belongs to live on one key. */
function speedWithGenerator(s: GaState): DockParam {
  const key = speedKey(s);
  if (key.kind !== 'fader') return key;
  const on = !!s.machines.find((m) => m.id === 'generator-1')?.on;
  return {
    ...key,
    chooser: {
      title: 'GENERATOR',
      options: [
        { id: 'off', label: onOff('GENERATOR 1', false), blurb: 'The generator is stopped. SPEED still holds a value, but no instance is playing to follow it.' },
        { id: 'on', label: onOff('GENERATOR 1', true), blurb: 'The generator event starts one instance. SPEED then changes that instance while it plays.' },
      ],
      selectedId: on ? 'on' : 'off',
      onSelect: (id) => gaDispatch({ type: 'machine', id: 'generator-1', on: id === 'on' }),
    },
  };
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since, kinds } = useSince(s);
  const [check, setCheck] = useState(false);
  const gen = s.machines.find((m) => m.id === 'generator-1');
  const youRead = surfaceOf(s, 'player');
  const guideRead = surfaceOf(s, 'guide');
  const guideTrue = surfaceAt(s.chars.guide);
  const guideSteps = chbSteps(s, 'guide');

  // the guide stepped on ITS surface while you, having changed yours, stood on another
  const localSeen = useCountWhen(guideSteps, kinds('step:player:') >= 2 && chbGuideOwnSurface(s)) > 0;
  // the planted fault was heard: the guide stepped with a surface that is not under it
  const wrongSeen = useCountWhen(guideSteps, s.faults.globalSurface && guideRead !== guideTrue) > 0;

  const goals = [
    { label: 'Step as you and as the guide', hit: kinds('step:player:') > 0 && kinds('step:guide:') > 0 },
    { label: 'Change your surface: the guide keeps its own', hit: localSeen },
    { label: 'Move SPEED while the generator runs', hit: since('speedWhilePlaying') > 0 },
    { label: 'Change the state of the whole game', hit: since('mood:alert') + since('mood:calm') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const stepKey: DockParam = {
    kind: 'group',
    id: 'step',
    label: 'STEP',
    valueLabel: SURFACE_KEY[youRead],
    valueA11y: `your surface switch reads ${SURFACE_NAME[youRead].toLowerCase()}; the guide’s reads ${SURFACE_NAME[guideRead].toLowerCase()}`,
    render: () => <StepTray />,
  };
  const stateKey: DockParam = {
    kind: 'options',
    id: 'state',
    label: 'STATE',
    valueLabel: s.mood === 'alert' ? 'ALERT' : 'CALM',
    options: [
      { id: 'calm', label: 'CALM', blurb: 'The whole game is calm. Every object reads this one value.' },
      { id: 'alert', label: 'ALERT', blurb: 'The whole game is on alert. One change reaches every object that reads the state.' },
    ],
    selectedId: s.mood,
    onSelect: (id) => gaDispatch({ type: 'mood', mood: id === 'alert' ? 'alert' : 'calm' }),
  };

  const rows: SyncRow[] = [
    { object: 'YOU', kind: 'SWITCH', value: `surface: ${SURFACE_NAME[youRead]}` },
    {
      object: 'GUIDE',
      kind: 'SWITCH',
      value: `surface: ${SURFACE_NAME[guideRead]}`,
      wrong: guideRead !== guideTrue ? `COPIED FROM YOU · THE GUIDE STANDS ON ${SURFACE_NAME[guideTrue].toUpperCase()}` : undefined,
    },
    { object: 'GENERATOR', kind: 'PARAMETER', value: `speed: ${pct(gen?.speed ?? 0.4)}${gen?.on ? '' : ' (not running)'}` },
  ];

  return (
    <GaRack
      spec={{
        keys: [speedWithGenerator(s), stepKey, stateKey],
        initialParam: 'speed-generator-1',
        readouts: [
          { k: 'YOU ON', v: SURFACE_KEY[youRead], vA11y: `your surface switch reads ${SURFACE_NAME[youRead].toLowerCase()}` },
          { k: 'GUIDE ON', v: SURFACE_KEY[guideRead], vA11y: `the guide’s surface switch reads ${SURFACE_NAME[guideRead].toLowerCase()}` },
        ],
        showNames: true,
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>You stand on the stone path, the guide on the workshop’s wood floor. The table below lists the game information for each object.</Look>
        <P>A game sends the audio side four kinds of information. A trigger is one thing that happens: a foot touches the ground. A switch is one choice from a list, held by each object: the surface under each character. A parameter is a changing number: the generator’s speed. A state is a mode for the whole game: calm or alert.</P>
        <P>Together these are often called Game Syncs. A link from a game number to a sound setting is an RTPC, and a list of switch choices is a switch group. These are general meanings: each tool has its own names.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open STEP. Press STEP: YOU, then STEP: GUIDE. Choose GRAVEL. Press STEP: YOU first, then STEP: GUIDE.</Do>
        <P>Every press is one trigger, and one footstep event answers both characters. The switch decides which sound plays. Yours now reads gravel; the guide’s still reads wood. A switch is local: it belongs to one object.</P>
        <SyncTable rows={rows} state={s.mood.toUpperCase()} />
        <ActivityLog state={s} lines={6} />
      </Step>
      <Step n={3}>
        <Do>Tap SPEED, choose GENERATOR 1 · ON, and move the slider. Then open STATE and choose ALERT.</Do>
        <P>Speed is local too: a value on one generator’s instance. The state is global: one STATE line changes the mood for every object at the same time, as the table shows. Nothing in the picture or the sound changes here. The Adaptive music page uses this state to change the music. The question “one object or the whole game?” is called scope.</P>
        <Note tone="mistake">Setting a switch for everyone when it belongs to one character. Then every character sounds as if it walks on the same ground.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You walk from the stone path onto the gravel. The guide stays on the wood floor. What does the guide’s next footstep play?"
          options={[
            'Wood, because each character holds its own surface switch',
            'Gravel, because the newest switch value applies to everyone',
            'Stone, because that was the value when the scene started',
            'Nothing, until the state of the game changes',
          ]}
          correct={0}
          explain="A switch is local. The footstep event reads the switch of the character that stepped, and the guide’s switch still says wood."
          wrong={[
            undefined,
            'That describes a global value. A switch is held by each object, so your move changes only your own.',
            'A switch does not keep the value the scene started with.',
            'A state is a different kind of information. A footstep needs only its trigger and the switch of the character that stepped.',
          ]}
          onCorrect={() => setCheck(true)}
        />
      </Step>
      <FaultCard
        title="EVERYONE WALKS ON YOUR GROUND"
        symptom="Start the fault. Stand on GRAVEL and press STEP: GUIDE. The guide stands on the wood floor, but its footstep sounds like the ground under you."
        armed={s.faults.globalSurface}
        fixed={wrongSeen && !s.faults.globalSurface}
        onStart={() => setGlobalSurface(true)}
        hints={[
          'After STEP: GUIDE, read the SWITCH value in the newest GAME lines of the log.',
          'The guide has not moved. Its switch is following your position, and the table marks that row.',
          'In the STEP tray, read the row THE SURFACE SWITCH IS SET.',
        ]}
        why="A switch belongs to one game object. Here it was set once for everyone, so every character used the surface under you. Set for each character, the footstep event reads the surface under the feet that stepped."
      />
    </GaRack>
  );
}

export const P08: PageDef = { title: 'Triggers, states, switches', short: 'GAME INFO', Component: Page, manualDone: true, rack: true, guide: G08 };
