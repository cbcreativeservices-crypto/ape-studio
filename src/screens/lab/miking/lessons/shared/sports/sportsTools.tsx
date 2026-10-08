/**
 * THE SPORTS TOOLS as steps — the parabolic dish (B12), the boundary
 * reflection and the plant (B14). Built once by group 2 (lab7-g5); B13 and
 * group 3 (B15, B16) reuse them. Rack steps on a FieldStage, a simplified
 * picture said once each; FULLY SILENT; nothing moves by itself.
 *
 *   useDishStep      the dish in section: SIZE (large / small), AIM error
 *                    0 / 10 / 20°, the element slid off FOCUS, a WIND cover;
 *                    the rays meeting at the focus or missing it; the lowest
 *                    frequency the bowl helps with (≈ c / D)
 *   useBoundaryStep  a capsule above a hard floor: the direct and reflected
 *                    paths, the extra path and the first notch, at 30 cm,
 *                    10 cm, 1 cm and AT the surface
 *   usePlantStep     a mic on a structure: isolated, rigid, or a contact
 *                    sensor — where the vibration goes
 */
import { useEffect, useState } from 'react';
import type { Prediction } from '../../../engine/model/types.ts';
import type { MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard } from '../../../engine/kit';
import { FieldStage } from '../field/FieldStage';
import { DishRays, DishSection } from './DishArt';
import { BoundarySection, PlantSection } from './BoundaryArt';
import { AIM_TRIALS, AIM_WORDS, DISHES, DISH_IDS, FOCUS_SLIDE, fmtHz, focusWords, gainOnsetHz, halfWidthAt, spreadAt, type DishId } from './parabolic.ts';
import { HEIGHTS, PLANT_IDS, PLANT_WORDS, firstNotch, paths, perpendicularNotch, type PlantMount } from './boundary.ts';

const AMBER = '#ffc64d';
const GREEN = '#5bff85';

/* ═════════ THE DISH ═════════ */

