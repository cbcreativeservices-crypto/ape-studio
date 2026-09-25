/**
 * Sound Systems Lab — LEARN pages 16–22 (chapters 10–14 and the wrap).
 *
 * Chapter 10 · gain structure (the chain, live)
 * Chapter 11 · coverage; delay and alignment
 * Chapter 12 · processing and system tuning
 * Chapter 13 · feedback control
 * Chapter 14 · testing and troubleshooting (the source-forward method)
 * Wrap        · what you can now do, and where credit is earned
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import { computeGainChain, gainVerdict, gainVerdictCopy, type GainSettings, type GainStageId } from '../../../features/soundsystems/operate';
import { CALC_LINKS, combFirstNullHz, delayMs, speedOfSound } from '../../../features/soundsystems/loads';
import { slotDef } from '../../../features/soundsystems/system';
import { STATION_LABEL, STATION_ORDER, type Station } from '../../../features/soundsystems/types';
import { levelColorForDb } from '../../../features/tools/levelColor';
import { CalcLink, ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, Readout, ReadoutRow, ToolLink, useVisitGoals, VerdictLine } from './bits';
import { ChainMeter } from './art/ChainMeter';
import { SystemDiagram, type DiagramStation } from './art/SystemDiagram';
import { VenueView, type PlotBeam } from './art/VenueView';
import { PLOT_BADGE } from './plot';

/* ── 16 · Gain structure ────────────────────────────────────────────────── */

