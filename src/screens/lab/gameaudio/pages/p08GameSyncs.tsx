/**
 * Page 8 — TRIGGERS, STATES, SWITCHES, PARAMETERS.
 *
 * Four kinds of game information, and the point of the page: LOCAL versus
 * GLOBAL scope. A foot contact is a trigger; the surface under each
 * character is a switch held by that character; the generator's speed is a
 * parameter kept on one generator (its instance follows it: lead's decision
 * 6); calm / alert is a state for the whole game, and its name is MOOD on
 * the key, in the log and on the music page.
 *
 * WHOSE WORDS (lead's decision 3, accuracy audit A1): trigger, switch,
 * parameter and state are this lab's general words. "Game Syncs", "RTPC" and
 * "Switch Group" are Wwise's, and the page says so. A Wwise Trigger is the
 * Game Sync that launches a music stinger; a foot contact posts an Event.
 *
 * Each kind has one home in the dock:
 *   SPEED   the parameter (its chooser switches the generator on and off)
 *   STEP    a tray, two rows: the trigger for each character, and where YOU
 *           stand (the switch changes with it)
 *   MOOD    the global state
 *   SCOPE   how the surface switch is set: for each character (local) or
 *           for everyone (global). The planted fault `globalSurface` is
 *           this setting made wrong.
 * Steps here are taken IN PLACE, so a surface changes only when the learner
 * chooses another place.
 *
 * A PLANTED FAULT DOES NOT NAME ITSELF (lead's decision 10). From START THE
 * FAULT until a guide step has really used the wrong surface, the GUIDE
 * FLOOR readout and the table keep the guide's own surface (the value its
 * last footstep sent), the table carries no mark, and SCOPE is locked. After
 * that step they show what the switch reads and say where it came from.
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
import { SyncTable, TrayBox, TrayChip, TrayRow, onOff, useCountWhen, type SyncRow } from './chbBits';
import { CHB_FOOTSTEP_ASSETS, CHB_P08_LOG, chbGuideOwnSurface, chbGuideSurfaceShown, chbPlaceOf, chbRoute, chbSteps, type ChbPlaceId } from './data/chbScene';
import { G08 } from './guides/p08';
import { pct, speedKey, useSince } from './shared';

const ASSETS: readonly string[] = [...CHB_FOOTSTEP_ASSETS, 'gen_hum', 'gen_air', 'door', 'door_close', 'door_rattle'];
const TERMS = gaTerms('Audio trigger', 'Switch group', 'Real-Time Parameter Control (RTPC)', 'Audio state', 'Game Syncs');
const SURFACE_KEY: Record<GaSurfaceId, string> = { wood: 'WOOD', stone: 'STONE', gravel: 'GRAVEL' };

const stepInPlace = (who: GaCharId) => gaDispatch({ type: 'step', who, dx: 0, dy: 0 });
const setGlobalSurface = (on: boolean) => {
  if (gaGet().faults.globalSurface !== on) gaDispatch({ type: 'fault', patch: { globalSurface: on } });
};

/** The STEP tray: the trigger for each character, and the place YOU stand.
 *  Two one-line rows and nothing else (a tray covers the well and has little
 *  room: lead's decision 15). What a press did is read on the display, and
 *  in the page's log once the tray is closed. */
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
      {/* The door is a trigger too (the log's own word for it), and it
          shares the first row so the places keep one line. */}
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
      <TrayRow head={blocked && !s.doorOpen ? 'THE DOOR IS CLOSED: CHOOSE OPEN DOOR, THEN THE PLACE AGAIN' : 'SWITCH · WHERE YOU STAND'}>
        <TrayChip label={marked('STONE PATH', here === 'stone')} selected={here === 'stone'} onPress={() => goTo('stone')} />
        <TrayChip label={marked('GRAVEL', here === 'gravel')} selected={here === 'gravel'} onPress={() => goTo('gravel')} />
        <TrayChip label={marked('WORKSHOP', here === 'workshop')} selected={here === 'workshop'} onPress={() => goTo('workshop')} />
      </TrayRow>
    </TrayBox>
  );
}

/** SPEED, with the generator's on and off as its chooser: the parameter and
 *  the generator it is kept on live on one key. */
