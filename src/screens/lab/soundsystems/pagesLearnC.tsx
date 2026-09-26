/**
 * Sound Systems Lab — LEARN pages 16–22 (chapters 10–14 and the wrap).
 *
 * Chapter 10 · gain structure (the chain, live)
 * Chapter 11 · coverage; delay and alignment
 * Chapter 12 · processing and system tuning
 * Chapter 13 · feedback control
 * Chapter 14 · testing and troubleshooting (the source-forward method)
 * Wrap        · what you can now do, and where credit is earned
 *
 * Every page with a live display is a RACK page: instrument on the glass,
 * readouts on the bezel, controls in the dock (owner 2026-09-25).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, Line } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Card, Eyebrow, Lead, Prompt } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { computeGainChain, gainVerdict, gainVerdictCopy, type GainSettings, type GainStageId } from '../../../features/soundsystems/operate';
import { CALC_LINKS, combFirstNullHz, delayMs, speedOfSound } from '../../../features/soundsystems/loads';
import { slotDef } from '../../../features/soundsystems/system';
import { STATION_LABEL, STATION_ORDER, type Placed, type Station } from '../../../features/soundsystems/types';
import { levelColorForDb } from '../../../features/tools/levelColor';
import type { DockParam } from '../rack/rackTypes';
import { CalcLink, ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, ToolLink, useVisitGoals, VerdictLine } from './bits';
import { ChainMeterKey, ChainMeterStage } from './art/ChainMeter';
import { benchMap, MAP_H, MAP_W, ReadingKey, SystemMap, type MapNode } from './art/SystemMap';
import { FieldKey, PLOT_FS, PLOT_H, PLOT_W, PlotLabel, VenueView, type PlotBeam } from './art/VenueView';
import { PlanGlyph } from './art/planArt';
import { ArrivalTimeline, FeedbackLoop } from './art/diagrams';
import { BEAM_COLOR, PLOT_BADGE, THROW } from './plot';
import { gainBezel, gainStageParam } from './gainDock';
import { lanePos, laneVal, SoundSystemsRackLayout, type SsPageDef } from './rackLayout';
import { StageFit } from '../rack/StageFit';

/* ── 16 · Gain structure ────────────────────────────────────────────────── */

function PageGain({ ctx }: { ctx: PageCtx }) {
  const [settings, setSettings] = useState<GainSettings>({ preamp: 5, fader: 10, main: 10, procIn: 10, procOut: 0 });
  const [stage, setStage] = useState<GainStageId>('preamp');
  const [sawBad, setSawBad] = useState(false);
  const [sawOk, setSawOk] = useState(false);
  const chain = computeGainChain(settings);
  const verdict = gainVerdict(chain);
  if ((verdict === 'noisy' || verdict === 'clipping') && !sawBad) setSawBad(true);
  if (verdict === 'ok' && !sawOk) setSawOk(true);
  const goals = [{ label: 'See a bad structure (hiss or clipping)', hit: sawBad }, { label: 'Set unity with headroom at every stage', hit: sawOk }];
  const latched = useVisitGoals(ctx, goals);
  const params: DockParam[] = [gainStageParam(settings, setSettings, stage, setStage)];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: 'GAIN CHAIN — ILLUSTRATIVE MODEL · teaching values, not a specification',
        initialParam: 'stage',
        hideDragTag: true,
        bezel: gainBezel(chain, verdict),
        stage: (w, h) => <ChainMeterStage chain={chain} settings={settings} w={w} h={h} highlight={stage} />,
        params,
      }}
      caption="The lane is the PREAMP. Ride it up and watch the haze fall — then tap the key, pick each later stage, and bring it back to unity (double-tap the lane to land there)."
      wellTop={<VerdictLine ok={verdict === 'ok'} warn={verdict === 'quiet' || verdict === 'noisy'}>{gainVerdictCopy(verdict, chain)}</VerdictLine>}
    >
      <ChapterTag n={10}>GAIN STRUCTURE AND SIGNAL LEVELS</ChapterTag>
      <Body>The same vocal peak followed from the microphone to the loudspeaker, one meter per stage. Each meter has its clip line above and its noise floor rising from below. Right now the preamp is starved and every later stage is making up for it — read the grey haze.</Body>
      <Prompt>Raise the preamp, bring the faders and trims back to unity, and watch the haze fall.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <ChainMeterKey />
      <KeyFact>Every stage has a clip point above and a noise floor below; gain structure is the art of keeping the signal between them at EVERY stage — with the preamp doing the work and the faders near unity. The console’s nominal +4 dBu sits at about −18 dBFS on its digital meters.</KeyFact>
      <Card>
        <Eyebrow>THE VOCABULARY, ON THE METER</Eyebrow>
        <Body>Noise floor — the grey haze. Headroom — the bracket from the peak up to the red clip line. Signal-to-noise — the height of the signal above the haze. Unity — the control at 0, passing what it receives. Analog clipping flattens at a rail; digital clipping stops at 0 dBFS, and both light the same red CLIP indicator here. Gain-before-feedback and the power-up order belong to the next pages.</Body>
      </Card>
      <Card tone="note">
        <Eyebrow>ILLUSTRATIVE MODEL</Eyebrow>
        <Body>Level numbers and noise floors here are teaching values for a typical chain, not a specification. Read the real figures from your equipment’s data and its meters.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="GainLabHome" label="Gain Staging Lab — the full treatment" />
        <LabLink route="SoundSystemsOperate" label="OPERATE mode — set a whole system" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 17 · Coverage ──────────────────────────────────────────────────────── */