export function useDishStep({ onInteractive, done, prediction }: { onInteractive: (id: string) => void; done: boolean; prediction?: Prediction }): MikingStep {
  const [id, setId] = useState<DishId>('large');
  const [aim, setAim] = useState<(typeof AIM_TRIALS)[number]>(0);
  const [focus, setFocus] = useState(0);
  const [wind, setWind] = useState(false);
  const [seen, setSeen] = useState({ dishes: new Set<DishId>(['large']), aims: new Set<number>([0]), focus: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const dish = DISHES[id];
  const onset = gainOnsetHz(dish);
  const meets = spreadAt(dish, aim) < 3;
  const complete = seen.dishes.size === DISH_IDS.length && seen.aims.size === AIM_TRIALS.length && seen.focus;
  useEffect(() => {
    if (complete && !done) onInteractive('dishTool');
  }, [complete, done, onInteractive]);
  const R = halfWidthAt(dish, dish.depth);
  const box = { u0: -260, u1: dish.depth + 640, v0: -R - 120, v1: R + 220 };
  const words = `${dish.label}, cut along its axis. Sound arriving ${aim === 0 ? 'on the axis' : `${aim}° off the axis`}: the reflections ${meets ? 'meet at the element' : 'miss the element'}. The element ${focus === 0 ? 'at the focus' : `${Math.abs(focus)} mm ${focus > 0 ? 'out of' : 'into'} the bowl from the focus`}. Below about ${fmtHz(onset)} the bowl adds little; low sound reaches the element directly.`;
  return {
    key: 'dish',
    title: 'The dish',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="side"
          box={box}
          a11y={words}
          labels={[
            { id: 'f', text: 'FOCUS', u: dish.f, v: -R * 0.42, align: 'center', tone: 'amber', at: { u: dish.f, v: 0 } },
            { id: 'low', text: 'LOW SOUND, DIRECT', short: 'LOW', u: dish.depth + 560, v: -170, align: 'right', tone: 'blue' },
            { id: 'ax', text: 'THE AXIS → TARGET', short: 'AXIS', u: dish.depth + 600, v: 60, align: 'right', tone: 'muted' },
          ]}
        >
          {(px) => (
            <>
              <DishSection dish={dish} px={px} elementOffset={focus} wind={wind} />
              <DishRays dish={dish} offDeg={aim} px={px} />
            </>
          )}
        </FieldStage>
      ),
      badge: 'A simplified picture: blue = arriving sound, amber = its reflections · a picture of the bowl’s shape, not a maker’s drawing',
      bezel: [
        { k: 'DISH', v: id === 'large' ? 'LARGE' : 'SMALL', flex: 0.9 },
        { k: 'HELPS ABOVE', v: `≈ ${fmtHz(onset)}`, flex: 1.2 },
        { k: 'AIM', v: `${aim}°`, tint: aim ? AMBER : undefined, flex: 0.7 },
        { k: 'FOCUS', v: focus === 0 ? 'AT FOCUS' : `${focus > 0 ? '+' : '−'}${Math.abs(focus)} mm`, tint: focus ? AMBER : undefined, flex: 1 },
      ],
      params: [
        {
          kind: 'options',
          id: 'aim',
          label: 'AIM ERROR',
          valueLabel: `${aim}°`,
          selectedId: String(aim),
          sticky: true,
          onSelect: (v) => {
            const a = Number(v) as (typeof AIM_TRIALS)[number];
            setAim(a);
            setSeen((s) => ({ ...s, aims: new Set([...s.aims, a]) }));
          },
          options: AIM_TRIALS.map((a) => ({ id: String(a), label: a === 0 ? 'On the axis' : `${a}° off the axis`, blurb: AIM_WORDS[a] })),
        },
        {
          kind: 'fader',
          id: 'focus',
          label: 'FOCUS',
          value: (focus + FOCUS_SLIDE) / (2 * FOCUS_SLIDE),
          onChange: (v) => {
            const f = Math.round((v * 2 - 1) * FOCUS_SLIDE / 2) * 2;
            setFocus(f);
            if (f !== 0) setSeen((s) => (s.focus ? s : { ...s, focus: true }));
          },
          format: () => (focus === 0 ? 'the element at the focus' : `${Math.abs(focus)} mm ${focus > 0 ? 'out of' : 'into'} the bowl`),
          formatShort: () => `${focus > 0 ? '+' : ''}${focus}`,
          home: 0.5,
        },
        {
          kind: 'options',
          id: 'dish',
          label: 'SIZE',
          valueLabel: id === 'large' ? 'LARGE' : 'SMALL',
          selectedId: id,
          onSelect: (v) => {
            setId(v as DishId);
            setSeen((s) => ({ ...s, dishes: new Set([...s.dishes, v as DishId]) }));
          },
          options: DISH_IDS.map((d) => ({ id: d, label: DISHES[d].label, blurb: `In this simplified picture the bowl helps above about ${fmtHz(gainOnsetHz(DISHES[d]))}.` })),
        },
        { kind: 'toggle', id: 'wind', label: 'WIND COVER', value: wind, onToggle: () => setWind((x) => !x) },
      ],
      initialParam: 'focus',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${dish.label} · cut along its axis`} prompt="Try each AIM ERROR, slide the element off the FOCUS and back, and switch SIZE. Watch where the reflections meet — and what the bowl cannot do for low sound." />
        <NowLine text={words} />
        <Card>
          <Point title="WHAT THE BOWL DOES">{`It gathers sound arriving along its axis onto the element — but only where the wavelength is shorter than the dish is wide. Below about ${fmtHz(onset)} (the speed of sound ÷ this dish’s width) it adds little: low sound still reaches the element directly, which is not dish gain.`}</Point>
          <Point title={aim === 0 ? 'ON THE AXIS' : `${aim}° OFF THE AXIS`}>{AIM_WORDS[aim]}</Point>
          <Point title="THE FOCUS">{focusWords(focus)}</Point>
          {wind ? <Point title="THE WIND COVER">A cover made for the dish and its element: it may change the high frequencies a little, and must never shift the focus or touch the element.</Point> : null}
        </Card>
        {complete ? <Note tone="ok">{`A bigger dish helps lower down; every dish favours the high frequencies of whatever is on its axis — the crowd beyond the player included. Aim at the sound you want, not automatically at a head. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : <Body>Try both sizes, all three aim errors and the focus slide.</Body>}
      </>
    ),
  };
}