function speedWithGenerator(s: GaState): DockParam {
  const key = speedKey(s);
  if (key.kind !== 'fader') return key;
  const on = !!s.machines.find((m) => m.id === 'generator-1')?.on;
  return {
    ...key,
    chooser: {
      title: 'GENERATOR 1',
      options: [
        { id: 'off', label: onOff('GENERATOR 1', false), blurb: 'The generator is stopped. SPEED still holds a value, but no instance is playing to follow it.' },
        { id: 'on', label: onOff('GENERATOR 1', true), blurb: 'The generator event starts one instance. That instance follows SPEED while it plays.' },
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
  const global = s.faults.globalSurface;
  const youRead = surfaceOf(s, 'player');
  const guideRead = surfaceOf(s, 'guide');
  const guideTrue = surfaceAt(s.chars.guide);
  const guideSteps = chbSteps(s, 'guide');

  // the guide stepped on ITS surface while you, having changed yours, stood on another
  const localSeen = useCountWhen(guideSteps, kinds('step:player:') >= 2 && chbGuideOwnSurface(s)) > 0;
  // the planted fault's symptom: a step used a surface that is not under the feet
  // that stepped (the model's own count)
  const wrongSteps = since('stepWrongSurface');
  const wrongSeen = wrongSteps > 0;

  // THE CARD. `startedAt` = how many wrong-surface steps the visit had when
  // START THE FAULT was pressed; until one more happens, nothing names the fault.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const unnamed = startedAt !== null && global && wrongSteps <= startedAt;
  const guideShown = chbGuideSurfaceShown(s, !unnamed);

  const goals = [
    { label: 'Step as you and as the guide', hit: kinds('step:player:') > 0 && kinds('step:guide:') > 0 },
    { label: 'Step on a new surface, then step as the guide: its surface stays', hit: localSeen },
    { label: 'Move SPEED while the generator runs', hit: since('speedWhilePlaying') > 0 },
    { label: 'Change MOOD, the state of the whole game', hit: since('mood:alert') + since('mood:calm') > 0 },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);

  const stepKey: DockParam = {
    kind: 'group',
    id: 'step',
    label: 'STEP',
    valueLabel: SURFACE_KEY[youRead],
    valueA11y: `your surface switch reads ${SURFACE_NAME[youRead].toLowerCase()}; the guide’s reads ${SURFACE_NAME[guideShown].toLowerCase()}`,
    render: () => <StepTray />,
  };
  const moodKey: DockParam = {
    kind: 'options',
    id: 'mood',
    label: 'MOOD',
    valueLabel: s.mood === 'alert' ? 'ALERT' : 'CALM',
    options: [
      { id: 'calm', label: 'CALM', blurb: 'MOOD is a state. The whole game is calm. Every object reads this one value.' },
      { id: 'alert', label: 'ALERT', blurb: 'MOOD is a state. The whole game is on alert. One change reaches every object that reads it.' },
    ],
    selectedId: s.mood,
    onSelect: (id) => gaDispatch({ type: 'mood', mood: id === 'alert' ? 'alert' : 'calm' }),
  };
  const scopeKey: DockParam = {
    kind: 'options',
    id: 'scope',
    label: 'SCOPE',
    valueLabel: unnamed ? '?' : global ? 'GLOBAL' : 'LOCAL',
    valueA11y: unnamed ? 'how the surface switch is set has not been tested since the fault began: press STEP: GUIDE' : global ? 'the surface switch is set for everyone: global' : 'the surface switch is set for each character: local',
    options: [
      { id: 'local', label: 'FOR EACH CHARACTER', blurb: 'The surface switch is local. Each character holds its own value: the surface under its own feet.' },
      { id: 'global', label: 'FOR EVERYONE', blurb: 'The surface switch is global. Every character uses one value: the surface under YOU.' },
    ],
    selectedId: global ? 'global' : 'local',
    onSelect: (id) => setGlobalSurface(id === 'global'),
    locked: unnamed ? 'Press STEP: GUIDE in the STEP tray first and read the log. Then SCOPE opens.' : undefined,
  };

  const rows: SyncRow[] = [
    { object: 'YOU', kind: 'SWITCH', value: `surface: ${SURFACE_NAME[youRead]}` },
    {
      object: 'GUIDE',
      kind: 'SWITCH',
      value: `surface: ${SURFACE_NAME[guideShown]}`,
      wrong: !unnamed && guideRead !== guideTrue ? `COPIED FROM YOU · THE GUIDE STANDS ON ${SURFACE_NAME[guideTrue].toUpperCase()}` : undefined,
    },
    { object: 'GENERATOR 1', kind: 'PARAMETER', value: `speed: ${pct(gen?.speed ?? 0.4)}${gen?.on ? '' : ' (not running)'}` },
  ];

  return (
    <GaRack
      spec={{
        keys: [speedWithGenerator(s), stepKey, moodKey, scopeKey],
        initialParam: 'speed-generator-1',
        hud: 'sync',
        readouts: [
          // wider cells: at an even width the labels were cut to "YOUR FL…" (seen at 390 wide)
          { k: 'YOUR FLOOR', v: SURFACE_KEY[youRead], vA11y: `your surface switch reads ${SURFACE_NAME[youRead].toLowerCase()}`, flex: 1.65 },
          { k: 'GUIDE FLOOR', v: SURFACE_KEY[guideShown], vA11y: `the guide’s surface switch reads ${SURFACE_NAME[guideShown].toLowerCase()}`, flex: 1.65 },
        ],
        showNames: true,
        show: { mood: true, surface: true },
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>You stand on the stone path, the guide on the workshop’s wood floor.</Look>
        <P>A game sends the audio side four kinds of information. A trigger is one thing that happens: a foot touches the ground. A switch is one choice from a list, held by each object: the surface under each character. A parameter is a changing number: the generator’s speed. A state is a mode for the whole game: calm or alert.</P>
        <P>These words are general. Wwise groups switches, states and parameters as Game Syncs. Its link from a game number to a sound setting is an RTPC, and its list of switch choices is a Switch Group. FMOD Studio does these jobs with parameters. A Wwise Trigger starts a music stinger. A footstep there is an Event.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open STEP. Press STEP: YOU and STEP: GUIDE. Choose GRAVEL and press both again. Close the tray and read the log.</Do>
        <P>Each press is one trigger. One footstep event answers both characters, and the switch decides which sound plays. Yours reads gravel. The guide’s still reads wood: a switch is local.</P>
        <SyncTable rows={rows} state={s.mood.toUpperCase()} />
        <ActivityLog state={s} lines={8} only={CHB_P08_LOG} />
      </Step>
      <Step n={3}>
        <Do>Tap SPEED, choose GENERATOR 1 · ON and move the slider. In MOOD, choose ALERT. Then start the fault on the TROUBLESHOOT card.</Do>
        <P>Speed is local too: it is kept on one generator, and its instance follows it. MOOD is a state: one STATE line changes it for every object, and the whole picture shows it. The question “one object or the whole game?” is called scope.</P>
        <Note tone="mistake">Setting a switch for everyone when it belongs to one character. Then everyone sounds as if on the same ground.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
        <FaultCard
          title="EVERYONE WALKS ON YOUR GROUND"
          symptom="Start the fault. Stand on GRAVEL and press STEP: GUIDE. The guide stands on the wood floor, but its footstep is the sound of the ground under you."
          armed={global}
          fixed={wrongSeen && !global}
          seen={!unnamed}
          onStart={() => {
            setStartedAt(wrongSteps);
            setGlobalSurface(true);
          }}
          hints={[
            'After STEP: GUIDE, read the SWITCH value in the newest GAME lines of the log.',
            'The guide has not moved. Its switch is following your position, and the table marks that row.',
            'Open SCOPE in the dock. It shows how the surface switch is set.',
          ]}
          why="A switch belongs to one game object. Here it was set once for everyone, so every character used the surface under you. Set for each character, the footstep event reads the surface under the feet that stepped."
        />
        {global ? <ActivityLog state={s} lines={4} only={CHB_P08_LOG} /> : null}
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="QUESTION"
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
    </GaRack>
  );
}

export const P08: PageDef = { title: 'Triggers, states, switches', short: 'GAME INFO', Component: Page, manualDone: true, rack: true, guide: G08 };