function PageCoverage({ ctx }: { ctx: PageCtx }) {
  const [cover, setCover] = useState(90);
  const [aim, setAim] = useState(18);
  const [flown, setFlown] = useState(false);
  const [fills, setFills] = useState(false);
  const [changedCover, setChangedCover] = useState(false);
  const [changedAim, setChangedAim] = useState(false);
  const goals = [{ label: 'Change the coverage angle', hit: changedCover }, { label: 'Change the aim', hit: changedAim }, { label: 'Fly the mains, then add front fills', hit: flown && fills }];
  const latched = useVisitGoals(ctx, goals);
  const L = slotDef('mainL');
  const R = slotDef('mainR');
  const rig = flown ? 'flown' : 'stack';
  const beams: PlotBeam[] = [
    { x: L.x, y: L.y, aimDeg: aim, coverDeg: cover, throw: THROW.top, rig, color: BEAM_COLOR.top, live: true },
    { x: R.x, y: R.y, aimDeg: -aim, coverDeg: cover, throw: THROW.top, rig, color: BEAM_COLOR.top, live: true },
    ...(fills
      ? [
          { x: slotDef('frontFillL').x, y: slotDef('frontFillL').y, aimDeg: 0, coverDeg: 90, gain: 0.06, throw: THROW.fill, color: BEAM_COLOR.fill, live: true },
          { x: slotDef('frontFillR').x, y: slotDef('frontFillR').y, aimDeg: 0, coverDeg: 90, gain: 0.06, throw: THROW.fill, color: BEAM_COLOR.fill, live: true },
        ]
      : []),
  ];
  const placed: Placed[] = [
    { id: 'l', kind: 'poweredSpeaker', slot: 'mainL' },
    { id: 'r', kind: 'poweredSpeaker', slot: 'mainR' },
    ...(fills ? [{ id: 'fl', kind: 'poweredSpeaker' as const, slot: 'frontFillL' as const }, { id: 'fr', kind: 'poweredSpeaker' as const, slot: 'frontFillR' as const }] : []),
  ];
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'cover',
      label: 'COVERAGE',
      value: lanePos(cover, 60, 120),
      onChange: (p) => {
        const c = laneVal(p, 60, 120, 5);
        if (c !== cover) {
          setCover(c);
          setChangedCover(true);
        }
      },
      format: (p) => `${laneVal(p, 60, 120, 5)}° horizontal · nominal (−6 dB)`,
      formatShort: (p) => `${laneVal(p, 60, 120, 5)}°`,
      home: lanePos(90, 60, 120),
    },
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: lanePos(aim, 0, 35),
      onChange: (p) => {
        const a = laneVal(p, 0, 35, 1);
        if (a !== aim) {
          setAim(a);
          setChangedAim(true);
        }
      },
      format: (p) => (laneVal(p, 0, 35, 1) === 0 ? 'straight ahead' : `${laneVal(p, 0, 35, 1)}° toed in`),
      formatShort: (p) => (laneVal(p, 0, 35, 1) === 0 ? 'STRAIGHT' : `${laneVal(p, 0, 35, 1)}° IN`),
      home: lanePos(18, 0, 35),
    },
    { kind: 'toggle', id: 'flown', label: 'FLOWN', value: flown, onToggle: () => setFlown((f) => !f) },
    { kind: 'toggle', id: 'fills', label: 'FILLS', value: fills, onToggle: () => setFills((f) => !f) },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: PLOT_BADGE,
        initialParam: 'cover',
        hideDragTag: true,
        bezel: [
          { k: 'COVERAGE', v: `${cover}°`, tint: colors.amber },
          { k: 'AIM', v: aim === 0 ? 'STRAIGHT' : `${aim}° IN`, tint: colors.amber },
          { k: 'RIG', v: flown ? 'FLOWN' : 'STACKED' },
          { k: 'FILLS', v: fills ? 'ON' : 'OFF', tint: fills ? colors.greenBright : undefined, flex: 0.8 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={PLOT_W / PLOT_H}>
            <VenueView placed={placed} beams={beams} field seam a11y={`Two mains with ${cover} degree coverage aimed ${aim} degrees inward${flown ? ', flown, with the near-field hole beneath them' : ''}${fills ? ', with front fills' : ''}`} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride COVERAGE and AIM and read the floor. Fly the mains: the front rows go dark. Add front fills: they come back."
    >
      <ChapterTag n={11}>LOUDSPEAKER PLACEMENT, COVERAGE AND ALIGNMENT</ChapterTag>
      <Body>Two mains at the deck corners, each drawn with its nominal (−6 dB) coverage sector; the floor is the two summed. Hatched floor is where both arrive and comb-filter.</Body>
      <FieldKey />
      <Prompt>Change the box, the aim and the rig, and read the floor.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card>
        <Eyebrow>READ THE PLOT</Eyebrow>
        <Body>A loudspeaker’s coverage angle is the width it serves within 6 dB of on-axis; outside that edge the level keeps falling, fast — nothing leaks sideways at a level that matters. Narrow coverage throws further and overlaps less; wide coverage fills a wide room and paints the side walls. Aiming inward tightens the overlap into the middle of the floor; aiming straight spreads it. Height and tilt — the vertical pattern — do the same job front-to-back, and are why flown or high-mounted mains need front fills: the near field beneath them is outside the vertical pattern.</Body>
      </Card>
      <KeyFact>Near field, far field, overlap, comb filtering, interference between loudspeakers — every one of them is geometry first. A microphone should never stand in a loudspeaker’s coverage; a listener should always stand in exactly one loudspeaker’s, or in two that have been aligned.</KeyFact>
      <DeeperRow>
        <LabLink route="SpeakerLab" label="Speaker Placement & Coverage — the full lab" />
        <LabLink route="WaveLab" label="Wave Physics — interference" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 18 · Delay and alignment ───────────────────────────────────────────── */

/** Where the delay towers stand on the plot for each distance option. */
const TOWER_Y: Record<number, number> = { 10: 178, 30: 216, 60: 258 };

function PageAlignment({ ctx }: { ctx: PageCtx }) {
  const [dist, setDist] = useState(30);
  const [temp, setTemp] = useState(20);
  const [setMs, setSetMs] = useState(0);
  const need = delayMs(dist, temp);
  const err = setMs - need;
  const aligned = Math.abs(err) <= 2;
  const goals = [{ label: 'Align the delays to within 2 ms', hit: aligned && setMs > 0 }, { label: 'Try all three distances', hit: false }];
  const [dists, setDists] = useState<Set<number>>(new Set([30]));
  goals[1].hit = dists.size >= 3;
  const latched = useVisitGoals(ctx, goals);
  const pathDiff = 1.2;
  const firstNull = combFirstNullHz(pathDiff, temp);
  const ty = TOWER_Y[dist];
  const L = slotDef('mainL');
  const R = slotDef('mainR');
  const DL = { x: slotDef('delayL').x, y: ty };
  const DR = { x: slotDef('delayR').x, y: ty };
  // The mains' wavefront at the moment the delay tower fires: it has
  // travelled (setMs / need) of the way to the tower. Aligned = it is AT the tower.
  const plotDist = Math.hypot(DL.x - L.x, DL.y - L.y);
  const ring = need > 0 ? plotDist * Math.min(1.6, setMs / need) : 0;
  const beams: PlotBeam[] = [
    { x: L.x, y: L.y, aimDeg: 18, coverDeg: 90, throw: THROW.top, color: BEAM_COLOR.top, live: true },
    { x: R.x, y: R.y, aimDeg: -18, coverDeg: 90, throw: THROW.top, color: BEAM_COLOR.top, live: true },
    { x: DL.x, y: DL.y, aimDeg: 0, coverDeg: 90, gain: 0.16, throw: THROW.delay, color: BEAM_COLOR.delay, live: true },
    { x: DR.x, y: DR.y, aimDeg: 0, coverDeg: 90, gain: 0.16, throw: THROW.delay, color: BEAM_COLOR.delay, live: true },
  ];
  const overlay = (
    <>
      {ring > 0
        ? [L, R].map((m, i) => <Circle key={i} cx={m.x} cy={m.y} r={ring} fill="none" stroke={aligned ? colors.greenBright : colors.amber} strokeWidth={1.2} opacity={0.75} strokeDasharray={aligned ? undefined : '4 3'} />)
        : null}
      {[DL, DR].map((d, i) => (
        <PlanGlyph key={i} kind="poweredSpeaker" id={`al-tower-${i}`} x={d.x} y={d.y} rotateDeg={0} rig="pole" highlight={aligned ? colors.greenBright : undefined} />
      ))}
      {/* A dimension line, mains to the delay row, the way a drawing gives a
          distance. The set / needed milliseconds are on the bezel (NEEDED ·
          SET · ERROR), so the plot no longer repeats them in small type. */}
      <Line x1={180} y1={L.y} x2={180} y2={ty} stroke={colors.textMuted} strokeWidth={0.8} strokeDasharray="2 3" />
      <Line x1={174} y1={L.y} x2={186} y2={L.y} stroke={colors.textMuted} strokeWidth={0.8} />
      <Line x1={174} y1={ty} x2={186} y2={ty} stroke={colors.textMuted} strokeWidth={0.8} />
      <PlotLabel x={186} y={(L.y + ty) / 2 + 4.5} fontSize={PLOT_FS} fill={aligned ? colors.greenBright : colors.textMuted} fontFamily={fonts.mono} textAnchor="start" letterSpacing={0}>{`${dist} m`}</PlotLabel>
    </>
  );
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'delay',
      label: 'DELAY',
      value: lanePos(setMs, 0, 300),
      onChange: (p) => setSetMs(laneVal(p, 0, 300, 1)),
      format: (p) => `${laneVal(p, 0, 300, 1)} ms set · ${need.toFixed(1)} ms needed`,
      formatShort: (p) => `${laneVal(p, 0, 300, 1)} ms`,
      tint: aligned && setMs > 0 ? colors.greenBright : colors.cyanBright,
    },
    {
      kind: 'options',
      id: 'dist',
      label: 'DISTANCE',
      valueLabel: `${dist} m`,
      options: [10, 30, 60].map((d) => ({ id: `${d}`, label: `${d} m from the mains to the delays` })),
      selectedId: `${dist}`,
      onSelect: (id) => {
        setDist(Number(id));
        setDists((s) => new Set(s).add(Number(id)));
      },
      sticky: true,
    },
    {
      kind: 'options',
      id: 'air',
      label: 'AIR',
      valueLabel: `${temp} °C`,
      options: [5, 20, 35].map((t) => ({ id: `${t}`, label: `${t} °C · sound at ${speedOfSound(t).toFixed(0)} m/s` })),
      selectedId: `${temp}`,
      onSelect: (id) => setTemp(Number(id)),
      sticky: true,
    },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: 'TIMING RING — ILLUSTRATIVE · delay from distance CALCULATED',
        initialParam: 'delay',
        hideDragTag: true,
        bezel: [
          { k: 'NEEDED', v: `${need.toFixed(1)} ms`, tint: colors.amber },
          { k: 'SET', v: `${setMs} ms`, tint: colors.cyanBright, flex: 0.9 },
          { k: 'ERROR', v: `${err > 0 ? '+' : ''}${err.toFixed(1)} ms`, tint: aligned && setMs > 0 ? colors.green : colors.orange },
          { k: 'SOUND', v: `${speedOfSound(temp).toFixed(0)} m/s` },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={PLOT_W / PLOT_H}>
            <VenueView
              placed={[
                { id: 'l', kind: 'poweredSpeaker', slot: 'mainL' },
                { id: 'r', kind: 'poweredSpeaker', slot: 'mainR' },
              ]}
              beams={beams}
              overlay={overlay}
              a11y={`Mains and delay loudspeakers ${dist} metres apart. Delay set ${setMs} milliseconds; ${need.toFixed(1)} needed. ${aligned ? 'Aligned.' : ''}`}
            />
          </StageFit>
        ),
        params,
      }}
      caption="Ride DELAY up until the ring reaches the towers and the two arrivals fuse. Then move the towers with DISTANCE and do it again."
      wellTop={
        <>
          <ArrivalTimeline needMs={need} setMs={setMs} />
          <VerdictLine ok={aligned && setMs > 0} warn={!aligned && setMs > 0}>
            {setMs === 0 ? 'Undelayed: the delay towers lead the mains and the ear hears two events — the fault on the bench.' : aligned ? 'Aligned. The two arrivals fuse; the back rows hear one system.' : err < 0 ? `Still ${(-err).toFixed(1)} ms early — the delays lead the mains.` : `${err.toFixed(1)} ms late — now the mains lead the delays.`}
          </VerdictLine>
        </>
      }
    >
      <ChapterTag n={11}>DELAY TIME, TIME ALIGNMENT AND POLARITY</ChapterTag>
      <Body>{`Mains at the stage, delay towers on poles ${dist} m back. The ring is the mains’ wavefront at the instant the towers fire: aligned means it has just reached them.`}</Body>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>FROM THE CALCULATOR</Eyebrow>
        <Text style={styles.path}>t = d ÷ c · c = 331.3 × √(1 + T/273.15)</Text>
        <Body>Sound travels about {speedOfSound(temp).toFixed(0)} m/s at {temp} °C — roughly 2.9 ms per metre. Acoustic delay is the distance; electronic delay is what you add to match it. Warm air is faster, so a delay set at soundcheck in the afternoon drifts by evening — measure again.</Body>
        <Body>Many engineers then add 5–10 ms MORE on purpose: with the mains arriving first, the ear localises to the stage and the delay tower disappears (the precedence effect). Align first, then decide.</Body>
      </Card>
      <Card>
        <Eyebrow>POLARITY, PHASE AND THE SUBWOOFER CROSSOVER</Eyebrow>
        <Body>Polarity is a flip (the whole waveform inverted); phase is a time offset that varies with frequency. Two tops in opposite polarity cancel their low end down the centre. Subs and tops are aligned at the crossover frequency so their outputs add there: a path difference of just {pathDiff} m puts the first cancellation at about {Math.round(firstNull)} Hz — the crossover region is exactly where a small misalignment costs the most.</Body>
      </Card>
      <DeeperRow>
        <CalcLink id={CALC_LINKS.delay.workspace} label="Delay from distance" />
        <CalcLink id={CALC_LINKS.comb.workspace} label="Comb filter from a path difference" />
        <CalcLink id="phase" label="Phase from time and distance" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 19 · Processing and tuning ─────────────────────────────────────────── */

