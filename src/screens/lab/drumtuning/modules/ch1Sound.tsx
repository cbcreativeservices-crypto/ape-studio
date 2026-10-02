/**
 * Chapter 1 — How a drum makes sound. LEARN (rack: the drum as a system,
 * part by part) → LEARN (rack: tension and pitch on the partial ladder) →
 * LEARN (rack: the shell and the bearing edge) → HEAR (rack: pitch,
 * overtones, sustain, pitch bend on the rendered strike) → ADJUST (rack:
 * "Turn one rod", with the optional See-the-vibration view) → PRACTICE →
 * REVIEW.
 *
 * Every rack page opens with a one-line "what you are looking at" and the
 * prompt; the physics sits in a closed WHY card so the well points at the
 * controls. ▶ TAP ripples at the lug and ▶ STRIKE lights the head, in sync
 * with the sound; tapping the display stops.
 */
import { useMemo, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam, flipFader, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumScenarioDeck, DrumStatus, Feedback, KeyTerms, Landing, Point, RecallCard, SectionTitle, WhyCard, YourRun, fmtHz, levelTint, noteName } from '../kit';
import { DRUM_KEY_TERMS, SOUND_SCENARIOS } from '../drumContent';
import { DRUMS, beatRateHz, bendCents, evenHead, evenness, fundamentalHz, lugTapHz, spreadCents, strikePartials, upperRatio, type HeadState, type StrikeParams } from '../drumEngine';
import { ANAT_ASPECT, AnatomyStage, DrumTopStage, EDGES, EDGE_ASPECT, EdgeStage, PARTS, TOP_ASPECT, type DrumPart, type EdgeProfile } from '../stagesDrum';
import { PART_ASPECT, PITCH_ASPECT, PartialsStage, PitchStage, VIB_ASPECT, VibrationStage, WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { MODEL_BADGE, RENDER_BADGE, VIB_BADGE, fmtCents, fmtS, fmtTurn, syncOf, tensionWord, useStrike, useTap, type ChapterProps } from './shared';

const DRUM = 'rack' as const;
const SPEC = DRUMS[DRUM];
const RESO_T = 2600;

type ViewItem = { id: string; label: string; short: string; blurb: string; vib?: number };
const BASE_VIEWS: ViewItem[] = [
  { id: 'drum', label: 'The drum and its tension map', short: 'DRUM', blurb: 'The head from above with the map around the lugs.' },
  { id: 'wave', label: 'The rendered strike', short: 'WAVE', blurb: 'The hit on its real time base, with its envelope.' },
  { id: 'pitch', label: 'The pitch trace', short: 'PITCH', blurb: 'Pitch over time of the main note: the bend.' },
];

export function Ch1Sound({ onAnswered, answers }: ChapterProps) {
  const [part, setPart] = useState<DrumPart>('batter');
  const [tension, setTension] = useState(3000);
  const [edge, setEdge] = useState<EdgeProfile>('double45');
  const [strike, setStrike] = useState(0.8);
  const [damping, setDamping] = useState(0);
  const [lug, setLug] = useState(0);
  const [head, setHead] = useState<HeadState>(() => evenHead(3000, SPEC.lugs));
  const [view, setView] = useState('drum');
  const [prevSpread, setPrevSpread] = useState<number | undefined>(undefined);
  const [turned, setTurned] = useState(0);

  // Lesson 2: an even head at TENSION — the partial ladder follows it.
  const tensionParts = useMemo(() => strikePartials({ drum: DRUM, batter: evenHead(tension, SPEC.lugs), reso: evenHead(RESO_T, SPEC.lugs), resoPresent: true, damping: 0, strike: 0.8, strikeR: 0.3, strikeTheta: 0 }), [tension]);
  const f0 = fundamentalHz(SPEC.diameterIn, tension, SPEC.sigmaBatter);
  const tFrac = (tension - SPEC.tensionRange[0]) / (SPEC.tensionRange[1] - SPEC.tensionRange[0]);
  const tensionStrike = useStrike(useMemo<StrikeParams>(() => ({ drum: DRUM, batter: evenHead(tension, SPEC.lugs), reso: evenHead(RESO_T, SPEC.lugs), resoPresent: true, damping: 0, strike: 0.8, strikeR: 0.3, strikeTheta: 0 }), [tension]), false);

  // Lesson 4: the four qualities on one hit.
  const qualParams = useMemo<StrikeParams>(() => ({ drum: DRUM, batter: evenHead(3000, SPEC.lugs), reso: evenHead(RESO_T, SPEC.lugs), resoPresent: true, damping, strike, strikeR: 0.3, strikeTheta: 0 }), [damping, strike]);
  const qual = useStrike(qualParams);
  const qualF0 = fundamentalHz(SPEC.diameterIn, 3000, SPEC.sigmaBatter);
  const qualUpper = qual.rendered ? upperRatio(qual.rendered.result.partials, qualF0) : null;

  // Turn one rod.
  const rodParams = useMemo<StrikeParams>(() => ({ drum: DRUM, batter: head, reso: evenHead(RESO_T, SPEC.lugs), resoPresent: true, damping: 0, strike: 0.8, strikeR: 0.3, strikeTheta: 0 }), [head]);
  const rod = useStrike(rodParams);
  const tap = useTap(head, lug, DRUM);
  const rodParts = useMemo(() => strikePartials(rodParams), [rodParams]);
  const rodF0 = fundamentalHz(SPEC.diameterIn, head.tension, SPEC.sigmaBatter);
  const spread = spreadCents(head);
  const beat = beatRateHz(head, SPEC.diameterIn, SPEC.sigmaBatter);
  const even = evenness(head, prevSpread);
  // SEE THE VIBRATION: one VIEW entry per partial of this same strike, so
  // the picture is always a mode the sound contains.
  const vibChoices = rodParts.filter((p) => p.head === 'batter' || p.label === '(0,1)').slice(0, 5);
  const views = useMemo<ViewItem[]>(
    () => [...BASE_VIEWS, ...vibChoices.map((p, i) => ({ id: `vib${i}`, label: `See the vibration · ${p.label.replace(/[ab]$/, '')} at ${p.hz.toFixed(0)} Hz`, short: `VIB ${p.label.replace(/[ab]$/, '')}`, blurb: 'The head\'s shape for this partial of the strike, strobed, fading with the hit.', vib: i }))],
    [vibChoices],
  );
  const viewItem = views.find((v) => v.id === view) ?? views[0];
  const vib = viewItem.vib != null ? vibChoices[viewItem.vib] : undefined;
  const vibMix = vib && vib.pairHz !== 0 ? 0.5 : 0;
  const viewKind = viewItem.vib != null ? 'vib' : viewItem.id;

  const setTurn = (v: number) => {
    setPrevSpread(spreadCents(head));
    setTurned((n) => n + 1);
    setHead((h) => ({ ...h, turns: h.turns.map((t, i) => (i === lug ? v : t)) }));
  };
  const rightFirst = SOUND_SCENARIOS.filter((s) => answers[s.id] === true).length;
  const reached = SOUND_SCENARIOS.filter((s) => s.id in answers).length;

  return (
    <ChapterSteps
      steps={[
        {
          key: 'system', title: 'The drum as a system', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <AnatomyStage width={w} height={h} part={part} />,
            aspect: ANAT_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'PART', v: PARTS.find((p) => p.id === part)?.short ?? '—', flex: 1.3 },
              { k: 'HEADS', v: '2' },
              { k: 'EDGES', v: '2' },
              { k: 'LUGS', v: `${SPEC.lugs} × 2` },
            ],
            params: [flipFader({ id: 'part', label: 'PART', items: PARTS, selectedId: part, onSelect: (id) => setPart(id as DrumPart), name: (p) => p.label, short: (p) => p.short, blurb: (p) => p.role, title: 'THE PARTS', sticky: true })],
            initialParam: 'part',
            hideDragTag: true,
          },
          well: (
            <>
              <Landing looking="a tom cut in half, side on — batter head on top, resonant head below." prompt="Ride PART to light up each part." />
              <Card tone="accent">
                <Point title={PARTS.find((p) => p.id === part)?.label ?? ''}>{PARTS.find((p) => p.id === part)?.role ?? ''}</Point>
              </Card>
              <Card>
                <Point title="The two heads">The batter is struck; the resonant head responds through the air. Both shape the sound — the second one more than most players expect.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'tension', title: 'Tension and pitch', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <PartialsStage width={w} height={h} partials={tensionParts} fb={f0} label={`${SPEC.name} · tension ${tensionWord(tFrac)}`} progress={tensionStrike.progress} playing={tensionStrike.playing} seconds={SPEC.seconds} />,
            aspect: PART_ASPECT,
            badge: MODEL_BADGE,
            onTap: () => (tensionStrike.playing ? tensionStrike.stop() : tensionStrike.play()),
            bezel: [
              { k: 'TENSION', v: tensionWord(tFrac).toUpperCase(), flex: 1.4 },
              { k: 'PITCH', v: `${fmtHz(f0)} Hz`, tint: colors.cyan },
              { k: 'NOTE', v: noteName(f0), flex: 1.2 },
              { k: '1ST OVERTONE', v: `${fmtHz(f0 * 1.594)} Hz`, flex: 1.3 },
            ],
            params: [
              faderParam({ id: 'tension', label: 'TENSION', value: tension, min: SPEC.tensionRange[0], max: SPEC.tensionRange[1], step: 50, format: (v) => `${tensionWord((v - SPEC.tensionRange[0]) / (SPEC.tensionRange[1] - SPEC.tensionRange[0]))} · pitch ${fundamentalHz(SPEC.diameterIn, v, SPEC.sigmaBatter).toFixed(0)} Hz · ${v.toFixed(0)} N/m`, formatShort: (v) => `${fundamentalHz(SPEC.diameterIn, v, SPEC.sigmaBatter).toFixed(0)} Hz`, onChange: setTension, home: 3000 }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: tensionStrike.play },
            ],
            initialParam: 'tension',
          },
          well: (
            <>
              <Landing looking="the notes one head makes, lowest on the left; the tall bar is the pitch you hear." prompt="Ride TENSION, then ▶ STRIKE." />
              <DrumStatus playing={tensionStrike.playing} pending={tensionStrike.pending} rendering={tensionStrike.status === 'rendering'} idle="stopped · ride TENSION, then press ▶ STRIKE" label="the strike" />
              <Card>
                <Point title="Tension sets pitch">Pitch rises with the square root of tension: four times the tension is one octave up. A bigger or heavier head sits lower at the same tension.</Point>
                <Point title="Not a harmonic series">The overtones sit at odd ratios (about 1 : 1.6 : 2.1 : 2.3), so a bare drumhead has no single clean pitch — tuning to an exact note is OPTIONAL. The aim is a useful resonant sound; NOTE only names it for reference.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'edge', title: 'The shell and bearing edge', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <EdgeStage width={w} height={h} profile={edge} />,
            aspect: EDGE_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'EDGE', v: EDGES.find((e) => e.id === edge)?.short ?? '—', flex: 1.5 },
              { k: 'CONTACT', v: edge === 'single45' ? 'LEAST' : edge === 'double45' ? 'SMALL' : edge === 'round' ? 'MORE' : 'MOST', flex: 1.2 },
            ],
            params: [flipFader({ id: 'edge', label: 'EDGE', items: EDGES, selectedId: edge, onSelect: (id) => setEdge(id as EdgeProfile), name: (e) => e.label, short: (e) => e.short, blurb: (e) => `${e.contact} ${e.tends}`, title: 'BEARING EDGE PROFILE', sticky: true })],
            initialParam: 'edge',
            hideDragTag: true,
          },
          well: (
            <>
              <Landing looking="the top of the shell wall, cut across, with the head draped over it." prompt="Ride EDGE and watch the amber contact line." />
              <Card tone="accent">
                <Point title={EDGES.find((e) => e.id === edge)?.label ?? ''}>{EDGES.find((e) => e.id === edge)?.contact} {EDGES.find((e) => e.id === edge)?.tends}</Point>
              </Card>
              <Card>
                <Point title="The shell">Material, thickness and depth colour the sound — TOGETHER with the heads, the edges, the hoops and the tuning. No shell material decides a drum's sound on its own; a clean, level edge on a plain shell beats a ragged edge on an expensive one.</Point>
                <Point title="Why it matters for tuning">A true edge lets the head seat evenly. A dented or dirty edge is a spot that will not tune — Chapter 2 looks for it.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'qualities', title: 'Pitch, overtones, sustain, pitch bend', kind: 'HEAR', layout: 'rack',
          rack: {
            render: (w, h) => <WaveStage width={w} height={h} ov={qual.rendered?.overview ?? null} envDb={qual.rendered?.envDb} t60={qual.rendered?.t60} seconds={SPEC.seconds} label={`${SPEC.name} · strike ${Math.round(strike * 100)} %`} progress={qual.progress} playing={qual.playing} idle="rendering…" />,
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            onTap: () => (qual.playing ? qual.stop() : qual.play()),
            bezel: [
              { k: 'PITCH', v: `${fmtHz(qualF0)} Hz`, tint: colors.cyan },
              { k: 'SUSTAIN', v: fmtS(qual.rendered?.t60), tint: colors.green },
              { k: 'BEND', v: fmtCents(bendCents(strike, 3000)), tint: colors.amber },
              { k: 'OVERTONES', v: qualUpper == null ? '—' : `${(qualUpper * 100).toFixed(0)} %`, tint: qualUpper == null ? colors.textMuted : levelTint(-40 + qualUpper * 40) },
            ],
            params: [
              faderParam({ id: 'strike', label: 'STRIKE', value: strike, min: 0.2, max: 1, step: 0.05, format: (v) => `${Math.round(v * 100)} % — ${v < 0.4 ? 'a light tap: quieter, less bend' : v < 0.75 ? 'a normal stroke' : 'a hard hit: louder, deeper bend'}`, formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setStrike, home: 0.8, level: true }),
              faderParam({ id: 'damp', label: 'DAMPING', value: damping, min: 0, max: 1, step: 0.05, format: (v) => (v < 0.05 ? 'none — the head rings free' : v < 0.35 ? `${Math.round(v * 100)} % · a small gel` : v < 0.7 ? `${Math.round(v * 100)} % · a felt strip` : `${Math.round(v * 100)} % · a pillow`), formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setDamping, home: 0 }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: qual.play },
            ],
            initialParam: 'strike',
          },
          well: (
            <>
              <Landing looking="one hit, left to right in real time; the white line is how loud it is." prompt="▶ STRIKE, then change STRIKE and DAMPING and strike again." />
              <DrumStatus playing={qual.playing} pending={qual.pending} rendering={qual.status === 'rendering'} idle="stopped · press ▶ STRIKE; ride STRIKE and DAMPING and press again" label="the strike" />
              <Card>
                <Point title="The four things a tuner listens for">PITCH is the note you hear first. OVERTONES are the notes above it (the share of the hit above three times the pitch). SUSTAIN is how long the note lasts — the time it takes to fall 60 dB, which the lab calls T60. BEND is how sharp the note starts before it glides down.</Point>
                <Point title="What the controls do">A harder STRIKE is louder and stretches the head more, so it starts sharper and bends deeper. DAMPING shortens the note and takes the overtones first.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'rod', title: 'Turn one rod', kind: 'ADJUST', layout: 'rack',
          rack: {
            render: (w, h) =>
              viewKind === 'drum' ? (
                <DrumTopStage width={w} height={h} drum={DRUM} head={head} selected={lug} tap={lug} tapSync={syncOf(tap)} strikeSync={syncOf(rod)} />
              ) : viewKind === 'wave' ? (
                <WaveStage width={w} height={h} ov={rod.rendered?.overview ?? null} envDb={rod.rendered?.envDb} t60={rod.rendered?.t60} seconds={SPEC.seconds} label={`strike · rod ${lug + 1} at ${fmtTurn(head.turns[lug])}`} progress={rod.progress} playing={rod.playing} idle="rendering…" />
              ) : viewKind === 'pitch' ? (
                <PitchStage width={w} height={h} traces={rod.rendered?.result.pitchTraces ?? []} seconds={SPEC.seconds} resoCents={1200 * Math.log2(fundamentalHz(SPEC.diameterIn, RESO_T, SPEC.sigmaReso) / rodF0)} progress={rod.progress} playing={rod.playing} label="pitch trace" />
              ) : (
                <VibrationStage width={w} height={h} n={vib?.n ?? 0} s={vib?.s ?? 1} mix={vibMix} hz={vib?.hz ?? rodF0} label={`see the vibration · ${vib?.label.replace(/[ab]$/, '') ?? ''}${vibMix ? ' (two notes at once — the twin shape mixes in)' : ''}`} progress={rod.progress} envDb={rod.rendered?.envDb ?? null} seconds={SPEC.seconds} playing={rod.playing} />
              ),
            aspect: viewKind === 'drum' ? TOP_ASPECT : viewKind === 'wave' ? WAVE_ASPECT : viewKind === 'pitch' ? PITCH_ASPECT : VIB_ASPECT,
            size: 'L',
            badge: viewKind === 'drum' ? MODEL_BADGE : viewKind === 'vib' ? VIB_BADGE : RENDER_BADGE,
            onTap: () => (rod.playing ? rod.stop() : rod.play()),
            tapLabel: 'Display: tap to strike or stop',
            bezel: [
              { k: 'ROD', v: `${lug + 1} / ${SPEC.lugs}` },
              { k: 'TURN', v: fmtTurn(head.turns[lug]), flex: 1.3, tint: colors.amber },
              { k: 'LUG PITCH', v: `${fmtHz(lugTapHz(head, lug, SPEC.diameterIn, SPEC.sigmaBatter))} Hz`, tint: colors.cyan, flex: 1.2 },
              { k: 'SPREAD', v: `${spread.toFixed(0)} ¢`, tint: spread <= 10 ? colors.green : spread <= 25 ? colors.amber : colors.red },
              { k: 'BEAT', v: beat < 0.05 ? 'none' : `${beat.toFixed(1)} Hz`, tint: beat < 0.05 ? colors.green : colors.amber },
            ],
            params: [
              faderParam({ id: 'turn', label: 'TURN', value: head.turns[lug], min: -1, max: 1, step: 0.125, format: (v) => `${fmtTurn(v)} on rod ${lug + 1} — ${v > 0.01 ? 'tighter' : v < -0.01 ? 'looser' : 'as it was'}`, formatShort: (v) => fmtTurn(v), onChange: setTurn, home: 0 }),
              optionsParam({ id: 'lug', label: 'ROD', value: lug, options: Array.from({ length: SPEC.lugs }, (_, i) => ({ key: i, label: `Rod ${i + 1}`, short: `#${i + 1}` })), onChange: setLug }),
              flipFader({ id: 'view', label: 'VIEW', items: views, selectedId: view, onSelect: setView, name: (v) => v.label, short: (v) => v.short, blurb: (v) => v.blurb, title: 'THE SAME STRIKE, SEVERAL PICTURES', sticky: true }),
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: tap.play },
              { kind: 'action', id: 'strike', label: '▶ STRIKE', onPress: rod.play },
            ],
            initialParam: 'turn',
          },
          well: (
            <>
              <Landing looking="the drum from above; the coloured wedges are each rod's pitch (blue low, yellow even, red high)." prompt="Pick a ROD, ride TURN, ▶ TAP it, then ▶ STRIKE the drum." />
              <DrumStatus playing={rod.playing || tap.playing} pending={rod.pending || tap.pending} rendering={rod.status === 'rendering' || tap.status === 'rendering'} idle="stopped · pick a ROD, ride TURN, then ▶ TAP that lug or ▶ STRIKE the drum" label={tap.playing || tap.pending ? `the tap at rod ${lug + 1}` : 'the strike'} />
              {turned === 0 ? <Feedback tone="info">Pick a ROD and ride TURN — watch the wedge and SPREAD change.</Feedback> : <Feedback tone={even.verdict === 'even' ? 'ok' : even.verdict === 'close' ? 'info' : 'warn'}>{even.message}</Feedback>}
              <Card>
                <Point title="What one rod does">The tension near that rod changes, so its tap pitch moves. But the head's BALANCE changes too: an uneven head makes two slightly different notes at once, and you hear them beat as a slow warble. BEAT is their difference; SPREAD is the gap in cents (hundredths of a semitone) between the highest and lowest rod.</Point>
              </Card>
              <WhyCard title="WHY · see the vibration">
                <Body>The VIB entries of VIEW draw the head's shape for one note of this same strike: white lines stay still, the coloured regions move up and down — strobed, fading with the hit's own measured loudness. On an uneven head the twin shape mixes in; that is the beat, drawn. Switch VIEW to WAVE or PITCH for the same strike as a waveform or a pitch line.</Body>
              </WhyCard>
            </>
          ),
        },
        {
          key: 'practice', title: 'Check your understanding', kind: 'PRACTICE', layout: 'read',
          body: <DrumScenarioDeck scenarios={SOUND_SCENARIOS} onAnswered={onAnswered} intro="Four decisions about how a drum makes its sound. Decide, then read why." />,
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <YourRun lines={[
                turned ? `You turned a rod ${turned} time${turned === 1 ? '' : 's'}; the head now reads ${spread.toFixed(0)} ¢ spread${beat >= 0.05 ? ` with a ${beat.toFixed(1)} Hz beat` : ''}.` : 'You have not turned a rod yet — the ADJUST step is worth a visit.',
                reached ? `Decisions: ${reached} of ${SOUND_SCENARIOS.length} reached, ${rightFirst} right first time.` : 'Decisions: none answered yet.',
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="What does turning ONE rod change besides that lug's pitch?" a="The head's balance: an uneven head makes two slightly different notes at once, and they beat as a warble." />
              <RecallCard q="Why is tuning to a note optional?" a="A head's overtones are not in simple ratios, so there is no single note to find; the goal is a useful resonant sound." />
              <RecallCard q="Name the four things a tuner listens for." a="Pitch, overtones, sustain and pitch bend." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• A drum is a system: heads, shell, edges, hoops, rods, lugs, air.</Body>
                <Body>• Pitch rises with the square root of tension; a bigger or heavier head sits lower.</Body>
                <Body>• One rod changes its lug's pitch AND the head's balance.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.sound} />
              <Body>TRY NEXT: on the ADJUST step, turn two opposite rods by the same amount in opposite directions and watch SPREAD and the pitch — the mean stays put.</Body>
            </>
          ),
        },
      ]}
    />
  );
}
