/**
 * Page 10 — LOOPS, AMBIENCE AND ZONES (chapter 2 closes).
 *
 * A loop's join; beds and spot sounds; a local emitter; entering and leaving
 * a zone. The learner starts the scene, opens the door, walks from the
 * courtyard into the workshop and reads ONE crossfade per crossing; swaps
 * the courtyard wind for the cut with no loop preparation and waits for its
 * join; then meets the planted fault `bedPileUp`: every position update
 * starts the bed again and the copies stack.
 *
 * BED PLUS SPOT SOUNDS (audit 2, sound F14): the courtyard bed is wind only.
 * The bird calls are one-shots the audio side posts at random times and
 * places while that bed plays, so the background never repeats exactly.
 *
 * THE RAW CUT IS JUDGED FROM THE CLOCK, not from a choice and not from
 * hearing: the goal is met when the raw file has passed its join (every
 * 10 s from the moment that bed started) while the listener stood in the
 * courtyard. The `beds` strip under the picture draws the loop, its play
 * position and the JUMP at the join ("JUMPS n"), so the moment is seen with
 * sound off too.
 *
 * Four keys: FACING (the lane) and STEP walk the player for real; the SOUNDS
 * tray holds the scene, the door and the rule for when a bed starts (the
 * fault is that rule set wrong): two rows, so it fits the tray's box on a
 * phone (lead's decision 15); WIND FILE chooses the courtyard wind's file.
 *
 * Common mistake taught against: starting a new background loop on every
 * update while the player stays in one area.
 */
import { useEffect, useRef, useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack } from '../GaLab';
import { ActivityLog, Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, marked, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, listenerOf } from '../model/gaModel';
import { gaDispatch, gaGet, gaNow, useGa } from '../model/gaStore';
import { zoneAt } from '../model/gaWorld';
import { TrayBox, TrayChip, TrayRow, onOff, useCountWhen, useFreshProof, usePlantedFault } from './chbBits';
import { gaPlantedWhere, type GaWhere } from '../bitsLogic';
import { CHB_FOOTSTEP_ASSETS, CHB_P10_LOG, chbBeds, chbJoinsPassed, chbLoops, chbRawBed, chbSteps } from './data/chbScene';
import { G10 } from './guides/p10';
import { facingKey, gaFact, stepKey, useSince } from './shared';

const ASSETS: readonly string[] = ['amb_room', 'amb_yard', 'amb_yard_raw', 'bird_1', 'bird_2', 'bird_3', 'fountain', 'door', 'door_close', 'door_rattle', ...CHB_FOOTSTEP_ASSETS];
const TERMS = gaTerms('Ambience zone', 'Ambient loop', 'Loop Point', 'Crossfade', 'Room Tone');

const setRawLoop = (on: boolean) => {
  if (gaGet().options.rawYardLoop !== on) gaDispatch({ type: 'option', patch: { rawYardLoop: on } });
};
const setPileUp = (on: boolean) => {
  if (gaGet().faults.bedPileUp !== on) gaDispatch({ type: 'fault', patch: { bedPileUp: on } });
};

/** The SOUNDS tray: the background and the door, and the rule for when a
 *  bed starts. Two one-line rows and nothing else. The rule row shows
 *  `pile`, the rule as the page shows it: while a planted fault is not yet
 *  found, the rule in use before START (R2-GA1-01). */
function SoundsTray({ pile, pick, where }: { pile: boolean; pick: (on: boolean) => void; where: GaWhere }) {
  const s = useGa();
  const beds = chbBeds(s);
  const sceneOn = beds.room + beds.yard > 0 || gaPlaying(s, 'fountain');
  return (
    <TrayBox>
      <TrayRow head="SCENE AND DOOR">
        <TrayChip label={onOff('SCENE', sceneOn)} selected={sceneOn} onPress={() => gaDispatch({ type: 'scene', on: !sceneOn })} />
        <TrayChip label={s.doorOpen ? 'CLOSE DOOR' : 'OPEN DOOR'} onPress={() => gaDispatch({ type: 'door' })} />
      </TrayRow>
      {/* whose rule: the project's, or the build's once it has shown itself (checker C-4) */}
      <TrayRow head={`A BED STARTS · ${where === 'project' ? 'IN PROJECT' : 'IN BUILD'}`}>
        <TrayChip label={marked('ONCE, WITH THE SCENE', !pile)} selected={!pile} onPress={() => pick(false)} />
        <TrayChip label={marked('ON EVERY UPDATE', pile)} selected={pile} onPress={() => pick(true)} />
      </TrayRow>
    </TrayBox>
  );
}

/**
 * How many times the raw cut has passed its join WHILE THE LISTENER STOOD IN
 * THE COURTYARD, on this visit. A join is a moment on the scene clock
 * (`chbJoinsPassed`); a timer wakes the page just after the next one, and
 * the count goes up only if the listener is in the courtyard then. Nothing
 * here is heard or pressed: it is the same with sound off.
 */