const PROC_BLOCKS: readonly { id: string; name: string; what: string; where: string }[] = [
  { id: 'inputEq', name: 'Input EQ vs system EQ', what: 'Channel EQ shapes ONE source for the mix. System EQ shapes the whole system for the room — and belongs in the processor, not on every channel.', where: 'Channel strip · Processor' },
  { id: 'hpf', name: 'High-pass filters', what: 'On every channel with nothing useful below 80–120 Hz, and on the system outputs to protect the tops. The most effective processor in live sound and the least glamorous.', where: 'Channel · Processor outputs' },
  { id: 'xover', name: 'Crossovers', what: 'Split the band between subs and tops at 80–120 Hz with matched slopes. The alignment between the two is set here, in time and polarity.', where: 'Processor' },
  { id: 'peq', name: 'Parametric EQ', what: 'Frequency, gain and Q — surgical cuts at the room’s problem frequencies, wide gentle shelves for tonal balance. Cuts before boosts.', where: 'Processor · Channel' },
  { id: 'geq', name: 'Graphic EQ', what: 'Fixed bands at fixed widths. Fast for ringing out a wedge, coarse for tuning a system; heavy graphic EQ leaves phase and tone worse than the problem it fixed.', where: 'Monitor outputs' },
  { id: 'delay', name: 'Delay', what: 'Time alignment for fills, delays and subs — set from the distance, verified by measurement.', where: 'Processor outputs' },
  { id: 'polarity', name: 'Polarity', what: 'A flip per output, to bring a reversed cabinet or a crossover region back into agreement.', where: 'Processor outputs' },
  { id: 'limiter', name: 'Limiters', what: 'The loudspeaker’s insurance, set from the cabinet’s ratings and the amplifier’s gain — never by ear on the night.', where: 'Processor outputs' },
  { id: 'presets', name: 'System presets', what: 'The manufacturer’s crossover, EQ and limiter settings for a cabinet-amplifier pairing. The starting point, not the end.', where: 'Processor' },
];

