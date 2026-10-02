/**
 * Chapter 5 — Tuning each drum type. LEARN (rack: the snare — batter,
 * snare-side head, wires and strainer; the stroke is heard as level AND as
 * wire sensitivity) → LEARN (read: toms) → LEARN (rack: the bass drum —
 * beater, front head, pillow) → PRACTICE (rack: "Tune a drum for a sound" —
 * four goals, tuning AND damping choices, judged on the render; every goal
 * starts from a state that FAILS it) → PRACTICE (decisions) → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { faderParam, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumScenarioDeck, DrumStatus, Feedback, KeyButton, KeyTerms, Landing, Point, RecallCard, SectionTitle, WhyCard, YourRun, fmtHz, noteName } from '../kit';
import { DRUM_KEY_TERMS, GOALS, TYPES_SCENARIOS } from '../drumContent';
import { DRUMS, DRUM_LIST, bendCents, judgeGoal, upperRatio, type DrumKind, type GoalId, type StrikeParams } from '../drumEngine';
import { KICK_ASPECT, KickStage, SNARE_ASPECT, SnareStage } from '../stagesDrum';
import { WAVE_ASPECT, WaveStage, type WaveTarget } from '../stagesSignal';
import { MODEL_BADGE, RENDER_BADGE, fmtCents, fmtS, headAtHz, syncOf, useStrike, type ChapterProps } from './shared';

type Front = 'open' | 'ported' | 'removed';
const FRONTS: { key: Front; label: string; short: string; blurb: string }[] = [
  { key: 'open', label: 'Front head on, no port', short: 'CLOSED', blurb: 'Full coupling: the longest, roundest note; harder to mic inside.' },
  { key: 'ported', label: 'Front head with a port hole', short: 'PORTED', blurb: 'Less coupling, a faster decay and a path for a microphone.' },
  { key: 'removed', label: 'Front head removed', short: 'NO FRONT', blurb: 'The batter alone: the shortest note, the most attack.' },
];

/** The starting state for a goal on a drum — always one that FAILS the goal,
 *  so CHECK can never pay for a drum nobody touched. */
function seedFor(goal: GoalId, drum: DrumKind): { batter: number; reso: number; damp: number } {
  const s = DRUMS[drum];
  const mid = Math.round((s.usefulHz[0] + s.usefulHz[1]) / 2);
  const top = s.usefulHz[1];
  switch (goal) {
    case 'short': return { batter: mid, reso: mid, damp: 0 };
    case 'open': return { batter: mid, reso: Math.round(mid * Math.pow(2, 4 / 12)), damp: 0.6 };
    case 'low': return { batter: top, reso: top, damp: 0 };
    default: return { batter: top, reso: top, damp: 0.3 };
  }
}