/* ═════════ THE BOUNDARY ═════════ */

export function useBoundaryStep({ onInteractive, done, prediction, source = { x: 3000, hs: 1000 } }: { onInteractive: (id: string) => void; done: boolean; prediction?: Prediction; source?: { x: number; hs: number } }): MikingStep {
  const [h, setH] = useState<number>(HEIGHTS[0]);
  const [x, setX] = useState(source.x);
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set([HEIGHTS[0]]));
  const [predicted, setPredicted] = useState<string | null>(null);
  const g = { h, x, hs: source.hs };
  const pth = paths(g);
  const n1 = firstNotch(g);
  const nPerp = h > 0 ? perpendicularNotch(h) : null;
  useEffect(() => {
    if (seen.size === HEIGHTS.length && !done) onInteractive('boundaryHeights');
  }, [seen, done, onInteractive]);
  const hWords = h === 0 ? 'at the surface (a boundary mic)' : h >= 100 ? `${h / 10} cm above the floor` : `${h / 10} cm above the floor`;
  const words = `A capsule ${hWords}; the source ${(x / 1000).toFixed(1)} m away, ${(source.hs / 1000).toFixed(1)} m up. The reflected path is ${Math.round(pth.extra)} mm longer than the direct one; ${n1 ? `the first notch of their sum is near ${fmtHz(n1)}` : 'the first notch is above the audio band'}.`;
  const box = { u0: -700, u1: x + 700, v0: -Math.max(source.hs, h) - 600, v1: Math.max(source.hs, 300) + 250 };
  return {
    key: 'boundary',
    title: 'A mic at the floor',
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, hh) => (
        <FieldStage
          w={w}
          h={hh}
          view="side"
          box={box}
          a11y={words}
          labels={[
            { id: 's', text: 'SOURCE', u: x, v: -source.hs - 260, align: 'center', tone: 'amber' },
            { id: 'img', text: 'ITS MIRROR IMAGE', short: 'IMAGE', u: x, v: source.hs + 160, align: 'center', tone: 'muted' },
            { id: 'fl', text: 'HARD FLOOR', short: 'FLOOR', u: -600, v: 180, align: 'left', tone: 'muted' },
          ]}
        >
          {(px) => <BoundarySection g={g} px={px} u0={-700} u1={x + 700} />}
        </FieldStage>
      ),
      badge: 'A simplified picture: blue = direct, amber = off the floor · a large hard floor, equal arrivals, no edges',
      bezel: [
        { k: 'HEIGHT', v: h === 0 ? 'AT FLOOR' : `${h / 10} cm`, flex: 0.9 },
        { k: 'EXTRA PATH', v: `${Math.round(pth.extra)} mm`, flex: 1 },
        { k: '1ST NOTCH', v: n1 ? fmtHz(n1) : 'ABOVE 20 kHz', tint: n1 && n1 < 2000 ? AMBER : GREEN, flex: 1.2 },
      ],
      params: [
        {
          kind: 'options',
          id: 'height',
          label: 'HEIGHT',
          valueLabel: h === 0 ? 'FLOOR' : `${h / 10} cm`,
          selectedId: String(h),
          sticky: true,
          onSelect: (v) => {
            const n = Number(v);
            setH(n);
            setSeen((s) => (s.has(n) ? s : new Set([...s, n])));
          },
          options: HEIGHTS.map((q) => ({ id: String(q), label: q === 0 ? 'At the surface — a boundary mic' : `${q / 10} cm above the floor`, blurb: q === 0 ? 'The capsule in its intended geometry at the surface: the two paths are the same length.' : `Sound arriving straight down would have its first notch near ${fmtHz(perpendicularNotch(q))}.` })),
        },
        { kind: 'fader', id: 'dist', label: 'SOURCE', value: (x - 1000) / 7000, onChange: (v) => setX(Math.round((1000 + v * 7000) / 100) * 100), format: () => `the source ${(x / 1000).toFixed(1)} m away`, formatShort: () => `${(x / 1000).toFixed(1)} m` },
      ],
      initialParam: 'dist',
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`Section · a capsule ${hWords}`} prompt="Choose each HEIGHT, and move the SOURCE nearer and farther. Watch the reflected path and where the first notch lands." />
        <NowLine text={words} />
        <Card>
          <Point title="TWO ARRIVALS">{`A raised capsule hears the sound straight AND off the floor a moment later — here ${Math.round(pth.extra)} mm more path. Summed, the two make a comb${n1 ? `, its first notch near ${fmtHz(n1)}` : ''}.${nPerp ? ` For sound arriving straight down, ${fmtHz(nPerp)}.` : ''}`}</Point>
          <Point title="AT THE SURFACE">The capsule in its intended boundary geometry: the paths are the same length, so the first notch leaves the audio band. Its usable range still depends on the surface’s size and nearby edges.</Point>
          <Point title="NOT A BOUNDARY MIC">A shotgun laid on foam on the floor is not a boundary mic. A soft mat is not a large hard surface. Footfalls and impacts can shake the surface itself.</Point>
        </Card>
        {seen.size === HEIGHTS.length ? <Note tone="ok">{`The lower the capsule, the higher the first notch — and at the surface it is gone from the audio band. Low profile does not mean safe for athlete contact: a floor position is a safety decision too. ${predicted ? `You predicted “${predicted}”.` : ''}`}</Note> : <Body>{`Heights tried: ${seen.size} of ${HEIGHTS.length}.`}</Body>}
      </>
    ),
  };
}