function PageProcessing({ ctx }: { ctx: PageCtx }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const goals = [{ label: 'Open six processing blocks', hit: open.size >= 6 }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={12}>PROCESSING AND SYSTEM TUNING</ChapterTag>
      <Body>Nine processing blocks and where each one lives — in the channel strip, in the processor, or on the monitor outputs.</Body>
      <View style={styles.tiles}>
        {PROC_BLOCKS.map((b) => {
          const o = open.has(b.id);
          return (
            <Pressable key={b.id} onPress={() => setOpen((s) => new Set(s).add(b.id))} style={[styles.block, o && styles.blockOpen]} accessibilityRole="button" accessibilityState={{ expanded: o }} aria-expanded={o} accessibilityLabel={`${b.name}${o ? `. ${b.what}` : ''}`}>
              <Text style={[styles.blockName, o && { color: colors.cyanBright }]}>{o ? '✓ ' : ''}{b.name}</Text>
              <Text style={styles.blockWhere}>{b.where}</Text>
              {o ? <Text style={styles.blockWhat}>{b.what}</Text> : null}
            </Pressable>
          );
        })}
      </View>
      <Prompt>Open each block.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card>
        <Eyebrow>THE TUNING SESSION</Eyebrow>
        <Body>1 · Recall the cabinet presets and confirm the limiters. 2 · Verify polarity and the sub-to-top alignment at the crossover. 3 · Align the front fills and the delays to the mains, from measured distance and then by measurement. 4 · Measure at a reference position — not the mix position alone — and apply broad system EQ. 5 · Walk the room with pink noise and music; adjust for consistency, not for one perfect seat. 6 · Listen to material you know. 7 · Save the configuration and name it for the room.</Body>
      </Card>
      <KeyFact>Tuning is measurement plus listening. RTA shows what the microphone hears; a transfer function shows what the SYSTEM changed. Tune with the second, confirm with the first, decide with your ears walking the room — and remember that the phone in your hand is not a measurement microphone.</KeyFact>
      <DeeperRow>
        <ToolLink toolKey="rta" label="RTA tool" />
        <ToolLink toolKey="spl" label="SPL meter" />
        <ToolLink toolKey="spectrogram" label="Spectrogram" />
        <LabLink route="EqLabHome" label="EQ Lab" />
      </DeeperRow>
    </View>
  );
}