export function Ch5Types({ onAnswered, onInteractive, answers }: ChapterProps) {
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
  const [gBatter, setGBatter] = useState(() => seedFor('short', 'rack').batter);
  const [gReso, setGReso] = useState(() => seedFor('short', 'rack').reso);
  const [gDamp, setGDamp] = useState(() => seedFor('short', 'rack').damp);
  const [touched, setTouched] = useState(false);
  const gStrike = 0.85;
  const [met, setMet] = useState<Set<GoalId>>(() => new Set());
  const [checks, setChecks] = useState(0);
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

  /** A goal or drum change re-seeds the drum into a state that fails the goal. */
  const reseed = (gl: GoalId, d: DrumKind) => {
    const s = seedFor(gl, d);
    setGBatter(s.batter);
    setGReso(s.reso);
    setGDamp(s.damp);
    setTouched(false);
    setVerdict(null);
  };
  const pickGoal = (gl: GoalId) => {
    setGoal(gl);
    reseed(gl, gDrum);
  };
  const pickDrum = (d: DrumKind) => {
    setGDrum(d);
    reseed(goal, d);
  };
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setTouched(true);
    setVerdict(null);
  };
  const check = () => {
    if (!g.rendered) return;
    setChecks((n) => n + 1);
    if (!touched) {
      setVerdict({ met: false, lines: ['You have not changed anything yet. The goal has to be reached, not found — move BATTER, RESO or DAMPING toward it and strike.'] });
      return;
    }
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
  const goalInfo = GOALS.find((x) => x.id === goal)!;
  const target: WaveTarget | null = goal === 'short' ? { kind: 'max', t: 0.55, label: 'goal: died away by here', met: verdict ? verdict.met : null } : goal === 'open' || goal === 'low' || goal === 'bend' ? { kind: 'min', t: goal === 'open' ? 0.9 : goal === 'low' ? 0.6 : 0.5, label: 'goal: still ringing here', met: verdict ? verdict.met : null } : null;
  const reached = TYPES_SCENARIOS.filter((s) => s.id in answers).length;
  const rightFirst = TYPES_SCENARIOS.filter((s) => answers[s.id] === true).length;

  return (
    <ChapterSteps
      steps={[
        {
          key: 'snare', title: 'Snare drum', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <SnareStage width={w} height={h} strainer={strainer} snareSideCents={snSide} playing={sn.playing} batterHz={snBatter} strike={snStrike} sync={syncOf(sn)} />,
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
              faderParam({ id: 'side', label: 'SNARE SIDE', value: snSide, min: -200, max: 900, step: 25, format: (v) => `snare-side head ${v >= 0 ? '+' : ''}${v} ¢ vs the batter (S tick on the glass)`, formatShort: (v) => `${v >= 0 ? '+' : ''}${v} ¢`, onChange: setSnSide, home: 400 }),
              faderParam({ id: 'snb', label: 'BATTER', value: snBatter, min: DRUMS.snare.usefulHz[0], max: DRUMS.snare.usefulHz[1], step: 1, format: (v) => `batter's own pitch ${v.toFixed(0)} Hz · ${noteName(v)} (B tick on the glass)`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setSnBatter, home: 230 }),
              faderParam({ id: 'snstrike', label: 'STROKE', value: snStrike, min: 0.2, max: 1, step: 0.05, format: (v) => `${Math.round(v * 100)} % — ${v < 0.4 ? 'a ghost note: quiet, may not wake the wires' : v < 0.75 ? 'a backbeat' : 'a rimshot-hard hit: loud, wires wide open'}`, formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setSnStrike, home: 0.7, level: true }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: sn.play },
            ],
            initialParam: 'strainer',
            onTap: () => (sn.playing ? sn.stop() : sn.play()),
          },
          well: (
            <>
              <Landing looking="the snare side on; the wires hang under the bottom head; the stick's height is the stroke; B and S are the two heads' pitches." prompt="Ride STRAINER and strike softly, then hard." />
              <DrumStatus playing={sn.playing} pending={sn.pending} rendering={sn.status === 'rendering'} idle="stopped · ride STRAINER or SNARE SIDE, then ▶ STRIKE; try a soft STROKE" label="the snare" />
              <Card>
                <Point title="Sensitivity">The wires only rattle while the snare-side head moves them past the strainer's threshold. A tight strainer loses the ghost notes and, wound hard, chokes the whole drum; a loose one buzzes at everything, including the toms.</Point>
                <Point title="The snare-side head">It is 2–3 mil — a sixteenth of a turn moves it. Even it like any head, tight, commonly well above the batter, and let the snare beds do their job. Move SNARE SIDE and hear the wire response and the body change.</Point>
              </Card>
              <WhyCard title="MORE · batter, and separating the sounds">
                <Body>The batter sets stick feel, the pitch and how much the drum rings: higher is crisper and more articulate, lower is fatter with more body. Head overtones ring at pitch; wire buzz is noise, shaped by the snare-side head; hardware noise (a loose strainer, a rattling butt plate) is a repair, not a tuning. Throw the strainer off (STRAINER to 0) to hear the heads alone.</Body>
              </WhyCard>
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
            render: (w, h) => <KickStage width={w} height={h} front={front} damping={pillow} strike={kStrike} batterHz={kBatter} sync={syncOf(kick)} />,
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
              faderParam({ id: 'kb', label: 'BATTER', value: kBatter, min: DRUMS.kick.usefulHz[0], max: DRUMS.kick.usefulHz[1], step: 1, format: (v) => `batter's own pitch ${v.toFixed(0)} Hz · ${noteName(v)} (the tick on the glass)`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setKBatter, home: 60 }),
              faderParam({ id: 'kstrike', label: 'BEATER', value: kStrike, min: 0.3, max: 1, step: 0.05, format: (v) => `${Math.round(v * 100)} % beater stroke — ${v < 0.5 ? 'soft: quieter, less click' : v < 0.8 ? 'a normal stroke' : 'hard: loud, more click, deeper bend'}`, formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setKStrike, home: 0.9, level: true }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: kick.play },
            ],
            initialParam: 'pillow',
            onTap: () => (kick.playing ? kick.stop() : kick.play()),
          },
          well: (
            <>
              <Landing looking="the bass drum side on, pedal on the right; the beater swings in when you strike." prompt="Set FRONT and PILLOW, ▶ STRIKE." />
              <DrumStatus playing={kick.playing} pending={kick.pending} rendering={kick.status === 'rendering'} idle="stopped · set FRONT and PILLOW, then ▶ STRIKE" label="the bass drum" />
              <Card>
                <Point title="Front head and pillow">FRONT decides how much the two heads couple: closed is the longest note, a port lets some of the air out (and a microphone in), no front head is the shortest note — the batter alone. PILLOW shortens the decay and takes the overtones first; SUSTAIN is measured from each render.</Point>
                <Point title="Beater, low end, pitch">A harder stroke is louder, with more click and a deeper bend. A felt beater gives a thump, plastic or wood a click — this model plays the click. A lower batter gives more low end but a slower, flappier response under fast playing.</Point>
              </Card>
              <WhyCard title="MORE · muffling and internal contact">
                <Body>A pillow touching the batter, felt strips, or a towel inside each remove ring and shorten the note. A heavily damped kick behaves like a different drum from an open one: shorter, drier, more click, less pitch. Both are legitimate; the music decides.</Body>
              </WhyCard>
            </>
          ),
        },
        {
          key: 'goal', title: 'Tune a drum for a sound', kind: 'PRACTICE', layout: 'rack',
          rack: {
            render: (w, h) => <WaveStage width={w} height={h} ov={g.rendered?.overview ?? null} envDb={g.rendered?.envDb} t60={g.rendered?.t60} seconds={gSpec.seconds} label={`${gSpec.name} · goal: ${goalInfo.label}`} progress={g.progress} playing={g.playing} idle="rendering…" target={target} />,
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              { k: 'GOAL', v: goalInfo.short, tint: colors.amber },
              { k: 'PITCH', v: `${gBatter} Hz`, tint: colors.cyan },
              { k: 'SUSTAIN', v: fmtS(g.rendered?.t60), tint: colors.green },
              { k: 'BEND', v: fmtCents(gBend), tint: colors.amber },
              { k: 'MET', v: `${met.size} / 4`, tint: met.size >= 2 ? colors.green : colors.textMuted },
            ],
            params: [
              optionsParam({ id: 'goal', label: 'GOAL', value: goal, options: GOALS.map((x) => ({ key: x.id, label: x.label, short: x.short, blurb: `${x.start} ${x.hint}` })), onChange: pickGoal }),
              faderParam({ id: 'gb', label: 'BATTER', value: gBatter, min: Math.round(gSpec.usefulHz[0] * 0.85), max: Math.round(gSpec.usefulHz[1] * 1.15), step: 1, format: (v) => `batter's own pitch ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: touch(setGBatter) }),
              faderParam({ id: 'gr', label: 'RESO', value: gReso, min: Math.round(gSpec.usefulHz[0] * 0.7), max: Math.round(gSpec.usefulHz[1] * 1.4), step: 1, format: (v) => `resonant head ${v.toFixed(0)} Hz · ${(12 * Math.log2(v / gBatter)).toFixed(1)} st vs batter`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: touch(setGReso) }),
              faderParam({ id: 'gd', label: 'DAMPING', value: gDamp, min: 0, max: 1, step: 0.05, format: (v) => (v < 0.05 ? 'none' : v < 0.35 ? `${Math.round(v * 100)} % · gel` : v < 0.7 ? `${Math.round(v * 100)} % · felt` : `${Math.round(v * 100)} % · pillow`), formatShort: (v) => `${Math.round(v * 100)} %`, onChange: touch(setGDamp) }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: g.play },
              { kind: 'action', id: 'check', label: '✓ CHECK', onPress: check, tint: colors.amber },
            ],
            initialParam: 'gd',
            onTap: () => (g.playing ? g.stop() : g.play()),
          },
          well: (
            <>
              <Landing looking="your hit against the goal; the shaded zone is where the green died-away mark has to land." prompt="Pick a GOAL, tune and damp, ▶ STRIKE, then ✓ CHECK." />
              <DrumStatus playing={g.playing} pending={g.pending} rendering={g.status === 'rendering'} idle="stopped · pick a GOAL, tune and damp, ▶ STRIKE, then ✓ CHECK" label="the strike" />
              <Feedback tone="info">{`${goalInfo.label}. ${goalInfo.start} ${goalInfo.hint}`}</Feedback>
              {verdict ? <Feedback tone={verdict.met ? 'ok' : 'warn'}>{`${verdict.met ? 'Goal met. ' : 'Not yet. '}${verdict.lines.join(' ')}`}</Feedback> : null}
              <Card>
                <Point title="Credit">Meet two of the four goals (MET on the bezel). Every goal starts from a drum that fails it; CHECK judges the render — sustain, pitch, bend and the share of overtones — and tells you which way to move.</Point>
                <Point title="Practice drum">{`${gSpec.name}. Pick another below (the goal re-seeds for it):`}</Point>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {DRUM_LIST.map((d) => (
                    <KeyButton key={d.kind} label={d.kind === gDrum ? `▸ ${d.kind.toUpperCase()}` : d.kind.toUpperCase()} onPress={() => pickDrum(d.kind)} tint={d.kind === gDrum ? colors.amber : undefined} />
                  ))}
                </View>
              </Card>
              <WhyCard title="THE BANDS THIS LAB USES">
                <Body>Short: T60 ≤ 0.55 s and controlled overtones. Open: T60 ≥ 0.9 s with live overtones. Low and full: the pitch in the lower third of the drum's band, with body. Clear bend: at least 35 cents of glide, long enough to hear. T60 is the time the note takes to fall 60 dB. These are the lab's teaching thresholds, not industry rules.</Body>
              </WhyCard>
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
              <YourRun lines={[
                met.size ? `Goals met: ${GOALS.filter((x) => met.has(x.id)).map((x) => x.short).join(', ')}. Not yet: ${GOALS.filter((x) => !met.has(x.id)).map((x) => x.short).join(', ') || 'none'} (${checks} check${checks === 1 ? '' : 's'}).` : `Goals met: none yet (${checks} check${checks === 1 ? '' : 's'}).`,
                reached ? `Decisions: ${reached} of ${TYPES_SCENARIOS.length} reached, ${rightFirst} right first time.` : 'Decisions: none answered yet.',
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="Soft strokes on the snare give no wire sound. Where do you look first?" a="The snare-side head's tension and the strainer: the wires answer to the bottom head, and a tight strainer raises the threshold a soft stroke cannot reach." />
              <RecallCard q="What does removing the bass drum's front head do to the note?" a="Shortens it and dries it — the air spring is gone, so the batter alone sounds with the most attack." />
              <RecallCard q="Name two things that shorten a tom's note without retuning it." a="Damping (gel, felt, a pillow) and tuning the resonant head away from the batter so the heads stop feeding each other." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Snare: the batter for feel and pitch, the snare-side head and strainer for sensitivity.</Body>
                <Body>• Bass drum: beater, low note, front-head decision; muffling makes a different instrument, not a worse one.</Body>
                <Body>• Tuning and damping are both choices; a stated goal decides them.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.types} />
              <Body>TRY NEXT: meet SHORT with damping alone, then again with no damping and the resonant head 4 st away — two different short sounds.</Body>
            </>
          ),
        },
      ]}
    />
  );
}