/* ═════════ THE PLANT ═════════ */

export function usePlantStep({ onInteractive, done }: { onInteractive: (id: string) => void; done: boolean }): MikingStep {
  const [mount, setMount] = useState<PlantMount>('rigid');
  const [seen, setSeen] = useState<ReadonlySet<PlantMount>>(() => new Set(['rigid']));
  useEffect(() => {
    if (seen.size === PLANT_IDS.length && !done) onInteractive('plantCompared');
  }, [seen, done, onInteractive]);
  const W = PLANT_WORDS[mount];
  return {
    key: 'plant',
    title: 'A mic on a structure',
    kind: 'COMPARE',
    layout: 'rack',
    rack: {
      render: (w, h) => (
        <FieldStage
          w={w}
          h={h}
          view="side"
          box={{ u0: -700, u1: 900, v0: -2000, v1: 120 }}
          a11y={`A padded support post struck high up; the vibration runs down it. ${W.label}: ${W.hears}`}
          labels={[
            { id: 'imp', text: 'IMPACT', u: 220, v: -1800, align: 'left', tone: 'muted' },
            { id: 'm', text: W.short, u: 420, v: -880, align: 'center', tone: 'amber' },
          ]}
        >
          {(px) => <PlantSection mount={mount} px={px} />}
        </FieldStage>
      ),
      badge: 'A simplified picture: red = the vibration path through the structure · drawn, never measured',
      bezel: [
        { k: 'MOUNT', v: W.short, flex: 1.2 },
        { k: 'HEARS', v: mount === 'isolated' ? 'MOSTLY AIR' : mount === 'rigid' ? 'AIR + STRUCTURE' : 'STRUCTURE', flex: 1.6 },
        { k: 'LOOKED AT', v: `${seen.size} / ${PLANT_IDS.length}`, flex: 1 },
      ],
      params: [
        {
          kind: 'options',
          id: 'mount',
          label: 'MOUNT',
          valueLabel: W.short,
          selectedId: mount,
          sticky: true,
          onSelect: (v) => {
            setMount(v as PlantMount);
            setSeen((s) => (s.has(v as PlantMount) ? s : new Set([...s, v as PlantMount])));
          },
          options: PLANT_IDS.map((q) => ({ id: q, label: PLANT_WORDS[q].label, blurb: PLANT_WORDS[q].hears })),
        },
      ],
      initialParam: 'mount',
    },
    well: (
      <>
        <Landing looking={`Section · ${W.label.toLowerCase()}`} prompt="Compare each MOUNT: where does the impact’s vibration go?" />
        <Card>
          <Point title="WHAT IT HEARS">{W.hears}</Point>
          <Point title="CHECK">{W.check}</Point>
        </Card>
        <Note tone="warn">A plant needs express approval and a reviewed fixture, installed by qualified venue people. Never drill, loosen or pad over protective equipment to fit one; never tap venue glass, boards, goals or baskets to test it.</Note>
      </>
    ),
  };
}