/* ── 20 · Feedback control ──────────────────────────────────────────────── */

function PageFeedback({ ctx }: { ctx: PageCtx }) {
  const [send, setSend] = useState(-12);
  const [position, setPosition] = useState<'null' | 'live'>('live');
  const [notched, setNotched] = useState(false);
  const [rang, setRang] = useState(false);
  const [fixed, setFixed] = useState(false);
  // Gain-before-feedback in this illustrative model: geometry buys 12 dB, a
  // narrow notch buys 4 more. The loop rings when the send exceeds it.
  const gbf = (position === 'null' ? 0 : -12) + (notched ? 4 : 0);
  const ringing = send > gbf;
  const margin = gbf - send;
  useEffect(() => {
    if (ringing) setRang(true);
    if (rang && !ringing && send >= -6) setFixed(true);
  }, [ringing, rang, send]);
  const goals = [{ label: 'Push the wedge into feedback', hit: rang }, { label: 'Get the send to −6 dB or louder WITHOUT ringing', hit: fixed }];
  const latched = useVisitGoals(ctx, goals);
  const ringHz = 2500;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'send',
      label: 'SEND',
      value: lanePos(send, -30, 10),
      onChange: (p) => setSend(laneVal(p, -30, 10, 1)),
      format: (p) => `${laneVal(p, -30, 10, 1) > 0 ? '+' : ''}${laneVal(p, -30, 10, 1)} dB to the wedge`,
      formatShort: (p) => `${laneVal(p, -30, 10, 1) > 0 ? '+' : ''}${laneVal(p, -30, 10, 1)} dB`,
      level: true,
      home: lanePos(0, -30, 10),
    },
    {
      kind: 'options',
      id: 'wedge',
      label: 'WEDGE',
      valueLabel: position === 'live' ? 'Live angle' : 'In the null',
      options: [
        { id: 'live', label: 'In the live angle', blurb: 'Off to the side, inside the microphone’s pickup: the microphone hears the wedge almost as well as the singer.' },
        { id: 'null', label: 'In the null', blurb: 'Directly behind a cardioid microphone, where its pickup is weakest: 12 dB more gain before the loop rings, in this model.' },
      ],
      selectedId: position,
      onSelect: (id) => setPosition(id as 'null' | 'live'),
      sticky: true,
    },
    { kind: 'toggle', id: 'notch', label: `NOTCH ${ringHz / 1000} k`, value: notched, onToggle: () => setNotched((n) => !n) },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        badge: 'FEEDBACK LOOP — ILLUSTRATIVE MODEL · placement buys 12 dB, a notch 4',
        initialParam: 'send',
        hideDragTag: true,
        bezel: [
          { k: 'SEND', v: `${send > 0 ? '+' : ''}${send} dB`, tint: levelColorForDb(send, -30, 6) },
          { k: 'LOOP LIMIT', v: `${gbf > 0 ? '+' : ''}${gbf} dB`, tint: colors.red, flex: 1.1 },
          { k: 'MARGIN', v: ringing ? `${-margin} dB OVER` : `${margin} dB`, tint: ringing ? colors.red : colors.green, flex: 1.1 },
          { k: 'LOOP', v: ringing ? 'RINGING' : 'STABLE', tint: ringing ? colors.red : colors.green },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={354 / 168}>
            <FeedbackLoop wedge={position} ringing={ringing} sendDb={send} />
          </StageFit>
        ),
        params,
      }}
      caption="Ride SEND up until the loop rings. Then move the WEDGE into the null and try again."
      wellTop={
        <View style={styles.gbfWrap} accessible accessibilityLabel={`Monitor send ${send} dB; gain before feedback ${gbf} dB; ${ringing ? 'ringing' : `${margin} dB of margin`}`}>
          <View style={styles.gbfBar}>
            <View style={[styles.gbfFill, { width: `${((send + 30) / 40) * 100}%`, backgroundColor: ringing ? colors.red : levelColorForDb(send, -30, 6) }]} />
            <View style={[styles.gbfMark, { left: `${((gbf + 30) / 40) * 100}%` }]} />
          </View>
          <Text style={[styles.gbfText, ringing && { color: colors.red }]}>{ringing ? `RINGING at ~${ringHz} Hz — ${-margin} dB over the loop limit` : `${margin} dB of margin before the loop rings · the red mark is the limit`}</Text>
        </View>
      }
    >
      <ChapterTag n={13}>FEEDBACK CONTROL</ChapterTag>
      <Body>From above: the performer at the microphone, the microphone’s cardioid pattern, and the wedge — currently off to the side, inside the live angle. The dashed path is the loop: microphone → console → amplifier → wedge → air → microphone.</Body>
      <Prompt>Push the send up until it rings. Then move the wedge into the null and try again.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>THE ORDER OF OPERATIONS</Eyebrow>
        <Body>1 · Placement: the wedge in the microphone’s null — directly behind a cardioid; at 110–125° off axis for a hypercardioid, whose rear has a small live lobe — and the mains in front of the microphones, never behind. 2 · Polar pattern and technique: a tighter pattern and a closer mouth both raise the ratio of voice to loop. 3 · Stage volume: a quieter stage needs quieter wedges. 4 · Level: the send at what the performer needs, not more. 5 · Identify the ringing frequency on the analyser and apply a NARROW cut. 6 · Automatic feedback suppressors, if used, as a safety net — not a substitute for the first four.</Body>
      </Card>
      <KeyFact>Feedback is a loop, and it takes off at the one frequency where the gain around the loop passes unity. Gain-before-feedback is how much level you can add before that happens — spent first by geometry, then by level, and only last by an equaliser.</KeyFact>
      <Card tone="warn">
        <Eyebrow>WHEN IT HAPPENS DURING A PERFORMANCE</Eyebrow>
        <Body>Pull the offending send or channel down first — a hand on the fader beats a search for the frequency. Mute unused microphones as a habit. Then find the frequency and notch it while the room is quiet. Excessive graphic EQ to “fix” feedback leaves a wedge that sounds hollow and still rings somewhere else.</Body>
      </Card>
      <UnderstandingCheck
        question="A wedge rings as the send comes up. Which change buys the MOST gain-before-feedback?"
        options={['Moving the wedge into the microphone’s null', 'Cutting six bands on the graphic EQ', 'Raising the amplifier level', 'Adding compression to the vocal']}
        correct={0}
        explain="Geometry first: placement changes how much of the loudspeaker the microphone hears at every frequency at once. An equaliser can only treat the frequencies it finds, one at a time, at a tonal cost."
      />
    </SoundSystemsRackLayout>
  );
}