function PageGain({ ctx }: { ctx: PageCtx }) {
  const [settings, setSettings] = useState<GainSettings>({ preamp: 12, fader: 8, main: 6, procIn: 8, procOut: 4 });
  const [sawBad, setSawBad] = useState(false);
  const [sawOk, setSawOk] = useState(false);
  const chain = computeGainChain(settings);
  const verdict = gainVerdict(chain);
  if ((verdict === 'noisy' || verdict === 'clipping') && !sawBad) setSawBad(true);
  if (verdict === 'ok' && !sawOk) setSawOk(true);
  const goals = [{ label: 'See a bad structure (hiss or clipping)', hit: sawBad }, { label: 'Set unity with headroom at every stage', hit: sawOk }];
  const latched = useVisitGoals(ctx, goals);
  const last = chain[chain.length - 1];
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={10}>GAIN STRUCTURE AND SIGNAL LEVELS</ChapterTag>
      <Lead>
        The same peak, followed from the microphone to the loudspeaker. Every stage has a clip point above and a noise floor below; gain structure is the art of keeping the signal between them at EVERY stage — with the preamp doing the work and the faders near unity.
      </Lead>
      <ChainMeter chain={chain} settings={settings} onChange={(id: GainStageId, db: number) => setSettings((s) => ({ ...s, [id]: db }))} />
      <ReadoutRow>
        <Readout k="AT THE LOUDSPEAKER" v={`${Math.round(last.levelDbu)} dBu`} tint={levelColorForDb(last.levelDbu, -40, 20)} />
        <Readout k="SIGNAL ABOVE NOISE" v={`${Math.round(last.snrDb)} dB`} tint={last.snrDb < 60 ? colors.orange : colors.green} />
        <Readout k="VERDICT" v={verdict.toUpperCase()} tint={verdict === 'ok' ? colors.green : verdict === 'clipping' ? colors.red : colors.orange} />
      </ReadoutRow>
      <VerdictLine ok={verdict === 'ok'} warn={verdict === 'quiet' || verdict === 'noisy'}>{gainVerdictCopy(verdict, chain)}</VerdictLine>
      <Prompt>Right now the preamp is starved and every later stage is making up for it. Raise the preamp, bring the rest back to unity, and watch the grey noise haze fall.</Prompt>
      <Card>
        <Eyebrow>THE VOCABULARY, ON THE METER</Eyebrow>
        <Body>Noise floor — the grey haze. Headroom — the gap between the signal and the red clip line. Signal-to-noise — the height of the signal above the haze. Unity — the control at 0, passing what it receives. Analog clipping flattens at a rail; digital clipping stops at 0 dBFS, and both are the same red on this meter. Gain-before-feedback and the power-up order belong to the next pages.</Body>
      </Card>
      <Card tone="note">
        <Eyebrow>ILLUSTRATIVE MODEL</Eyebrow>
        <Body>Level numbers and noise floors here are teaching values for a typical chain, not a specification. Read the real figures from your equipment’s data and its meters.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="GainLabHome" label="Gain Staging Lab — the full treatment" />
        <LabLink route="SoundSystemsOperate" label="OPERATE mode — set a whole system" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 17 · Coverage ──────────────────────────────────────────────────────── */

function PageCoverage({ ctx }: { ctx: PageCtx }) {
  const [cover, setCover] = useState(90);
  const [aim, setAim] = useState(18);
  const [fills, setFills] = useState(false);
  const [changedCover, setChangedCover] = useState(false);
  const [changedAim, setChangedAim] = useState(false);
  const goals = [{ label: 'Change the coverage angle', hit: changedCover }, { label: 'Change the aim', hit: changedAim }, { label: 'Add front fills', hit: fills }];
  const latched = useVisitGoals(ctx, goals);
  const L = slotDef('mainL');
  const R = slotDef('mainR');
  const beams: PlotBeam[] = [
    { x: L.x, y: L.y, aimDeg: aim, coverDeg: cover, color: colors.amber },
    { x: R.x, y: R.y, aimDeg: -aim, coverDeg: cover, color: colors.amber },
    ...(fills
      ? [
          { x: slotDef('frontFillL').x, y: slotDef('frontFillL').y, aimDeg: 0, coverDeg: 90, gain: 0.35, color: colors.greenBright },
          { x: slotDef('frontFillR').x, y: slotDef('frontFillR').y, aimDeg: 0, coverDeg: 90, gain: 0.35, color: colors.greenBright },
        ]
      : []),
  ];
  const placed = [
    { id: 'l', kind: 'poweredSpeaker' as const, slot: 'mainL' as const },
    { id: 'r', kind: 'poweredSpeaker' as const, slot: 'mainR' as const },
    ...(fills ? [{ id: 'fl', kind: 'poweredSpeaker' as const, slot: 'frontFillL' as const }, { id: 'fr', kind: 'poweredSpeaker' as const, slot: 'frontFillR' as const }] : []),
  ];
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={11}>LOUDSPEAKER PLACEMENT, COVERAGE AND ALIGNMENT</ChapterTag>
      <Lead>
        A loudspeaker’s coverage angle is the width of the audience it can serve evenly; its aim decides who is inside that width. Two mains overlap down the middle — where the same signal arrives twice from different distances and comb-filters — and miss the front rows beneath them.
      </Lead>
      <VenueView placed={placed} beams={beams} field badge={PLOT_BADGE} a11y={`Two mains with ${cover} degree coverage aimed ${aim} degrees inward${fills ? ', with front fills' : ''}`} caption="Amber: the mains. Green: front fills. The floor tint sums them in the conceptual model — brighter is louder, and the middle is where two arrivals overlap." />
      <Row>
        <Text style={styles.ctlLabel}>COVERAGE</Text>
        {[60, 90, 120].map((c) => (
          <Btn key={c} label={`${c}°`} selected={cover === c} tone={cover === c ? 'primary' : 'plain'} onPress={() => { setCover(c); setChangedCover(true); }} a11y={`${c} degree horizontal coverage`} />
        ))}
      </Row>
      <Row>
        <Text style={styles.ctlLabel}>AIM</Text>
        {[0, 18, 35].map((a) => (
          <Btn key={a} label={a === 0 ? 'STRAIGHT' : `${a}° IN`} selected={aim === a} tone={aim === a ? 'primary' : 'plain'} onPress={() => { setAim(a); setChangedAim(true); }} a11y={a === 0 ? 'Aim straight ahead' : `Aim ${a} degrees inward`} />
        ))}
        <Btn label={fills ? '● FRONT FILLS' : '○ FRONT FILLS'} selected={fills} onPress={() => setFills((f) => !f)} a11y={`Front fills ${fills ? 'on' : 'off'}`} />
      </Row>
      <Card>
        <Eyebrow>READ THE PLOT</Eyebrow>
        <Body>Narrow coverage throws further and overlaps less; wide coverage fills a wide room and paints the side walls. Aiming inward tightens the overlap zone into the middle of the floor; aiming straight spreads it. Height and tilt — the vertical dispersion — do the same job front-to-back, and are why flown mains need front fills: the near-field beneath them is outside the vertical pattern.</Body>
      </Card>
      <KeyFact>Near-field, far-field, overlap, comb filtering, interference between loudspeakers — every one of them is geometry first. A microphone should never stand in a loudspeaker’s coverage; a listener should always stand in exactly one loudspeaker’s, or in two that have been aligned.</KeyFact>
      <DeeperRow>
        <LabLink route="SpeakerLab" label="Speaker Placement & Coverage — the full lab" />
        <LabLink route="WaveLab" label="Wave Physics — interference" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 18 · Delay and alignment ───────────────────────────────────────────── */

function PageAlignment({ ctx }: { ctx: PageCtx }) {
  const [dist, setDist] = useState(30);
  const [temp, setTemp] = useState(20);
  const [setMs, setSetMs] = useState(0);
  const need = delayMs(dist, temp);
  const err = setMs - need;
  const aligned = Math.abs(err) <= 2;
  const goals = [{ label: 'Align the delays to within 2 ms', hit: aligned && setMs > 0 }];
  const latched = useVisitGoals(ctx, goals);
  const pathDiff = 1.2;
  const firstNull = combFirstNullHz(pathDiff, temp);
  // Timing rings: how far the mains' sound has travelled when the delays' arrives.
  const D = slotDef('delayL');
  const overlay = (
    <>
      {[0.5, 1, 1.5].map((k) => (
        <Circle key={k} cx={slotDef('mainL').x} cy={slotDef('mainL').y} r={40 * k * 1.6} fill="none" stroke={colors.amber} strokeWidth={0.7} opacity={0.35} strokeDasharray="3 4" />
      ))}
      <SvgText x={D.x} y={D.y + 30} fontSize={7} fill={aligned ? colors.greenBright : colors.orange} textAnchor="middle" fontFamily={fonts.mono}>
        {`${setMs.toFixed(0)} ms set · ${need.toFixed(1)} ms needed`}
      </SvgText>
    </>
  );
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={11}>DELAY TIME, TIME ALIGNMENT AND POLARITY</ChapterTag>
      <Lead>
        A delay loudspeaker is closer to the back rows than the mains, so its sound arrives first — unless it is held back electronically by the time the mains’ sound needs to cover the extra distance. Sound travels about {speedOfSound(temp).toFixed(0)} m/s at {temp} °C: roughly 2.9 ms per metre.
      </Lead>
      <VenueView
        placed={[
          { id: 'l', kind: 'poweredSpeaker', slot: 'mainL' },
          { id: 'r', kind: 'poweredSpeaker', slot: 'mainR' },
          { id: 'dl', kind: 'poweredSpeaker', slot: 'delayL' },
          { id: 'dr', kind: 'poweredSpeaker', slot: 'delayR' },
        ]}
        beams={[
          { x: slotDef('mainL').x, y: slotDef('mainL').y, aimDeg: 18, coverDeg: 90, color: colors.amber },
          { x: slotDef('mainR').x, y: slotDef('mainR').y, aimDeg: -18, coverDeg: 90, color: colors.amber },
          { x: slotDef('delayL').x, y: slotDef('delayL').y, aimDeg: 0, coverDeg: 90, gain: 0.6, color: colors.cyanBright },
          { x: slotDef('delayR').x, y: slotDef('delayR').y, aimDeg: 0, coverDeg: 90, gain: 0.6, color: colors.cyanBright },
        ]}
        overlay={overlay}
        badge="TIMING RINGS — ILLUSTRATIVE"
        a11y={`Mains and delay loudspeakers ${dist} metres apart. Delay set ${setMs} milliseconds; ${need.toFixed(1)} needed.`}
      />
      <Row>
        <Text style={styles.ctlLabel}>DISTANCE</Text>
        {[10, 30, 60].map((d) => (
          <Btn key={d} label={`${d} m`} selected={dist === d} tone={dist === d ? 'primary' : 'plain'} onPress={() => setDist(d)} a11y={`${d} metres from mains to delays`} />
        ))}
        <Text style={styles.ctlLabel}>AIR</Text>
        {[5, 20, 35].map((t) => (
          <Btn key={t} label={`${t} °C`} selected={temp === t} tone={temp === t ? 'primary' : 'plain'} onPress={() => setTemp(t)} a11y={`${t} degrees Celsius`} />
        ))}
      </Row>
      <Row>
        <Text style={styles.ctlLabel}>DELAY SET</Text>
        <Btn label="−10" onPress={() => setSetMs((v) => Math.max(0, v - 10))} a11y="Delay down 10 milliseconds" />
        <Btn label="−1" onPress={() => setSetMs((v) => Math.max(0, v - 1))} a11y="Delay down 1 millisecond" />
        <Text style={styles.ms}>{setMs.toFixed(0)} ms</Text>
        <Btn label="+1" onPress={() => setSetMs((v) => Math.min(300, v + 1))} a11y="Delay up 1 millisecond" />
        <Btn label="+10" onPress={() => setSetMs((v) => Math.min(300, v + 10))} a11y="Delay up 10 milliseconds" />
      </Row>
      <ReadoutRow>
        <Readout k="NEEDED" v={`${need.toFixed(1)} ms`} tint={colors.amber} />
        <Readout k="ERROR" v={`${err > 0 ? '+' : ''}${err.toFixed(1)} ms`} tint={aligned ? colors.green : colors.orange} />
        <Readout k="SPEED OF SOUND" v={`${speedOfSound(temp).toFixed(1)} m/s`} />
      </ReadoutRow>
      <VerdictLine ok={aligned && setMs > 0} warn={!aligned && setMs > 0}>
        {setMs === 0 ? 'Undelayed: the delay towers lead the mains and the ear hears two events — the fault on the bench.' : aligned ? 'Aligned. The two arrivals fuse; the back rows hear one system.' : err < 0 ? `Still ${(-err).toFixed(1)} ms early — the delays lead the mains.` : `${err.toFixed(1)} ms late — now the mains lead the delays.`}
      </VerdictLine>
      <Card tone="math">
        <Eyebrow>FROM THE CALCULATOR</Eyebrow>
        <Text style={styles.path}>t = d ÷ c · c = 331.3 × √(1 + T/273.15)</Text>
        <Body>Acoustic delay is the distance; electronic delay is what you add to match it. Warm air is faster, so a delay set at soundcheck in the afternoon drifts by evening — measure again.</Body>
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
      <GoalChips goals={goals} latched={latched} />
    </View>
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
      <Lead>
        Tuning is measurement plus listening. A measurement microphone and a transfer-function analyser show what the system does at a reference position; your ears, walking the room, decide whether it is consistent across the seats — which matters more than perfection at one.
      </Lead>
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
      <Card>
        <Eyebrow>THE TUNING SESSION</Eyebrow>
        <Body>1 · Recall the cabinet presets and confirm the limiters. 2 · Verify polarity and the sub-to-top alignment at the crossover. 3 · Measure at a reference position — not the mix position alone — and apply broad system EQ. 4 · Walk the room with pink noise and music; adjust for consistency, not for one perfect seat. 5 · Listen to material you know. 6 · Save the configuration and name it for the room.</Body>
      </Card>
      <KeyFact>RTA shows what the microphone hears; a transfer function shows what the SYSTEM changed. Tune with the second, confirm with the first, decide with your ears — and remember that the phone in your hand is not a measurement microphone.</KeyFact>
      <DeeperRow>
        <ToolLink toolKey="rta" label="RTA tool" />
        <ToolLink toolKey="spl" label="SPL meter" />
        <ToolLink toolKey="spectrogram" label="Spectrogram" />
        <LabLink route="EqLabHome" label="EQ Lab" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 20 · Feedback control ──────────────────────────────────────────────── */

function PageFeedback({ ctx }: { ctx: PageCtx }) {
  const [send, setSend] = useState(-12);
  const [position, setPosition] = useState<'front' | 'behind'>('front');
  const [notched, setNotched] = useState(false);
  const [rang, setRang] = useState(false);
  const [fixed, setFixed] = useState(false);
  // Gain-before-feedback in this illustrative model: geometry buys 12 dB, a
  // narrow notch buys 4 more. The loop rings when the send exceeds it.
  const gbf = (position === 'behind' ? 0 : -12) + (notched ? 4 : 0);
  const ringing = send > gbf;
  const margin = gbf - send;
  useEffect(() => {
    if (ringing) setRang(true);
    if (rang && !ringing && send >= -6) setFixed(true);
  }, [ringing, rang, send]);
  const goals = [{ label: 'Push the wedge into feedback', hit: rang }, { label: 'Get the send to −6 dB or louder WITHOUT ringing', hit: fixed }];
  const latched = useVisitGoals(ctx, goals);
  const ringHz = 2500;
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={13}>FEEDBACK CONTROL</ChapterTag>
      <Lead>
        Feedback is a loop: microphone → console → loudspeaker → microphone, around and around, until one frequency where the loop gain passes unity takes off. Gain-before-feedback is how much level you can add before that happens — and it is spent first by geometry, then by level, and only last by an equaliser.
      </Lead>
      <View style={styles.gbfWrap} accessible accessibilityLabel={`Monitor send ${send} dB; gain before feedback ${gbf} dB; ${ringing ? 'ringing' : `${margin} dB of margin`}`}>
        <View style={styles.gbfBar}>
          <View style={[styles.gbfFill, { width: `${((send + 30) / 40) * 100}%`, backgroundColor: ringing ? colors.red : levelColorForDb(send, -30, 6) }]} />
          <View style={[styles.gbfMark, { left: `${((gbf + 30) / 40) * 100}%` }]} />
        </View>
        <Text style={[styles.gbfText, ringing && { color: colors.red }]}>{ringing ? `RINGING at ~${ringHz} Hz — ${-margin} dB over the loop limit` : `${margin} dB of margin before the loop rings`}</Text>
      </View>
      <Row>
        <Text style={styles.ctlLabel}>SEND</Text>
        <Btn label="−3" onPress={() => setSend((v) => Math.max(-30, v - 3))} a11y="Monitor send down 3 dB" />
        <Text style={styles.ms}>{send > 0 ? '+' : ''}{send} dB</Text>
        <Btn label="+3" onPress={() => setSend((v) => Math.min(10, v + 3))} a11y="Monitor send up 3 dB" />
      </Row>
      <Row>
        <Text style={styles.ctlLabel}>WEDGE</Text>
        <Btn label="IN FRONT OF THE MIC" selected={position === 'front'} tone={position === 'front' ? 'primary' : 'plain'} onPress={() => setPosition('front')} a11y="Wedge in front of the microphone, in its live angle" />
        <Btn label="BEHIND THE MIC" selected={position === 'behind'} tone={position === 'behind' ? 'primary' : 'plain'} onPress={() => setPosition('behind')} a11y="Wedge behind the microphone, in its rejection angle" />
        <Btn label={notched ? `● NOTCH ${ringHz} Hz` : `○ NOTCH ${ringHz} Hz`} selected={notched} onPress={() => setNotched((n) => !n)} a11y={`Narrow notch at ${ringHz} hertz ${notched ? 'on' : 'off'}`} />
      </Row>
      <Card tone="math">
        <Eyebrow>THE ORDER OF OPERATIONS</Eyebrow>
        <Body>1 · Placement: the wedge in the microphone’s rejection angle (behind a cardioid, at the sides of a hypercardioid), the mains in front of the microphones, never behind. 2 · Polar pattern and technique: a tighter pattern and a closer mouth both raise the ratio of voice to loop. 3 · Stage volume: a quieter stage needs quieter wedges. 4 · Level: the send at what the performer needs, not more. 5 · Identify the ringing frequency on the analyser and apply a NARROW cut. 6 · Automatic feedback suppressors, if used, as a safety net — not a substitute for the first four.</Body>
      </Card>
      <Card tone="warn">
        <Eyebrow>WHEN IT HAPPENS DURING A PERFORMANCE</Eyebrow>
        <Body>Pull the offending send or channel down first — a hand on the fader beats a search for the frequency. Mute unused microphones as a habit. Then find the frequency and notch it while the room is quiet. Excessive graphic EQ to “fix” feedback leaves a wedge that sounds hollow and still rings somewhere else.</Body>
      </Card>
      <UnderstandingCheck
        question="A wedge rings as the send comes up. Which change buys the MOST gain-before-feedback?"
        options={['Moving the wedge into the microphone’s rejection angle', 'Cutting six bands on the graphic EQ', 'Raising the amplifier level', 'Adding compression to the vocal']}
        correct={0}
        explain="Geometry first: placement changes how much of the loudspeaker the microphone hears at every frequency at once. An equaliser can only treat the frequencies it finds, one at a time, at a tonal cost."
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 21 · The source-forward method ─────────────────────────────────────── */

const WALK_KINDS: Record<Station, DiagramStation['kind']> = {
  source: 'vocalMic',
  cable: 'snake',
  stagebox: 'stagebox',
  consoleIn: 'console',
  consoleOut: 'console',
  processor: 'processor',
  amp: 'amp',
  speaker: 'passiveSpeaker',
  listener: 'listener',
};

function PageMethod({ ctx }: { ctx: PageCtx }) {
  const [probed, setProbed] = useState<Station[]>([]);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const faultAt: Station = 'processor';
  const done = probed.includes(faultAt);
  const goals = [{ label: 'Run the forward walk to the fault', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  useEffect(() => {
    if (!running) return;
    const next = STATION_ORDER[probed.length];
    if (!next || probed.includes(faultAt)) {
      setRunning(false);
      return;
    }
    timer.current = setTimeout(() => setProbed((p) => [...p, next]), ctx.reduceMotion ? 0 : 520);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [running, probed, ctx.reduceMotion]);
  const stations: DiagramStation[] = STATION_ORDER.map((s) => {
    const i = STATION_ORDER.indexOf(s);
    const f = STATION_ORDER.indexOf(faultAt);
    const isProbed = probed.includes(s);
    return { id: s, kind: WALK_KINDS[s], label: STATION_LABEL[s], state: !isProbed ? 'unknown' : i < f ? 'ok' : 'none' };
  });
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={14}>TESTING AND TROUBLESHOOTING · THE METHOD</ChapterTag>
      <Lead>
        “The PA is dead.” The amateur swaps the amplifier. The professional starts at the microphone and walks forward, reading each station, and stops at the first one whose reading changes. That station is the fault — or the place it became visible.
      </Lead>
      <SystemDiagram stations={stations} flowing={false} breakAfter={done ? STATION_ORDER.indexOf(faultAt) - 1 : null} a11y="The nine stations of the walk. Run the walk to watch each station read healthy until the processor, where the signal stops." />
      <Row>
        <Btn label={running ? '… WALKING' : done ? 'WALK AGAIN' : '▶ RUN THE WALK'} tone="primary" disabled={running} onPress={() => { setProbed([]); setRunning(true); }} a11y="Run the forward walk" />
      </Row>
      {done ? (
        <VerdictLine ok>Healthy, healthy, healthy, healthy, healthy — then nothing at the processor output. Six probes, one answer, no boxes swapped.</VerdictLine>
      ) : (
        <Body>{probed.length ? `${probed.length} station${probed.length === 1 ? '' : 's'} read so far.` : 'Nothing read yet.'}</Body>
      )}
      <KeyFact>Probe forward, never backward. Re-probe a station if you must, but never jump toward the loudspeaker on a hunch. The bench grades the walk as well as the answer.</KeyFact>
      <Card>
        <Eyebrow>WHAT A PROBE IS</Eyebrow>
        <Body>A meter, an LED, a pair of headphones, a cable tester, a swap to a known-good part — whatever answers “is the signal healthy HERE?” for that station. Reading it is the skill; owning it is the kit.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="SoundSystemsTroubleshoot" label="TROUBLESHOOT mode — 22 faults on the bench" />
        <LabLink route="MeterModule" label="Signal Detective" params={{ id: 'detective' }} />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
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

export const SS_LEARN_PAGES_C: PageDef[] = [
  { title: 'Gain structure', short: 'GAIN', Component: PageGain, manualDone: true },
  { title: 'Coverage and aim', short: 'COVER', Component: PageCoverage, manualDone: true },
  { title: 'Delay and alignment', short: 'ALIGN', Component: PageAlignment, manualDone: true },
  { title: 'Processing and tuning', short: 'TUNE', Component: PageProcessing, manualDone: true },
  { title: 'Feedback control', short: 'FEEDBACK', Component: PageFeedback, manualDone: true },
  { title: 'The source-forward method', short: 'METHOD', Component: PageMethod, manualDone: true },
  { title: 'What you can now do', short: 'WRAP', Component: PageWrap, manualDone: true },
];

const styles = StyleSheet.create({
  ctlLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.6, marginRight: 2 },
  ms: { color: colors.amber, fontFamily: fonts.mono, fontSize: 15, minWidth: 64, textAlign: 'center' },
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