function useYardJoins(raw: { id: string; born: number; loopS: number } | null, inYard: boolean): number {
  const [, wake] = useState(0);
  const seen = useRef<{ key: string; passed: number }>({ key: '', passed: 0 });
  const count = useRef(0);
  const key = raw ? `${raw.id}@${raw.born}` : '';
  const born = raw ? raw.born : null;
  const loopS = raw ? raw.loopS : 0;
  const passed = chbJoinsPassed(raw, gaNow());
  if (seen.current.key !== key) seen.current = { key, passed };
  else if (passed > seen.current.passed) {
    if (inYard) count.current += 1;
    seen.current.passed = passed;
  }
  useEffect(() => {
    if (born == null || !(loopS > 0)) return undefined;
    const next = born + (passed + 1) * loopS;
    const id = setTimeout(() => wake((n) => n + 1), Math.max(0, (next - gaNow()) * 1000) + 40);
    return () => clearTimeout(id);
  }, [key, born, loopS, passed]);
  return count.current;
}

function Page({ ctx }: { ctx: PageCtx }) {
  const s = useGa();
  const { since } = useSince(s);
  const [zoneCheck, setZoneCheck] = useState(false);
  const [joinCheck, setJoinCheck] = useState(false);
  const beds = chbBeds(s);
  const zone = zoneAt(listenerOf(s));
  const sceneOn = beds.room + beds.yard > 0 || gaPlaying(s, 'fountain');
  const loops = chbLoops(s);
  const raw = chbRawBed(s);
  const yardJoins = useYardJoins(raw, zone === 'yard');

  // crossings that really crossfaded the beds (the model's own count)
  const crossings = since('zoneCrossFade');
  // ■ STOP was pressed while loops were playing, and none is left
  const loopsBefore = useRef(loops);
  const silenced = useCountWhen(gaFact(s, 'stopAll'), loopsBefore.current > 0 && loops === 0) > 0;
  loopsBefore.current = loops;
  // the planted fault's symptom happened on this visit: an update started a bed again
  const pileCount = since('bedPileUp');
  const pileSeen = pileCount > 0;
  // until one more pile-up line than at START THE FAULT, the rule row shows
  // the rule in use before the start: no "?", no lock, no moved ✓ (bug test
  // 2026-11-13, B-S1-01; round 2, R2-GA1-01)
  const plant = usePlantedFault(pileCount, s.faults.bedPileUp);
  const { unnamed } = plant;
  // FIXED needs proof, as on pages 6 to 8 (round 2, R2-GA1-05): a step taken
  // with the scene running AFTER the rule was corrected, with no copy
  // stacked. ■ STOP alone empties the beds but proves nothing.
  const clean = beds.room <= 1 && beds.yard <= 1;
  // ...AFTER THE NEWEST pile-up: a second round needs its own step (checker C-1)
  const proved = useFreshProof(pileCount, chbSteps(s, 'player'), pileSeen && !s.faults.bedPileUp && sceneOn && clean);
  const where = gaPlantedWhere(unnamed, pileSeen);
  const fixed = pileSeen && !s.faults.bedPileUp && clean && proved;
  // the card is active while the rule is wrong, and afterward until a step proves the repair
  const faultArmed = s.faults.bedPileUp || (pileSeen && !fixed);

  const goals = [
    { label: 'Cross the doorway twice with the scene running', hit: crossings >= 2 },
    { label: 'Stay in the courtyard until the raw cut passes its join', hit: yardJoins > 0 },
    { label: 'Silence every loop with ■ STOP', hit: silenced },
    { label: 'Pass both checks', hit: zoneCheck && joinCheck },
  ];
  const latched = useVisitGoals(ctx, goals);

  const soundsKey: DockParam = {
    kind: 'group',
    id: 'scene',
    label: 'SOUNDS',
    // "SCENE ON" was cut to "SCENE …" in a six-key dock at 390 (seen); the
    // key's own label, SOUNDS, says what is on
    valueLabel: sceneOn ? 'ON' : 'OFF',
    valueA11y: `the scene’s background is ${sceneOn ? 'on' : 'off'}; the door is ${s.doorOpen ? 'open' : 'closed'}`,
    render: () => <SoundsTray pile={plant.shown} pick={(on) => plant.pick(on, setPileUp)} where={where} />,
  };
  const windKey: DockParam = {
    kind: 'options',
    id: 'wind-file',
    label: 'WIND FILE',
    valueLabel: s.options.rawYardLoop ? 'RAW' : 'LOOP',
    valueA11y: s.options.rawYardLoop ? 'the courtyard wind is the raw cut, with no loop preparation' : 'the courtyard wind is the prepared loop',
    options: [
      { id: 'loop', label: 'PREPARED LOOP', blurb: 'The wind file was blended across its join, so its end runs into its start with no jump.' },
      { id: 'raw', label: 'RAW CUT', blurb: 'The same wind, cut with no loop preparation. It ends in a gust and begins in a lull, so the level jumps at the join.' },
    ],
    selectedId: s.options.rawYardLoop ? 'raw' : 'loop',
    onSelect: (id) => setRawLoop(id === 'raw'),
  };
  const copies = beds.room + beds.yard;

  return (
    <GaRack
      spec={{
        keys: [facingKey(s), stepKey('player'), soundsKey, windKey],
        initialParam: 'facing',
        hud: 'beds',
        readouts: [
          // a wider cell: at 320 wide an even cell cut the value to "COURTYA…" (seen)
          { k: 'ZONE', v: zone === 'room' ? 'WORKSHOP' : 'COURTYARD', vA11y: `the listener is in the ${zone === 'room' ? 'workshop' : 'courtyard'}`, flex: 1.6 },
          { k: 'BEDS', v: String(copies), vA11y: `${copies} ${copies === 1 ? 'copy of a bed is' : 'copies of the beds are'} playing` },
        ],
        showNames: true,
        show: { beds: true },
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>Two ambience zones, the courtyard and the workshop, share one door. The fountain is a local emitter: its sound has a place.</Look>
        <P>A loop repeats, so the join where its end meets its start must be prepared, or it jumps on every pass. A bed is a loop with no position: courtyard wind, workshop room tone. The birds are spot sounds: one-shots at random times and places, so the background does not repeat.</P>
        <P>Both beds start once, with the scene. Entering the other zone fades one bed down and the other up: a crossfade. A fade does not repair a badly cut loop.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>In SOUNDS, switch SCENE on and choose OPEN DOOR. Close the tray. STEP through the doorway, then set FACING near 270° and walk back.</Do>
        <P>Each crossing prints one STATE line that begins ZONE: one crossfade of 1.5 s. No bed starts or stops. Only levels change. This scene counts a silent bed as a voice. A real engine usually makes it virtual.</P>
        <ActivityLog state={s} lines={6} only={CHB_P10_LOG} />
      </Step>
      <Step n={3}>
        <Do>In the courtyard, set WIND FILE to RAW CUT. Under the picture, JUMPS counts each pass of the join. Then choose PREPARED LOOP and start the fault on the TROUBLESHOOT card.</Do>
        <P>The raw cut was not prepared as a loop. It ends in a gust and begins in a lull, so it jumps every 10 s.</P>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
        <FaultCard
          title="THE BACKGROUND THAT KEEPS GROWING"
          symptom="Start the fault and switch SCENE on. Take several steps without crossing the doorway. The background becomes louder with each step, and BEDS, PLAYING and VOICES climb."
          // still active after the rule is corrected, while the stacked copies play on
          armed={faultArmed}
          fixed={fixed}
          seen={pileSeen && !unnamed}
          firstHint="First make the problem happen: open SOUNDS, switch SCENE on, close the tray, then take several steps without crossing the doorway. Watch BEDS and PLAYING."
          onStart={() => {
            plant.start(gaGet().faults.bedPileUp);
            setPileUp(true);
          }}
          hints={[
            'With SCENE on, take several steps without crossing the doorway. Watch BEDS and PLAYING in the readouts.',
            'The FAULT lines in the log say a bed was STARTED AGAIN by a position update, and count the copies.',
            'Open SOUNDS and change the rule under A BED STARTS. The extra copies are still playing: ■ STOP silences everything. Then switch SCENE on again and take a step: BEDS stays at 2.',
          ]}
          why="The game reported your position many times while you stayed in one zone, and each report started the bed again. A bed needs one start. Here both beds start once, with the scene, and a crossing only changes their levels. A change of rule does not remove copies that are already playing, so they had to be stopped."
        />
        {faultArmed ? <ActivityLog state={s} lines={4} only={CHB_P10_LOG} /> : null}
        {/* below the card, so it is not the card's answer before the card (R2-GA1-01) */}
        {/* shown before START and once the fault has been met, never while it hides (checker C-2) */}
        {!unnamed ? <Note tone="mistake">Starting a background loop again on every position update in one area. The copies stack, get louder and use voices.</Note> : null}
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="QUESTION 1"
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
            'That would be a fault. A bed needs one start, not one for every update.',
            'A bed does not follow your movement inside its zone. It keeps playing.',
          ]}
          onCorrect={() => setZoneCheck(true)}
        />
        <UnderstandingCheck
          eyebrow="QUESTION 2"
          question="A wind loop jumps in level every 10 seconds. Someone makes the crossfade at the doorway twice as long. What happens to the jump?"
          options={[
            'It stays, because the join inside the file is unchanged',
            'It goes, because a crossfade smooths every change of level',
            'It comes half as often, because the fade is twice as long',
            'It moves to the doorway, where the crossfade happens',
          ]}
          correct={0}
          explain="The jump is at the loop’s join, inside the file. The crossfade at the doorway works only while you cross. The file has to be prepared as a loop."
          wrong={[
            undefined,
            'A crossfade works between two sounds while you cross. This jump is inside one file, on every pass.',
            'The file is still 10 seconds long, so it still passes its join every 10 seconds.',
            'The join is a moment in the file. It is not a place in the scene.',
          ]}
          onCorrect={() => setJoinCheck(true)}
        />
      </Step>
    </GaRack>
  );
}

export const P10: PageDef = { title: 'Loops, ambience and zones', short: 'ZONES', Component: Page, manualDone: true, rack: true, guide: G10 };