/* ── 21 · The source-forward method ─────────────────────────────────────── */

const METHOD_START: Station = 'consoleIn';
const METHOD_FAULT: Station = 'processor';

function PageMethod({ ctx }: { ctx: PageCtx }) {
  const [probed, setProbed] = useState<Station[]>([]);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const done = probed.includes(METHOD_FAULT);
  const goals = [{ label: 'Run the forward walk to the fault', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const walk = STATION_ORDER.slice(STATION_ORDER.indexOf(METHOD_START));
  useEffect(() => {
    if (!running) return;
    const next = walk[probed.length];
    if (!next || probed.includes(METHOD_FAULT)) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(() => setProbed((p) => [...p, next]), ctx.reduceMotion ? 0 : 520);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, probed, ctx.reduceMotion, walk]);
  const base = useMemo(() => benchMap({}, {}), []);
  const f = STATION_ORDER.indexOf(METHOD_FAULT);
  const nodes: MapNode[] = base.nodes.map((n) => {
    const s = n.id as Station;
    const i = STATION_ORDER.indexOf(s);
    const isProbed = probed.includes(s);
    return { ...n, state: !isProbed ? 'unknown' : i < f ? 'ok' : 'none', value: !isProbed ? undefined : i < f ? 'OK' : 'NO SIGNAL', dark: done && i > f };
  });
  const lastProbed = probed[probed.length - 1];
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'walk',
      label: 'WALK',
      value: lanePos(probed.length, 0, walk.length),
      onChange: (p) => {
        const k = laneVal(p, 0, walk.length, 1);
        if (k !== probed.length) {
          setRunning(false);
          setProbed(walk.slice(0, k));
        }
      },
      format: (p) => {
        const k = laneVal(p, 0, walk.length, 1);
        return k === 0 ? 'nothing read yet' : `${k} station${k === 1 ? '' : 's'} read · at ${STATION_LABEL[walk[k - 1]]}`;
      },
      formatShort: (p) => `${laneVal(p, 0, walk.length, 1)} / ${walk.length}`,
      tint: colors.cyanBright,
    },
    { kind: 'action', id: 'run', label: running ? '… WALKING' : done ? 'WALK AGAIN' : '▶ RUN', onPress: () => { setProbed([]); setRunning(true); }, tint: colors.green },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: 'THE WALK — ILLUSTRATIVE · readings from the fault library',
        initialParam: 'walk',
        hideDragTag: true,
        bezel: [
          { k: 'START', v: STATION_LABEL[METHOD_START].toUpperCase(), flex: 1.4 },
          { k: 'READ', v: `${probed.length} / ${walk.length}`, flex: 0.8 },
          { k: 'LAST', v: lastProbed ? STATION_LABEL[lastProbed].toUpperCase() : '—', tint: colors.cyanBright, flex: 1.4 },
          { k: 'FAULT', v: done ? 'FOUND' : '—', tint: done ? colors.green : undefined, flex: 0.8 },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={MAP_W / MAP_H}>
            <SystemMap nodes={nodes} edges={base.edges.map((e) => ({ ...e, dead: done && STATION_ORDER.indexOf(e.to as Station) > f }))} running={false} selectedId={probed.length ? probed[probed.length - 1] : METHOD_START} a11y="The nine stations of the walk. Run the walk to watch the console read healthy and the processor read no signal." />
          </StageFit>
        ),
        params,
      }}
      caption="Ride WALK forward one station at a time and watch where the reading changes — or press RUN and watch the walk happen."
      wellTop={
        done ? (
          <VerdictLine ok>Console in: healthy. Console out: healthy. Processor: nothing. Three probes, one answer, no boxes swapped.</VerdictLine>
        ) : (
          <Body>{probed.length ? `${probed.length} station${probed.length === 1 ? '' : 's'} read so far.` : 'Nothing read yet.'}</Body>
        )
      }
    >
      <ChapterTag n={14}>TESTING AND TROUBLESHOOTING · THE METHOD</ChapterTag>
      <Body>“The PA is dead — but every channel meter is dancing.” The meters have already vouched for the source, the cable and the stagebox, so the walk starts at the console input and goes forward.</Body>
      <ReadingKey />
      <Prompt>Run the walk and watch where the reading changes.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <KeyFact>The amateur swaps the amplifier. The professional starts where the symptom leaves doubt, walks forward reading each station, and stops at the first reading that changes. That station is the fault — or the place it became visible. Probe forward, never backward: re-probe a station if you must, but never jump toward the loudspeaker on a hunch. The bench grades the walk as well as the answer.</KeyFact>
      <Card>
        <Eyebrow>WHAT A PROBE IS</Eyebrow>
        <Body>A meter, an LED, a pair of headphones, a cable tester, a swap to a known-good part — whatever answers “is the signal healthy HERE?” for that station. Reading it is the skill; owning it is the kit.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="SoundSystemsTroubleshoot" label="TROUBLESHOOT mode — 22 faults on the bench" />
        <LabLink route="MeterModule" label="Signal Detective" params={{ id: 'detective' }} />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 22 · Wrap ──────────────────────────────────────────────────────────── */

