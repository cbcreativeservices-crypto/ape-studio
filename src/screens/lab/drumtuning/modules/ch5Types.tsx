/**
 * Chapter 5 — Tuning each drum type. LEARN (rack: the snare — batter,
 * snare-side head, wires and strainer) → LEARN (read: toms) → LEARN (rack:
 * the bass drum — beater, front head, pillow) → PRACTICE (rack: "Tune a
 * drum for a sound" — four goals, tuning AND damping choices, judged on
 * the render) → PRACTICE (decisions) → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { View } from 'react-native';
import { Body, Card, DrumScenarioDeck, DrumStatus, Feedback, KeyButton, KeyTerms, Point, SectionTitle, fmtHz, noteName } from '../kit';
import { DRUM_KEY_TERMS, GOALS, TYPES_SCENARIOS } from '../drumContent';
import { DRUMS, DRUM_LIST, bendCents, judgeGoal, upperRatio, type DrumKind, type GoalId, type StrikeParams } from '../drumEngine';
import { KICK_ASPECT, KickStage, SNARE_ASPECT, SnareStage } from '../stagesDrum';
import { WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { MODEL_BADGE, RENDER_BADGE, fmtCents, fmtS, headAtHz, useStrike, type ChapterProps } from './shared';

type Front = 'open' | 'ported' | 'removed';
const FRONTS: { key: Front; label: string; short: string; blurb: string }[] = [
  { key: 'open', label: 'Front head on, no port', short: 'CLOSED', blurb: 'Full coupling: the longest, roundest note; harder to mic inside.' },
  { key: 'ported', label: 'Front head with a port hole', short: 'PORTED', blurb: 'Less coupling, a faster decay and a path for a microphone.' },
  { key: 'removed', label: 'Front head removed', short: 'NO FRONT', blurb: 'The batter alone: the shortest note, the most attack.' },
];

export function Ch5Types({ onAnswered, onInteractive }: ChapterProps) {
  // Snare.
  const [snBatter, setSnBatter] = useState(230);
  const [snSide, setSnSide] = useState(400); // cents above the batter
  const [strainer, setStrainer] = useState(0.5);
  const [snStrike, setSnStrike] = useState(0.7);
  // Kick.
  const [front, setFront] = useState<Front>('ported');
  const [pillow, setPillow] = useState(0.4);
  const [kBatter, setKBatter] = useState(60);
  const [kStrike, setKStrike] = useState(0.9);
  // The goal interactive.
  const [goal, setGoal] = useState<GoalId>('short');
  const [gDrum, setGDrum] = useState<DrumKind>('rack');
  const [gBatter, setGBatter] = useState(190);
  const [gReso, setGReso] = useState(190);
  const [gDamp, setGDamp] = useState(0);
  const gStrike = 0.85;
  const [met, setMet] = useState<Set<GoalId>>(() => new Set());
  const [verdict, setVerdict] = useState<{ met: boolean; lines: string[] } | null>(null);
  const reported = useRef(false);

  const snareHz = snBatter * Math.pow(2, snSide / 1200);
  const snParams = useMemo<StrikeParams>(() => ({ drum: 'snare', batter: headAtHz('snare', snBatter, 'batter'), reso: headAtHz('snare', snareHz, 'reso'), resoPresent: true, damping: 0, strike: snStrike, strikeR: 0.3, strikeTheta: 0, strainer }), [snBatter, snareHz, snStrike, strainer]);
  const sn = useStrike(snParams);
  const kParams = useMemo<StrikeParams>(() => ({ drum: 'kick', batter: headAtHz('kick', kBatter, 'batter'), reso: headAtHz('kick', kBatter * 0.95, 'reso'), resoPresent: front !== 'removed', damping: pillow, strike: kStrike, strikeR: 0.35, strikeTheta: 0, frontHead: front }), [kBatter, front, pillow, kStrike]);
  const kick = useStrike(kParams);
  const gSpec = DRUMS[gDrum];
  const gParams = useMemo<StrikeParams>(() => ({ drum: gDrum, batter: headAtHz(gDrum, gBatter, 'batter'), reso: headAtHz(gDrum, gReso, 'reso'), resoPresent: true, damping: gDamp, strike: gStrike, strikeR: 0.3, strikeTheta: 0, strainer: gDrum === 'snare' ? 0.5 : undefined, frontHead: gDrum === 'kick' ? 'ported' : undefined }), [gDrum, gBatter, gReso, gDamp, gStrike]);
  const g = useStrike(gParams);
  const gBend = bendCents(gStrike, gParams.batter.tension);
  const gUpper = g.rendered ? upperRatio(g.rendered.result.partials, gBatter) : null;

  // A drum change moves the pitch controls into that drum's band.
  const pickDrum = (d: DrumKind) => {
    const s = DRUMS[d];
    const mid = Math.round((s.usefulHz[0] + s.usefulHz[1]) / 2);
    setGDrum(d);
    setGBatter(mid);
    setGReso(mid);
    setVerdict(null);
  };
  const check = () => {
    if (!g.rendered) return;
    const v = judgeGoal(goal, { t60: g.rendered.t60, f0: gBatter, bendCents: gBend, upper: gUpper ?? 0, drum: gDrum });
    setVerdict(v);
    if (v.met) setMet((m) => (m.has(goal) ? m : new Set([...m, goal])));
  };
  useEffect(() => {
    if (met.size >= 2 && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [met, onInteractive]);
  useEffect(() => setVerdict(null), [goal, gBatter, gReso, gDamp, gDrum]);
  const goalInfo = GOALS.find((x) => x.id === goal)!;

  return (
    <ChapterSteps
      steps={[
        {
          key: 'snare', title: 'Snare drum', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <SnareStage width={w} height={h} strainer={strainer} snareSideCents={snSide} playing={sn.playing} />,
            aspect: SNARE_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'BATTER', v: `${snBatter} Hz`, tint: colors.cyan },
              { k: 'SNARE SIDE', v: `${fmtHz(snareHz)} Hz`, tint: colors.green, flex: 1.2 },
              { k: 'STRAINER', v: strainer < 0.1 ? 'OFF' : `${Math.round(strainer * 100)} %`, tint: colors.amber },
              { k: 'SUSTAIN', v: fmtS(sn.rendered?.t60), tint: colors.green },
            ],
            params: [
              faderParam({ id: 'strainer', label: 'STRAINER', value: strainer, min: 0, max: 1, step: 0.05, format: (v) => (v < 0.1 ? 'thrown off — no wires' : v < 0.4 ? `${Math.round(v * 100)} % · loose: sensitive, buzzy, long` : v < 0.7 ? `${Math.round(v * 100)} % · medium` : `${Math.round(v * 100)} % · tight: less sensitive, choked`), formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setStrainer, home: 0.5 }),
              faderParam({ id: 'side', label: 'SNARE SIDE', value: snSide, min: -200, max: 900, step: 25, format: (v) => `snare-side head ${v >= 0 ? '+' : ''}${v} ¢ vs the batter`, formatShort: (v) => `${v >= 0 ? '+' : ''}${v} ¢`, onChange: setSnSide, home: 400 }),
              faderParam({ id: 'snb', label: 'BATTER', value: snBatter, min: DRUMS.snare.usefulHz[0], max: DRUMS.snare.usefulHz[1], step: 1, format: (v) => `batter (0,1) ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setSnBatter, home: 230 }),
              faderParam({ id: 'snstrike', label: 'STROKE', value: snStrike, min: 0.2, max: 1, step: 0.05, format: (v) => `${Math.round(v * 100)} % — ${v < 0.4 ? 'a ghost note' : v < 0.75 ? 'a backbeat' : 'a rimshot-hard hit'}`, formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setSnStrike, home: 0.7, level: true }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: sn.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: sn.stop, tint: colors.green },
            ],
            initialParam: 'strainer',
            onTap: () => (sn.playing ? sn.stop() : sn.play()),
          },
          well: (
            <>
              <DrumStatus playing={sn.playing} pending={sn.pending} rendering={sn.status === 'rendering'} idle="stopped · ride STRAINER or SNARE SIDE, then ▶ STRIKE; try a soft STROKE" label="the snare" />
              <Body>A snare is heads plus wires plus a strainer. Ride STRAINER and strike softly: the wires only rattle while the snare-side head moves them past the strainer's threshold, so a tight strainer loses the ghost notes and chokes the ring; a loose one buzzes at everything, including the toms. Ride SNARE SIDE — the thin bottom head is commonly tuned well above the batter; move it and hear the wire response and the body change.</Body>
              <Card>
                <Point title="Batter: feel and pitch">The batter sets stick feel, the fundamental and how much the drum rings. Higher is crisper and more articulate; lower is fatter with more body.</Point>
                <Point title="Snare-side head and wires: sensitivity">The thin bottom head drives the wires. Its tension and the strainer together set sensitivity, articulation and how long the wires sizzle.</Point>
                <Point title="Separating the sounds">Head overtones ring at pitch; wire buzz is noise, shaped by the snare-side head; hardware noise (a loose strainer, a rattling butt plate) is a repair, not a tuning. Throw the strainer off (STRAINER to 0) to hear the heads alone.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'toms', title: 'Toms', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>TOMS</SectionTitle>
              <Card>
                <Point title="Each head even, then the relationship">The Chapter 3 method on each head, then Chapter 4's comparison: on a tom the resonant head carries most of the sustain and bend, so its relationship to the batter is the main tone decision.</Point>
                <Point title="A useful progression across the kit">Toms are heard as a set. Tune the lowest drum where it responds best, the highest where it responds best, and space the ones between so each step is clear — Chapter 6 builds the range.</Point>
                <Point title="Do not force a drum out of its range">Pushed too high a tom chokes thin and pingy; pulled too low the head wrinkles and flaps. The starting bands in Chapter 2 are where to begin listening; the drum tells you the rest.</Point>
              </Card>
              <Body>The practice step below tunes a drum of your choice toward a stated sound — toms included.</Body>
            </>
          ),
        },
        {
          key: 'kick', title: 'Bass drum', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <KickStage width={w} height={h} front={front} damping={pillow} strike={kStrike} />,
            aspect: KICK_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'FRONT', v: FRONTS.find((f) => f.key === front)?.short ?? '—', flex: 1.2 },
              { k: 'PILLOW', v: pillow < 0.05 ? 'none' : `${Math.round(pillow * 100)} %`, tint: colors.amber },
              { k: 'BATTER', v: `${kBatter} Hz`, tint: colors.cyan },
              { k: 'SUSTAIN', v: fmtS(kick.rendered?.t60), tint: colors.green },
            ],
            params: [
              optionsParam({ id: 'front', label: 'FRONT', value: front, options: FRONTS, onChange: setFront }),
              faderParam({ id: 'pillow', label: 'PILLOW', value: pillow, min: 0, max: 1, step: 0.05, format: (v) => (v < 0.05 ? 'nothing inside — open' : v < 0.4 ? `${Math.round(v * 100)} % · a felt strip / small pillow` : `${Math.round(v * 100)} % · a pillow against the batter`), formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setPillow, home: 0 }),
              faderParam({ id: 'kb', label: 'BATTER', value: kBatter, min: DRUMS.kick.usefulHz[0], max: DRUMS.kick.usefulHz[1], step: 1, format: (v) => `batter (0,1) ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setKBatter, home: 60 }),
              faderParam({ id: 'kstrike', label: 'BEATER', value: kStrike, min: 0.3, max: 1, step: 0.05, format: (v) => `${Math.round(v * 100)} % beater stroke`, formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setKStrike, home: 0.9, level: true }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: kick.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: kick.stop, tint: colors.green },
            ],
            initialParam: 'pillow',
            onTap: () => (kick.playing ? kick.stop() : kick.play()),
          },
          well: (
            <>
              <DrumStatus playing={kick.playing} pending={kick.pending} rendering={kick.status === 'rendering'} idle="stopped · set FRONT and PILLOW, then ▶ STRIKE" label="the bass drum" />
              <Body>The beater's click rides on a low fundamental. FRONT decides how much the two heads couple: closed is the longest note, a port lets some of the air out (and a microphone in), no front head is the batter alone. PILLOW shortens the decay and takes the overtones first — SUSTAIN on the bezel is measured from each render.</Body>
              <Card>
                <Point title="Batter and front-head roles">The batter sets attack and pitch under the beater; the front head sets sustain, body and how the drum projects to the room.</Point>
                <Point title="Beater, low end, sustain, pitch">A harder stroke (BEATER) gives more click and a deeper bend; a lower batter gives more low end but a slower, flappier response under fast playing.</Point>
                <Point title="Muffling and internal contact">A pillow touching the batter, felt strips, or a towel inside each remove ring and shorten the note. A heavily damped kick behaves like a different drum from an open one: shorter, drier, more click, less pitch. Both are legitimate; the music decides.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'goal', title: 'Tune a drum for a sound', kind: 'PRACTICE', layout: 'rack',
          rack: {
            render: (w, h) => <WaveStage width={w} height={h} ov={g.rendered?.overview ?? null} envDb={g.rendered?.envDb} t60={g.rendered?.t60} seconds={gSpec.seconds} label={`${gSpec.name} · goal: ${goalInfo.label}`} progress={g.progress} playing={g.playing} idle="rendering…" />,
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              { k: 'GOAL', v: goalInfo.short, tint: colors.amber },
              { k: 'F0', v: `${gBatter} Hz`, tint: colors.cyan },
              { k: 'SUSTAIN', v: fmtS(g.rendered?.t60), tint: colors.green },
              { k: 'BEND', v: fmtCents(gBend), tint: colors.amber },
              { k: 'MET', v: `${met.size} / 4`, tint: met.size >= 2 ? colors.green : colors.textMuted },
            ],
            params: [
              optionsParam({ id: 'goal', label: 'GOAL', value: goal, options: GOALS.map((x) => ({ key: x.id, label: x.label, short: x.short, blurb: x.hint })), onChange: setGoal }),
              optionsParam({ id: 'gdrum', label: 'DRUM', value: gDrum, options: DRUM_LIST.map((d) => ({ key: d.kind, label: d.name, short: d.kind.toUpperCase() })), onChange: pickDrum, sticky: false }),
              faderParam({ id: 'gb', label: 'BATTER', value: gBatter, min: Math.round(gSpec.usefulHz[0] * 0.85), max: Math.round(gSpec.usefulHz[1] * 1.15), step: 1, format: (v) => `batter (0,1) ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setGBatter }),
              faderParam({ id: 'gr', label: 'RESO', value: gReso, min: Math.round(gSpec.usefulHz[0] * 0.7), max: Math.round(gSpec.usefulHz[1] * 1.4), step: 1, format: (v) => `resonant (0,1) ${v.toFixed(0)} Hz · ${(12 * Math.log2(v / gBatter)).toFixed(1)} st vs batter`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setGReso }),
              faderParam({ id: 'gd', label: 'DAMPING', value: gDamp, min: 0, max: 1, step: 0.05, format: (v) => (v < 0.05 ? 'none' : v < 0.35 ? `${Math.round(v * 100)} % · gel` : v < 0.7 ? `${Math.round(v * 100)} % · felt` : `${Math.round(v * 100)} % · pillow`), formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setGDamp, home: 0 }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: g.play },
            ],
            initialParam: 'gd',
            onTap: () => (g.playing ? g.stop() : g.play()),
          },
          well: (
            <>
              <DrumStatus playing={g.playing} pending={g.pending} rendering={g.status === 'rendering'} idle="stopped · pick a GOAL and a DRUM, tune and damp, ▶ STRIKE, then ✓ CHECK" label="the strike" />
              <Feedback tone="info">{`${goalInfo.label}: ${goalInfo.hint}`}</Feedback>
              {verdict ? <Feedback tone={verdict.met ? 'ok' : 'warn'}>{`${verdict.met ? 'Goal met. ' : 'Not yet. '}${verdict.lines.join(' ')}`}</Feedback> : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <KeyButton label="✓ CHECK AGAINST THE GOAL" onPress={check} tint={colors.amber} disabled={!g.rendered} />
                <KeyButton label="■ STOP" onPress={g.stop} tint={colors.green} />
              </View>
              <Body>Choose a GOAL and a DRUM, then make the tuning AND damping choices: BATTER, RESO and DAMPING. ▶ STRIKE (or tap the display) to hear it; CHECK judges the render against the goal's teaching bands — sustain (T60), fundamental, bend and the share of upper partials — and tells you which way to move. Meet two of the four goals for the chapter's credit; try all four to compare the outcomes.</Body>
              <Card>
                <Point title="The bands this lab uses">Short: T60 ≤ 0.55 s and controlled overtones. Open: T60 ≥ 0.9 s with live overtones. Low and full: the fundamental in the lower third of the drum's band with body. Clear bend: at least 35 cents of glide, long enough to hear. These are the lab's teaching thresholds, not industry rules.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Check your understanding', kind: 'PRACTICE', layout: 'read',
          body: <DrumScenarioDeck scenarios={TYPES_SCENARIOS} onAnswered={onAnswered} intro="Three decisions across the drum types." />,
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Snare: the batter for feel and pitch, the snare-side head and strainer for sensitivity; separate head ring, wire buzz and hardware noise.</Body>
                <Body>• Toms: even, then the relationship, then a progression that keeps each drum in its range.</Body>
                <Body>• Bass drum: beater, low note, front-head decision; muffling makes a different instrument, not a worse one.</Body>
                <Body>• Tuning and damping are both choices; a stated goal decides them.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.types} />
            </>
          ),
        },
      ]}
    />
  );
}
