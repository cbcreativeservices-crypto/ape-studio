/**
 * MALLET KEYBOARDS · Page 2 — HOW IT SOUNDS (LESSON_JOURNEY §6 stage 2), the
 * family's version of pages/PSound.tsx. FULLY SILENT: how a struck bar, its
 * tube (and, on a vibraphone, its fan) PRODUCE and RADIATE sound, shown with
 * real physics, never played (owner ruling).
 *
 *   STRIKE TO SOUND (rack)  PREDICT FIRST, then the four events on one bar
 *                           and its tube (MalletSound.BarStrike): STEP, or
 *                           PLAY ONCE — a staged reveal that stops at ④ (not
 *                           a loop, D8); PAUSE stops it. PEDAL shows the
 *                           damper touching the bar or clear of it.
 *   THE BAR'S SHAPES (rack) a plain bar in its first three shapes (the
 *                           free–free beam): still points, the ratio, and how
 *                           much a strike point drives each. SWING by hand.
 *   THE TUBE (rack)         any bar's tube at its true length: a quarter
 *                           wavelength, c ÷ 4f at the makers' A = 442 Hz;
 *                           the air moving most at the mouth.
 *   THE FANS (rack, vibraphone only) the fan at a tube's mouth: turned by
 *                           hand, or RUN for 8 seconds (finite, pausable).
 *   ATTACK AND BODY (read)  in words — then the three checks.
 * Credit: the strike sequence reached ④ + the three checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { fmtHz, fmtMetric } from '../../../engine/model/units.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { malletFamOf, malletWordsOf } from './family.ts';
import { malletGeom } from './malletModel.ts';
import { BAR_RATIOS, barNodes, barStrikeShare, freqHz, noteName, quarterWaveMm, type Bar } from './malletSpec.ts';
import { BarShapes, BarStrike, FanValve, TubeAir, type OneBar } from './MalletSound';

const STEP_MS = 1300;
const FAN_RUN_S = 8;

function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

const STRIKES = [
  { id: 'mid', label: 'THE MIDDLE', xi: 0.5, blurb: 'The middle of the bar — where the lowest shape moves most.' },
  { id: 'third', label: 'A THIRD OF THE WAY', xi: 1 / 3, blurb: 'A third of the way along the bar — between the middle and a still point.' },
  { id: 'end', label: 'NEAR AN END', xi: 0.06, blurb: 'Close to one end, beyond the cord.' },
] as const;

export function MSound({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const W = malletWordsOf(lesson).sound;
  const fam = malletFamOf(art);
  const G = malletGeom(fam);
  const v = G.layouts[variant] ? variant : fam.variants[0].row.id;
  const L = G.layouts[v];
  const row = L.row;
  const hasDamper = !!G.extras[v].damper;
  const variantLabel = lesson.model.variants.find((x) => x.id === variant)?.label ?? variant.toUpperCase();

  /* ── the bar every display uses: a middle natural, with its tube ── */
  const oneOf = (b: Bar): OneBar => ({ bar: b, tube: L.tubes.find((t) => t.key === b.key) ?? null, inst: row.inst, damper: hasDamper, caseBox: row.stand === 'case' });
  const midBar = L.naturals[Math.floor(L.naturals.length / 2)];
  const mid = useMemo(() => oneOf(midBar), [L]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── ① – ④ ── */
  const n = W.stages.length;
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const reveal = useSharedValue(1);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [predicted, setPredicted] = useState<string | null>(null);
  const [pedalDown, setPedalDown] = useState(true);
  useAnimatedReaction(
    () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
    (cur, prev) => {
      if (cur !== prev) scheduleOnRN(setShown, cur);
    },
  );
  const stop = () => {
    cancelAnimation(reveal);
    setPlaying(false);
  };
  const goTo = (k: number) => {
    cancelAnimation(reveal);
    setPlaying(false);
    reveal.value = k;
    setShown(k);
  };
  const play = () => {
    if (playing) {
      stop();
      return;
    }
    const from = shown >= n ? 1 : Math.floor(reveal.value);
    if (!motion) {
      goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
      return;
    }
    reveal.value = from;
    setPlaying(true);
    reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(setPlaying, false);
    });
  };

  /* ── the fan (vibraphone): an angle run for a few seconds, or turned by hand ── */
  const fanRow = fam.variants.find((x) => x.row.extras.fans)?.row ?? null;
  const fanL = fanRow ? G.layouts[fanRow.id] : null;
  const fanOne = useMemo<OneBar | null>(() => {
    if (!fanL) return null;
    const b = fanL.naturals[Math.floor(fanL.naturals.length / 2)];
    return { bar: b, tube: fanL.tubes.find((t) => t.key === b.key) ?? null, inst: fanL.row.inst, damper: false, caseBox: false };
  }, [fanL]);
  const angle = useSharedValue(Math.PI / 2);
  const [rpm, setRpm] = useState(90);
  const [spinning, setSpinning] = useState(false);
  const [turn, setTurn] = useState(0.25); // fraction of a turn, when stopped
  const fanStop = () => {
    cancelAnimation(angle);
    setSpinning(false);
    const a = angle.value % (2 * Math.PI);
    setTurn((a < 0 ? a + 2 * Math.PI : a) / (2 * Math.PI));
  };
  const fanRun = () => {
    if (spinning) {
      fanStop();
      return;
    }
    if (!motion) {
      // Reduced motion: a quarter turn, instantly.
      const t = (turn + 0.25) % 1;
      setTurn(t);
      angle.value = t * 2 * Math.PI;
      return;
    }
    setSpinning(true);
    const to = angle.value + 2 * Math.PI * (rpm / 60) * FAN_RUN_S;
    angle.value = withTiming(to, { duration: FAN_RUN_S * 1000, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(fanStop);
    });
  };

  // Covered (the what's-left screen) or out of focus: stop where it is.
  useEffect(() => {
    if (hidden || !focused) {
      if (playing) stop();
      if (spinning) fanStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, focused]);
  useEffect(
    () => () => {
      cancelAnimation(reveal);
      cancelAnimation(angle);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    if (shown >= n && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [shown, n, interactiveDone, onInteractive]);

  const stage = W.stages[shown - 1];
  const stageText = (i: number) => W.stages[i].byVariant?.[v] ?? W.stages[i].text;
  const setupParam: DockParam = {
    kind: 'options',
    id: 'setup',
    label: 'SETUP',
    valueLabel: variantLabel,
    selectedId: variant,
    onSelect: (id) => setVariant(id),
    options: lesson.model.variants.map((x) => ({ id: x.id, label: x.label, blurb: x.blurb })),
  };
  const strikeParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'step',
      label: 'STEP',
      value: (shown - 1) / Math.max(1, n - 1),
      onChange: (x) => goTo(1 + Math.round(x * (n - 1))),
      format: () => `${shown} of ${n} · ${stage.title.toLowerCase()}`,
      formatShort: () => `${shown} / ${n}`,
    },
    { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
    ...(hasDamper && W.pedal
      ? [
          {
            kind: 'options' as const,
            id: 'pedal',
            label: 'PEDAL',
            valueLabel: pedalDown ? 'DOWN' : 'UP',
            selectedId: pedalDown ? 'down' : 'up',
            onSelect: (id: string) => setPedalDown(id === 'down'),
            sticky: true,
            options: [
              { id: 'down', label: 'PEDAL DOWN — RINGING', blurb: W.pedal.down },
              { id: 'up', label: 'PEDAL UP — DAMPED', blurb: W.pedal.up },
            ],
          },
        ]
      : []),
    setupParam,
  ];
  const strikeBezel: BezelItem[] = [
    { k: 'EVENT', v: `${shown} / ${n}`, flex: 0.8 },
    ...W.cells.map((c) => {
      const at = c.byVariant?.[v] ?? c.at;
      return { k: c.k, v: at[Math.min(at.length - 1, shown - 1)] ?? '—', flex: c.flex ?? 1 };
    }),
  ];

  /* ── the bar's shapes ── */
  const [shapeIdx, setShapeIdx] = useState(0);
  const [swing, setSwing] = useState(1);
  const [strikeId, setStrikeId] = useState<string>('mid');
  const strike = STRIKES.find((s) => s.id === strikeId) ?? STRIKES[0];
  const share = barStrikeShare(shapeIdx, strike.xi);
  const sharePct = Math.round(share * 100);
  const stillCount = useMemo(() => barNodes(shapeIdx).length, [shapeIdx]);
  const shapeParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'shape',
      label: 'SHAPE',
      value: shapeIdx / 2,
      onChange: (x) => setShapeIdx(Math.round(x * 2)),
      format: () => `shape ${shapeIdx + 1} · ${barNodes(shapeIdx).length} still points`,
      formatShort: () => `${shapeIdx + 1} / 3`,
    },
    {
      kind: 'fader',
      id: 'swing',
      label: 'SWING',
      value: (swing + 1) / 2,
      home: 1,
      onChange: (x) => setSwing(Math.round((x * 2 - 1) * 20) / 20),
      format: () => (Math.abs(swing) < 0.05 ? 'passing through straight' : `${Math.round(Math.abs(swing) * 100)} % of its swing, ${swing > 0 ? 'middle down' : 'middle up'}`),
      formatShort: () => `${Math.round(swing * 100)} %`,
    },
    {
      kind: 'options',
      id: 'strike',
      label: 'STRIKE',
      valueLabel: strike.label,
      selectedId: strikeId,
      onSelect: setStrikeId,
      sticky: true,
      options: STRIKES.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
    },
  ];
  const shapeBezel: BezelItem[] = [
    { k: 'SHAPE', v: `${shapeIdx + 1}`, flex: 0.7 },
    { k: 'RATIO', v: `× ${BAR_RATIOS[shapeIdx].toFixed(2)}`, sub: 'plain bar', flex: 1 },
    { k: 'UNDER MALLET', v: `${sharePct} %`, sub: 'of its peak', tint: share < 0.05 ? '#ff6b5e' : undefined, flex: 1.2 },
    { k: 'STILL POINTS', v: `${stillCount}`, flex: 1 },
  ];

  /* ── the tube under any bar ── */
  const [barKey, setBarKey] = useState(midBar.key);
  const bars = L.bars;
  const bIdx = Math.max(0, bars.findIndex((b) => b.key === barKey));
  const chosen = bars[bIdx] ?? midBar;
  const chosenOne = useMemo(() => oneOf(chosen), [chosen, L]); // eslint-disable-line react-hooks/exhaustive-deps
  const [airSwing, setAirSwing] = useState(1);
  const qw = quarterWaveMm(chosen.key);
  const tube = chosenOne.tube;
  const tubeParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'bar',
      label: 'BAR',
      value: bars.length > 1 ? bIdx / (bars.length - 1) : 0,
      onChange: (x) => setBarKey(bars[Math.round(x * (bars.length - 1))].key),
      format: () => `${noteName(chosen.key)} · ${chosen.natural ? 'natural' : 'sharp / flat'} · bar ${bIdx + 1} of ${bars.length}`,
      formatShort: () => noteName(chosen.key),
    },
    {
      kind: 'fader',
      id: 'swing',
      label: 'SWING',
      value: (airSwing + 1) / 2,
      home: 1,
      onChange: (x) => setAirSwing(Math.round((x * 2 - 1) * 20) / 20),
      format: () => (Math.abs(airSwing) < 0.05 ? 'the air passing through rest' : `${Math.round(Math.abs(airSwing) * 100)} % of its swing`),
      formatShort: () => `${Math.round(airSwing * 100)} %`,
    },
    setupParam,
  ];
  const tubeBezel: BezelItem[] = [
    { k: 'NOTE', v: noteName(chosen.key), flex: 0.8 },
    { k: 'PITCH', v: fmtHz(freqHz(chosen.key)), sub: 'A = 442 Hz', flex: 1.1 },
    { k: 'QUARTER WAVE', v: fmtMetric(qw), sub: 'c ÷ 4f', flex: 1.2 },
    { k: 'UNDER IT', v: !tube ? 'NO TUBE' : tube.kind === 'helmholtz' ? 'A BOX' : `TUBE ${fmtMetric(tube.yBot - tube.yTop)}`, flex: 1.3 },
  ];

  /* ── the fans ── */
  const opensPerS = (2 * rpm) / 60;
  const openPct = Math.round((1 - Math.abs(Math.cos(turn * 2 * Math.PI))) * 100);
  const fanParams: DockParam[] = [
    { kind: 'action', id: 'run', label: spinning ? 'PAUSE' : motion ? `RUN ${FAN_RUN_S} s` : 'QUARTER TURN', onPress: fanRun, tint: colors.green },
    {
      kind: 'fader',
      id: 'speed',
      label: 'SPEED',
      value: (rpm - 25) / 125,
      onChange: (x) => setRpm(Math.round(25 + x * 125)),
      format: () => `${rpm} turns a minute (motors: about 25–150)`,
      formatShort: () => `${rpm} rpm`,
    },
    {
      kind: 'fader',
      id: 'turn',
      label: 'TURN',
      value: turn,
      onChange: (x) => {
        if (spinning) fanStop();
        setTurn(x);
        angle.value = x * 2 * Math.PI;
      },
      format: () => `${Math.round(turn * 360)}° of a turn · mouth ${openPct} % open`,
      formatShort: () => `${Math.round(turn * 360)}°`,
    },
  ];
  const fanBezel: BezelItem[] = [
    { k: 'SPEED', v: `${rpm}`, sub: 'turns / min', flex: 0.9 },
    { k: 'OPENS', v: `${opensPerS.toFixed(1)}`, sub: 'times / s', flex: 0.9 },
    { k: 'MOUTH', v: spinning ? 'TURNING' : `${openPct} % OPEN`, tint: !spinning && openPct > 80 ? '#5bff85' : undefined, flex: 1.3 },
  ];

  const pred = lesson.predictions.sound;
  const reached = shown >= n;
  const steps: MikingStep[] = [
    {
      key: 'strike',
      title: 'Strike to sound',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <BarStrike w={w} h={h} o={mid} reveal={reveal} shown={shown} damperUp={hasDamper && !pedalDown} accessibilityLabel={`One bar (${noteName(midBar.key)}) and the tube under it, seen from the low end. Event ${shown} of ${n}: ${stage.title}. ${stageText(shown - 1)}`} />,
        badge: 'The order of events, not their speed · bar motion drawn much larger than it really is · silent',
        bezel: strikeBezel,
        params: strikeParams,
        initialParam: 'step',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={W.looking} prompt="STEP through the stroke, or PLAY ONCE — it stops at the end. Nothing here makes a sound." />
          <Card>
            <Point title={`${shown} · ${stage.title.toUpperCase()}`}>{stageText(shown - 1)}</Point>
          </Card>
          {hasDamper && W.pedal ? <Note>{pedalDown ? W.pedal.down : W.pedal.up}</Note> : null}
          {reached && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. ${W.reveal}`}</Note> : null}
          {reached ? <Note>{W.after}</Note> : null}
        </>
      ),
    },
    {
      key: 'shapes',
      title: 'The bar’s shapes',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <BarShapes w={w} h={h} o={mid} shape={shapeIdx} swing={swing} strike={strike.xi} accessibilityLabel={`A plain bar from the side in its shape ${shapeIdx + 1}, with ${stillCount} still points; struck at ${strike.label.toLowerCase()}, it moves ${sharePct} percent of this shape's peak.`} />,
        badge: 'A simplified picture: a plain bar of even thickness · still points dashed · motion drawn larger',
        bezel: shapeBezel,
        params: shapeParams,
        initialParam: 'shape',
      },
      well: (
        <>
          <Landing looking={`A plain bar · shape ${shapeIdx + 1}`} prompt="Step through SHAPE, then try each STRIKE point. Which shape does a strike in the middle leave still?" />
          <Card>
            <Point title={`SHAPE ${shapeIdx + 1} · ${stillCount} STILL POINTS`}>
              {`${shapeIdx === 0 ? W.shapes.intro : `On a plain bar this shape rings at ${BAR_RATIOS[shapeIdx].toFixed(2)} times the lowest — not a whole number.`} Struck at ${strike.label.toLowerCase()}, the bar moves ${sharePct} % of this shape’s peak there, so the stroke ${share < 0.05 ? 'does not drive this shape at all: it lands on a still point' : share < 0.4 ? 'drives it only a little' : 'drives it strongly'}.`}
            </Point>
          </Card>
          <Note>{W.shapes.tuned}</Note>
          {W.shapes.notes.map((t) => (
            <Note key={t.slice(0, 24)}>{t}</Note>
          ))}
        </>
      ),
    },
    {
      key: 'tube',
      title: 'The tube under the bar',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <TubeAir w={w} h={h} o={chosenOne} swing={airSwing} accessibilityLabel={`The ${noteName(chosen.key)} bar and ${!tube ? 'no tube under it' : tube.kind === 'helmholtz' ? 'the box under it' : 'its tube'}, seen from the low end. A quarter wavelength at this pitch is about ${fmtMetric(qw)}.`} />,
        badge: 'Lengths to scale · air motion drawn larger · a quarter wavelength at 20 °C',
        bezel: tubeBezel,
        params: tubeParams,
        initialParam: 'bar',
      },
      well: (
        <>
          <Landing looking={`${noteName(chosen.key)} · seen from the low end`} prompt="Step BAR from one end of the keyboard to the other and watch the tube’s length follow the note. Drag SWING to see the air move." />
          <Card>
            <Point title={`${noteName(chosen.key)} · ${fmtHz(freqHz(chosen.key))}`}>{!tube ? W.tube.noTube : tube.kind === 'helmholtz' && W.tube.helmholtz ? W.tube.helmholtz.replace('{len}', fmtMetric(qw)) : W.tube.intro.replace('{len}', fmtMetric(qw))}</Point>
          </Card>
          <Note>{W.tube.visible}</Note>
        </>
      ),
    },
    ...(W.fan && fanOne
      ? [
          {
            key: 'fans',
            title: 'The fans',
            kind: 'TRY' as const,
            layout: 'rack' as const,
            rack: {
              render: (w: number, h: number) => <FanValve w={w} h={h} o={fanOne} angle={angle} accessibilityLabel={`A fan disc at a tube's mouth, seen along its shaft, at ${Math.round(turn * 360)} degrees: the mouth ${spinning ? 'opening and closing as it turns' : `${openPct} percent open`}. At ${rpm} turns a minute it opens the tube ${opensPerS.toFixed(1)} times a second.`} />,
              badge: `Seen along the shaft · real speed · runs ${FAN_RUN_S} s, then stops`,
              bezel: fanBezel,
              params: fanParams,
              initialParam: 'speed',
            },
            well: (
              <>
                <Landing looking={W.fan.looking} prompt={`Set SPEED, then RUN (it stops after ${FAN_RUN_S} seconds) — or turn the fan by hand with TURN.`} />
                <Card>
                  <Point title="OPEN, CLOSED, OPEN">{W.fan.card}</Point>
                </Card>
                <Body>{`At ${rpm} turns a minute the fan passes edge-on twice a turn: the tube opens about ${opensPerS.toFixed(1)} times a second.`}</Body>
                <Note>{W.fan.note}</Note>
              </>
            ),
          },
        ]
      : []),
    {
      key: 'body',
      title: 'Attack and body',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="ATTACK">{lesson.sound.attack}</Point>
            <Point title="BODY">{lesson.sound.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve for the instrument: how a real one sounds depends on the bars, the mallets, the player and the room. The pictures show where the sound comes from and where it leaves.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}