function PageWrap({ ctx }: { ctx: PageCtx }) {
  useEffect(() => {
    if (!ctx.isDone) ctx.markDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={14}>WHAT YOU CAN NOW DO</ChapterTag>
      <Lead>
        You can name every section of a live sound reinforcement system and say what feeds it. You can pick a system type for a venue and an output configuration for a room. You know which routing tool does which job, what reaches a subwoofer under each feed, how a monitor mix must be tapped, which connections are silent and which are dangerous, what an amplifier can and cannot drive, how a system is deployed, gain-structured, aligned, tuned and rung out — and how a fault is found.
      </Lead>
      <Card tone="ok">
        <Eyebrow>THE FOUR OTHER MODES</Eyebrow>
        <Body>BUILD puts the gear on a venue plot and checks every link. ROUTE puts the console under your fingers. OPERATE walks power-up, line check, gain and shutdown. TROUBLESHOOT puts twenty-two faults on the bench. The lab’s home page lists what is still outstanding for credit.</Body>
      </Card>
      <Card>
        <Eyebrow>NEXT</Eyebrow>
        <Body>The understanding check follows this page. Every question must be answered correctly; retry until it is — a wrong answer is a question you have not finished yet.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="SoundSystemsLab" label="Lab home — what is left" />
      </DeeperRow>
    </View>
  );
}

export const SS_LEARN_PAGES_C: SsPageDef[] = [
  { title: 'Gain structure', short: 'GAIN', Component: PageGain, manualDone: true, rack: true },
  { title: 'Coverage and aim', short: 'COVER', Component: PageCoverage, manualDone: true, rack: true },
  { title: 'Delay and alignment', short: 'ALIGN', Component: PageAlignment, manualDone: true, rack: true },
  { title: 'Processing and tuning', short: 'TUNE', Component: PageProcessing, manualDone: true },
  { title: 'Feedback control', short: 'FEEDBACK', Component: PageFeedback, manualDone: true, rack: true },
  { title: 'The source-forward method', short: 'METHOD', Component: PageMethod, manualDone: true, rack: true },
  { title: 'What you can now do', short: 'WRAP', Component: PageWrap, manualDone: true },
];

const styles = StyleSheet.create({
  path: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.5, lineHeight: 17 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  block: { minWidth: 140, flexGrow: 1, flexBasis: '45%', borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, gap: 3, minHeight: 48 },
  blockOpen: { borderColor: '#2f4a5a', backgroundColor: '#0f1a22', flexBasis: '100%' },
  blockName: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6 },
  blockWhere: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1.2 },
  blockWhat: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  gbfWrap: { gap: 6 },
  gbfBar: { height: 14, borderRadius: 7, backgroundColor: '#050609', borderWidth: 1, borderColor: '#1f2229', overflow: 'hidden' },
  gbfFill: { height: '100%', borderRadius: 7 },
  gbfMark: { position: 'absolute', top: -2, width: 2, height: 18, backgroundColor: colors.red },
  gbfText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6 },
});
