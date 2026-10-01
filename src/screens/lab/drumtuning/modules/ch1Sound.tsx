/**
 * Chapter 1 — How a drum makes sound. LEARN (rack: the drum as a system,
 * part by part) → LEARN (rack: tension and pitch on the partial ladder) →
 * LEARN (rack: the shell and the bearing edge) → HEAR (rack: pitch,
 * overtones, sustain, pitch bend on the rendered strike) → ADJUST (rack:
 * "Turn one rod", with the optional See-the-vibration view) → PRACTICE →
 * REVIEW.
 */
import { useMemo, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam, flipFader, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumScenarioDeck, DrumStatus, Feedback, KeyTerms, Point, SectionTitle, fmtHz, levelTint, noteName } from '../kit';
import { DRUM_KEY_TERMS, SOUND_SCENARIOS } from '../drumContent';
import { DRUMS, beatRateHz, bendCents, evenHead, evenness, fundamentalHz, lugTapHz, spreadCents, strikePartials, upperRatio, type HeadState, type StrikeParams } from '../drumEngine';
import { ANAT_ASPECT, AnatomyStage, DrumTopStage, EDGES, EDGE_ASPECT, EdgeStage, PARTS, TOP_ASPECT, type DrumPart, type EdgeProfile } from '../stagesDrum';
import { PART_ASPECT, PITCH_ASPECT, PartialsStage, PitchStage, VIB_ASPECT, VibrationStage, WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { MODEL_BADGE, RENDER_BADGE, VIB_BADGE, fmtCents, fmtS, fmtTurn, useStrike, useTap, type ChapterProps } from './shared';

const DRUM = 'rack' as const;
const SPEC = DRUMS[DRUM];
const RESO_T = 2600;

type ViewItem = { id: string; label: string; short: string; blurb: string; vib?: number };
const BASE_VIEWS: ViewItem[] = [
  { id: 'drum', label: 'The drum and its tension map', short: 'DRUM', blurb: 'The head from above with the map around the lugs.' },
  { id: 'wave', label: 'The rendered strike', short: 'WAVE', blurb: 'The hit on its real time base, with its envelope.' },
  { id: 'pitch', label: 'The pitch trace', short: 'PITCH', blurb: 'Pitch over time of the fundamental family: the bend.' },
];

export function Ch1Sound({ onAnswered }: ChapterProps) {
  const [part, setPart] = useState<DrumPart>('batter');
  const [tension, setTension] = useState(3000);
  const [edge, setEdge] = useState<EdgeProfile>('double45');
  const [strike, setStrike] = useState(0.8);
  const [damping, setDamping] = useState(0);
  const [lug, setLug] = useState(0);
  const [head, setHead] = useState<HeadState>(() => evenHead(3000, SPEC.lugs));
  const [view, setView] = useState('drum');
  const [prevSpread, setPrevSpread] = useState<number | undefined>(undefined);

  // Lesson 2: an even head at TENSION — the partial ladder follows it.
  const tensionParts = useMemo(() => strikePartials({ drum: DRUM, batter: evenHead(tension, SPEC.lugs), reso: evenHead(RESO_T, SPEC.lugs), resoPresent: true, damping: 0, strike: 0.8, strikeR: 0.3, strikeTheta: 0 }), [tension]);
  const f0 = fundamentalHz(SPEC.diameterIn, tension, SPEC.sigmaBatter);
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
    setHead((h) => ({ ...h, turns: h.turns.map((t, i) => (i === lug ? v : t)) }));
  };

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
              <Body>Ride PART across the cutaway. Every one of these takes part in the result — the two heads, the shell with its bearing edges, the hoops, the rods and lugs, and the air sealed between the heads. Tuning is the act of setting them against each other.</Body>
              <Card tone="accent">
                <Point title={PARTS.find((p) => p.id === part)?.label ?? ''}>{PARTS.find((p) => p.id === part)?.role ?? ''}</Point>
              </Card>
              <Card>
                <Point title="The two heads">The batter is struck; the resonant head responds to the drum's vibration through the air. Both affect the sound — the second one more than most players expect.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'tension', title: 'Tension and pitch', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <PartialsStage width={w} height={h} partials={tensionParts} fb={f0} label={`${SPEC.name} · ${tension} N/m`} />,
            aspect: PART_ASPECT,
            badge: MODEL_BADGE,
            onTap: () => (tensionStrike.playing ? tensionStrike.stop() : tensionStrike.play()),
            bezel: [
              { k: 'TENSION', v: `${tension} N/m`, flex: 1.4 },
              { k: '(0,1)', v: `${fmtHz(f0)} Hz`, tint: colors.cyan },
              { k: 'NOTE', v: noteName(f0), flex: 1.2 },
              { k: '(1,1)', v: `${fmtHz(f0 * 1.594)} Hz` },
            ],
            params: [
              faderParam({ id: 'tension', label: 'TENSION', value: tension, min: SPEC.tensionRange[0], max: SPEC.tensionRange[1], step: 50, format: (v) => `${v.toFixed(0)} N/m · (0,1) ${fundamentalHz(SPEC.diameterIn, v, SPEC.sigmaBatter).toFixed(0)} Hz`, formatShort: (v) => `${v.toFixed(0)} N/m`, onChange: setTension, home: 3000 }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: tensionStrike.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: tensionStrike.stop, tint: colors.green },
            ],
            initialParam: 'tension',
          },
          well: (
            <>
              <DrumStatus playing={tensionStrike.playing} pending={tensionStrike.pending} rendering={tensionStrike.status === 'rendering'} idle="stopped · ride TENSION, then press ▶ STRIKE" label="the strike" />
              <Body>Ride TENSION: every partial on the ladder climbs together. The head's (0,1) frequency is (j₀₁ ÷ 2πR) · √(T ÷ σ) — pitch rises with the square root of tension, so four times the tension is one octave, and a bigger head (R) or a heavier film (σ) sits lower at the same tension.</Body>
              <Card>
                <Point title="Not a harmonic series">The partials sit at 1 : 1.59 : 2.14 : 2.30 : 2.65 — the Bessel-zero ratios of a clamped membrane. That is why a bare drumhead has no single clean pitch, and why tuning to an exact note is OPTIONAL: the aim is a useful resonant sound, which the NOTE cell merely names for reference.</Point>
                <Point title="One rod, not all of them">Lesson 5 turns one rod. The pitch near it moves — and so does the balance of the whole head.</Point>
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
              <Body>Ride EDGE. The bearing edge is where the head meets the shell; its profile sets how much head is in contact. A sharp peak touches a thin line and lets the head ring; a rounder edge puts more head on more wood and tends to warm and shorten the note.</Body>
              <Card tone="accent">
                <Point title={EDGES.find((e) => e.id === edge)?.label ?? ''}>{EDGES.find((e) => e.id === edge)?.contact} {EDGES.find((e) => e.id === edge)?.tends}</Point>
              </Card>
              <Card>
                <Point title="The shell">Material, thickness, depth and construction colour the sound — a thin maple shell, a thick birch shell and a brass shell each add their own character. They do it TOGETHER with the heads, the edges, the hoops and the tuning: no shell material decides a drum's sound on its own, and a well-cut edge on a plain shell beats a ragged edge on an expensive one.</Point>
                <Point title="Why it matters for tuning">A true, clean, level bearing edge is what lets a head seat evenly. A dented or dirty edge shows up as a spot that will not tune — Chapter 2 looks for it.</Point>
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
              faderParam({ id: 'strike', label: 'STRIKE', value: strike, min: 0.2, max: 1, step: 0.05, format: (v) => `${Math.round(v * 100)} % — ${v < 0.4 ? 'a light tap' : v < 0.75 ? 'a normal stroke' : 'a hard hit'}`, formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setStrike, home: 0.8, level: true }),
              faderParam({ id: 'damp', label: 'DAMPING', value: damping, min: 0, max: 1, step: 0.05, format: (v) => (v < 0.05 ? 'none — the head rings free' : v < 0.35 ? `${Math.round(v * 100)} % · a small gel` : v < 0.7 ? `${Math.round(v * 100)} % · a felt strip` : `${Math.round(v * 100)} % · a pillow`), formatShort: (v) => `${Math.round(v * 100)} %`, onChange: setDamping, home: 0 }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: qual.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: qual.stop, tint: colors.green },
            ],
            initialParam: 'strike',
          },
          well: (
            <>
              <DrumStatus playing={qual.playing} pending={qual.pending} rendering={qual.status === 'rendering'} idle="stopped · press ▶ STRIKE; ride STRIKE and DAMPING and press again" label="the strike" />
              <Body>The four things a tuner listens for, each with a readout on the bezel. The glass is the rendered hit on its real time base: the columns are the synthesized buffer, the white line its measured envelope, the green mark where it has fallen 60 dB.</Body>
              <Card>
                <Point title="Pitch">The note you hear first — the (0,1) family, set by tension, size and head weight. Sometimes a note name, more often "higher than the floor tom".</Point>
                <Point title="Overtones">The partials above it, at non-whole-number ratios. OVERTONES is the share of the strike's energy above three times the fundamental — DAMPING takes it down first.</Point>
                <Point title="Sustain">How long the note lasts: SUSTAIN is the T60 measured from this render. Damping shortens it; the resonant head (Chapter 4) lengthens or shortens it.</Point>
                <Point title="Pitch bend">A hard hit stretches the head and raises its tension for a moment, so the note starts sharp and glides DOWN as it decays. BEND is how sharp it starts: ride STRIKE up and the number grows with the square of the stroke; lower tension bends more.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'rod', title: 'Turn one rod', kind: 'ADJUST', layout: 'rack',
          rack: {
            render: (w, h) =>
              viewKind === 'drum' ? (
                <DrumTopStage width={w} height={h} drum={DRUM} head={head} selected={lug} tap={lug} />
              ) : viewKind === 'wave' ? (
                <WaveStage width={w} height={h} ov={rod.rendered?.overview ?? null} envDb={rod.rendered?.envDb} t60={rod.rendered?.t60} seconds={SPEC.seconds} label={`strike · lug ${lug + 1} at ${fmtTurn(head.turns[lug])}`} progress={rod.progress} playing={rod.playing} idle="rendering…" />
              ) : viewKind === 'pitch' ? (
                <PitchStage width={w} height={h} traces={rod.rendered?.result.pitchTraces ?? []} seconds={SPEC.seconds} resoCents={1200 * Math.log2(fundamentalHz(SPEC.diameterIn, RESO_T, SPEC.sigmaReso) / rodF0)} progress={rod.progress} playing={rod.playing} label="pitch trace" />
              ) : (
                <VibrationStage width={w} height={h} n={vib?.n ?? 0} s={vib?.s ?? 1} mix={vibMix} hz={vib?.hz ?? rodF0} label={`see the vibration · ${vib?.label.replace(/[ab]$/, '') ?? ''}${vibMix ? ' (a split pair — the twin shape mixes in)' : ''}`} progress={rod.progress} envDb={rod.rendered?.envDb ?? null} seconds={SPEC.seconds} playing={rod.playing} />
              ),
            aspect: viewKind === 'drum' ? TOP_ASPECT : viewKind === 'wave' ? WAVE_ASPECT : viewKind === 'pitch' ? PITCH_ASPECT : VIB_ASPECT,
            size: 'L',
            badge: viewKind === 'drum' ? MODEL_BADGE : viewKind === 'vib' ? VIB_BADGE : RENDER_BADGE,
            onTap: () => (rod.playing ? rod.stop() : rod.play()),
            tapLabel: 'Display: tap to strike or stop',
            bezel: [
              { k: 'LUG', v: `${lug + 1} / ${SPEC.lugs}` },
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
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: () => { rod.stop(); tap.stop(); }, tint: colors.green },
            ],
            initialParam: 'turn',
          },
          well: (
            <>
              <DrumStatus playing={rod.playing || tap.playing} pending={rod.pending || tap.pending} rendering={rod.status === 'rendering' || tap.status === 'rendering'} idle="stopped · pick a ROD, ride TURN, then ▶ TAP that lug or ▶ STRIKE the drum" label={tap.playing || tap.pending ? `the tap at lug ${lug + 1}` : 'the strike'} />
              <Feedback tone={even.verdict === 'even' ? 'ok' : even.verdict === 'close' ? 'info' : 'warn'}>{even.message}</Feedback>
              <Body>Ride TURN on one rod. The map around the head colours each lug by its pitch against the mean — blue low, red high — and the drum key on the glass shows which rod you are on. ▶ TAP plays that lug's tone (an inch in from the rim); ▶ STRIKE plays the whole drum. Then switch VIEW to WAVE, PITCH or VIBRATE: the same strike, three pictures.</Body>
              <Card>
                <Point title="What one rod does">The tension near that rod changes, so its tap pitch moves. But the head's BALANCE changes too: an uneven map splits every paired mode — (1,1), (2,1), (3,1) — into two tones a few hertz apart. BEAT on the bezel is their difference; you hear it as a slow warble under the note.</Point>
                <Point title="See the vibration">The VIB entries of VIEW draw the head's shape for one partial of this same strike: the white lines are the still lines, the coloured regions move up and down — strobed, and fading with the hit's own measured envelope. On an uneven head the (1,1) pair's twin shape mixes in; that is the beat, drawn. Tapping the display strikes or stops.</Point>
              </Card>
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
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• A drum is a system: heads, shell, edges, hoops, rods, lugs, air.</Body>
                <Body>• Pitch rises with the square root of tension; a bigger or heavier head sits lower.</Body>
                <Body>• The partials are not harmonic, so tuning to a note is optional — a useful resonant sound is the goal.</Body>
                <Body>• One rod changes its lug's pitch AND the head's balance; unevenness splits paired modes and warbles.</Body>
                <Body>• Listen for pitch, overtones, sustain and pitch bend.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.sound} />
            </>
          ),
        },
      ]}
    />
  );
}
