/**
 * LOOPS AND THEIR JOINS (chapter 2 closes). The learner's page 12.
 *
 * THE FILE'S NUMBER IS ITS NAME, NOT ITS PLACE (see pages/index.ts): this
 * page was the second lesson of "Loops, ambience and zones" until
 * 2026-11-14, when the owner's decision 5 ("Split a page that holds two
 * lessons into two pages"; beginner audit G5, page 10: "Four ideas: loop
 * join, bed vs spot sound, zone crossfade, and a fault") gave it a page of
 * its own. The zones, the crossfade and the fault stay in p10Loops.tsx (the
 * page before this one). The join experiment, its two goals and its check
 * are the old page's, unchanged; the learner no longer has to walk for it.
 *
 * A loop's join. The learner starts the scene, swaps the courtyard wind for
 * the cut with no loop preparation and waits for its join, then chooses the
 * prepared loop again and silences every loop.
 *
 * THE RAW CUT IS JUDGED FROM THE CLOCK, not from a choice and not from
 * hearing: the goal is met when the raw file has passed its join (every
 * 10 s from the moment that bed started) while the listener stood in the
 * courtyard, where this page starts and keeps the listener. The `beds` strip
 * under the picture draws the loop, its play position and the JUMP at the
 * join ("JUMPS n"), so the moment is seen with sound off too.
 *
 * Three keys: LEVEL (the slider, first, as on every page), SCENE and WIND,
 * which chooses the courtyard wind's file.
 *
 * Common mistake taught against: trying to hide a bad join with a fade.
 */
import { useEffect, useRef, useState } from 'react';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import type { DockParam } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import { GaRack, masterKey } from '../GaLab';
import { ActivityLog, Do, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { gaTerms } from '../gaTerms';
import { gaPlaying, listenerOf, type GaState } from '../model/gaModel';
import { gaDispatch, gaGet, gaNow, useGa } from '../model/gaStore';
import { zoneAt } from '../model/gaWorld';
import { useCountWhen } from './chbBits';
import { CHB_P10_LOG, P10_WIND_KEY, chbBeds, chbJoinsPassed, chbLoops, chbRawBed } from './data/chbScene';
import { G24 } from './guides/p24';
import { gaFact } from './shared';

const ASSETS: readonly string[] = ['amb_room', 'amb_yard', 'amb_yard_raw', 'bird_1', 'bird_2', 'bird_3', 'fountain'];
const TERMS = gaTerms('Ambient loop', 'Loop Point');

const setRawLoop = (on: boolean) => {
  if (gaGet().options.rawYardLoop !== on) gaDispatch({ type: 'option', patch: { rawYardLoop: on } });
};

/** The scene's background is running: either ambience bed, or the fountain. */
const sceneRunning = (s: GaState): boolean => {
  const beds = chbBeds(s);
  return beds.room + beds.yard > 0 || gaPlaying(s, 'fountain');
};

/** Start or stop the scene's background: both beds and the fountain. */
const sceneKey = (s: GaState): DockParam => ({
  kind: 'toggle',
  id: 'scene',
  label: 'SCENE',
  value: sceneRunning(s),
  onToggle: () => gaDispatch({ type: 'scene', on: !sceneRunning(gaGet()) }),
});

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
  const [joinCheck, setJoinCheck] = useState(false);
  const zone = zoneAt(listenerOf(s));
  const loops = chbLoops(s);
  const raw = chbRawBed(s);
  const yardJoins = useYardJoins(raw, zone === 'yard');

  // ■ STOP was pressed while loops were playing, and none is left
  const loopsBefore = useRef(loops);
  const silenced = useCountWhen(gaFact(s, 'stopAll'), loopsBefore.current > 0 && loops === 0) > 0;
  loopsBefore.current = loops;

  const goals = [
    { label: 'Stay in the courtyard until the raw cut passes its join', hit: yardJoins > 0 },
    { label: 'Silence every loop with ■ STOP', hit: silenced },
    { label: 'Pass the check', hit: joinCheck },
  ];
  const latched = useVisitGoals(ctx, goals);

  const windKey: DockParam = {
    kind: 'options',
    id: 'wind-file',
    label: P10_WIND_KEY,
    valueLabel: s.options.rawYardLoop ? 'RAW' : 'LOOP',
    valueA11y: s.options.rawYardLoop ? 'the courtyard wind is the raw cut, with no loop preparation' : 'the courtyard wind is the prepared loop',
    options: [
      { id: 'loop', label: 'PREPARED LOOP', blurb: 'The wind file was blended across its join, so its end runs into its start with no jump.' },
      { id: 'raw', label: 'RAW CUT', blurb: 'The same wind, cut with no loop preparation. It ends in a gust and begins in a lull, so the level jumps at the join.' },
    ],
    selectedId: s.options.rawYardLoop ? 'raw' : 'loop',
    onSelect: (id) => setRawLoop(id === 'raw'),
  };

  return (
    <GaRack
      spec={{
        keys: [masterKey(s), sceneKey(s), windKey],
        initialParam: 'master',
        hud: 'beds',
        readouts: [{ k: 'WIND', v: s.options.rawYardLoop ? 'RAW CUT' : 'LOOP', vA11y: s.options.rawYardLoop ? 'the courtyard wind is the raw cut' : 'the courtyard wind is the prepared loop', flex: 1.3 }],
        showNames: true,
        show: { beds: true },
        assets: ASSETS,
      }}
    >
      <Step n={1}>
        <Look>The strip under the picture draws each bed as a loop: a mark shows where it is playing, and a line shows its join.</Look>
        <P>A loop repeats, so the join where its end meets its start must be prepared, or it jumps on every pass.</P>
        <P>A fade does not repair a badly cut loop.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Switch SCENE on. Then set WIND to RAW CUT. Under the picture, JUMPS counts each pass of the join.</Do>
        <P>The raw cut was not prepared as a loop. It ends in a gust and begins in a lull, so it jumps every 10 s.</P>
      </Step>
      <Step n={3}>
        <Do>Then choose PREPARED LOOP. Press ■ STOP to silence every loop.</Do>
        <P>The prepared file was blended across its join, so its end runs into its start with no jump.</P>
        <ActivityLog state={s} lines={4} only={CHB_P10_LOG} />
        <Note tone="mistake">Lengthening a fade to hide a jump at a loop’s join. The jump is inside the file, so the file has to be prepared as a loop.</Note>
      </Step>
      <Step n={4}>
        <P>Do each of these once. Each one is marked done when it really happens in the scene.</P>
        <GoalChips goals={goals} latched={latched} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="QUESTION"
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

export const P24: PageDef = { title: 'Loops and their joins', short: 'LOOPS', Component: Page, manualDone: true, rack: true, guide: G24 };
