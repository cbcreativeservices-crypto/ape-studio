/**
 * Chapter 4 — Tuning the whole drum. LEARN (read: three contrasting
 * relationships and what each tends to do — none of them "correct") →
 * HEAR (rack: "Compare head relationships" — batter and resonant tuned
 * independently, struck, compared for sustain and bend on the waveform,
 * the pitch trace and the vibration view) → LEARN (read: why a drum's
 * response also depends on size, construction, heads and playing) →
 * PRACTICE → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { faderParam, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumScenarioDeck, DrumStatus, Feedback, KeyTerms, Point, SectionTitle, fmtHz, noteName } from '../kit';
import { DRUM_KEY_TERMS, RELATIONSHIPS, WHOLE_SCENARIOS, type RelationshipId } from '../drumContent';
import { DRUMS, bendCents, dominantCents, strikePartials, type StrikeParams } from '../drumEngine';
import { ANAT_ASPECT, AnatomyStage } from '../stagesDrum';
import { PITCH_ASPECT, PitchStage, VIB_ASPECT, VibrationStage, WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { RENDER_BADGE, VIB_BADGE, fmtCents, fmtS, headAtHz, useStrike, type ChapterProps } from './shared';

const DRUM = 'rack' as const;
const SPEC = DRUMS[DRUM];

type View = 'wave' | 'pitch' | 'vib';
const VIEWS: { key: View; label: string; short: string; blurb: string }[] = [
  { key: 'wave', label: 'The rendered strike', short: 'WAVE', blurb: 'The hit on its real time base: envelope and T60.' },
  { key: 'pitch', label: 'The pitch trace', short: 'PITCH', blurb: 'The fundamental family over time — where the late sound sits.' },
  { key: 'vib', label: 'See the vibration', short: 'VIBRATE', blurb: 'The (0,1) shape the sound was built from, fading with the hit.' },
];

export function Ch4Whole({ onAnswered, onInteractive }: ChapterProps) {
  const [batterHz, setBatterHz] = useState(190);
  const [resoHz, setResoHz] = useState(190);
  const strikeAmt = 0.85;
  const [view, setView] = useState<View>('wave');
  const [heard, setHeard] = useState<Set<RelationshipId>>(() => new Set());
  const reported = useRef(false);

  const params = useMemo<StrikeParams>(() => ({ drum: DRUM, batter: headAtHz(DRUM, batterHz, 'batter'), reso: headAtHz(DRUM, resoHz, 'reso'), resoPresent: true, damping: 0, strike: strikeAmt, strikeR: 0.3, strikeTheta: 0 }), [batterHz, resoHz, strikeAmt]);
  const pb = useStrike(params);
  const parts = useMemo(() => strikePartials(params), [params]);
  const fund = parts.filter((p) => p.head === 'coupled');
  const traces = pb.rendered?.result.pitchTraces ?? [];
  const early = traces.length ? dominantCents(traces, 0.05) : null;
  const late = traces.length ? dominantCents(traces, Math.min(SPEC.seconds - 0.05, 0.9)) : null;
  const semis = 12 * Math.log2(resoHz / batterHz);
  const rel: RelationshipId = semis > 0.75 ? 'resoHigher' : semis < -0.75 ? 'batterHigher' : 'equal';
  const relInfo = RELATIONSHIPS.find((r) => r.id === rel)!;

  // Heard = struck with this relationship. Credit when all three are heard.
  useEffect(() => {
    if (!pb.playing) return;
    setHeard((h) => (h.has(rel) ? h : new Set([...h, rel])));
  }, [pb.playing, rel]);
  useEffect(() => {
    if (heard.size >= 3 && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [heard, onInteractive]);

  const preset = (id: RelationshipId) => {
    const r = RELATIONSHIPS.find((x) => x.id === id)!;
    const st = id === 'resoHigher' ? r.semitones : id === 'batterHigher' ? -r.semitones : 0;
    setResoHz(Math.round(batterHz * Math.pow(2, st / 12)));
  };
  const resoCents = 1200 * Math.log2(resoHz / batterHz);
  const dom = fund.reduce((a, b) => (b.amp > a.amp ? b : a), fund[0]);

  return (
    <ChapterSteps
      steps={[
        {
          key: 'relationships', title: 'Three relationships', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <ExpandableFigure aspect={ANAT_ASPECT} badge="MODEL · the air couples the heads" title="THE AIR" render={(w, h) => <AnatomyStage width={w} height={h} part="air" />} />
              <SectionTitle>TWO HEADS, ONE INSTRUMENT</SectionTitle>
              <Body>Once each head is even, the drum's sound is set by how the two relate. The batter pushes the air; the air pushes the resonant head; the two trade energy for as long as the note lasts. Where the resonant head sits against the batter decides where that energy ends up — and how long it stays.</Body>
              <Card>
                {RELATIONSHIPS.map((r) => (
                  <Point key={r.id} title={r.label}>{r.tends}</Point>
                ))}
              </Card>
              <Card tone="warn">
                <Point title="None of these is the correct one">Makers and players describe contrasting methods: one describes tuning the resonant head somewhat higher for a focused result; another describes tuning it lower to shape the pitch bend; many start equal. They are examples of methods for different sounds, not universal rules. The next step lets you hear all three on the same drum and decide what each one is FOR.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'compare', title: 'Compare head relationships', kind: 'HEAR', layout: 'rack',
          rack: {
            render: (w, h) =>
              view === 'wave' ? (
                <WaveStage width={w} height={h} ov={pb.rendered?.overview ?? null} envDb={pb.rendered?.envDb} t60={pb.rendered?.t60} seconds={SPEC.seconds} label={`${relInfo.short} · batter ${batterHz} Hz · reso ${resoHz} Hz`} progress={pb.progress} playing={pb.playing} idle="rendering…" />
              ) : view === 'pitch' ? (
                <PitchStage width={w} height={h} traces={traces} seconds={SPEC.seconds} resoCents={resoCents} progress={pb.progress} playing={pb.playing} label={`pitch trace · ${relInfo.short}`} />
              ) : (
                <VibrationStage width={w} height={h} n={0} s={1} mix={0} hz={dom?.hz ?? batterHz} label={`see the vibration · (0,1) · ${relInfo.short}`} progress={pb.progress} envDb={pb.rendered?.envDb ?? null} seconds={SPEC.seconds} playing={pb.playing} />
              ),
            aspect: view === 'wave' ? WAVE_ASPECT : view === 'pitch' ? PITCH_ASPECT : VIB_ASPECT,
            size: 'L',
            badge: view === 'vib' ? VIB_BADGE : RENDER_BADGE,
            bezel: [
              { k: 'BATTER', v: `${batterHz} Hz`, tint: colors.cyan },
              { k: 'RESO', v: `${resoHz} Hz`, tint: colors.green },
              { k: 'REL', v: `${semis >= 0 ? '+' : ''}${semis.toFixed(1)} st`, flex: 1.1, tint: colors.amber },
              { k: 'SUSTAIN', v: fmtS(pb.rendered?.t60), tint: colors.green },
              { k: 'LATE−EARLY', v: early != null && late != null ? fmtCents(late - early) : '—', flex: 1.4, tint: colors.amber },
            ],
            params: [
              faderParam({ id: 'batter', label: 'BATTER', value: batterHz, min: SPEC.usefulHz[0], max: SPEC.usefulHz[1], step: 1, format: (v) => `batter (0,1) ${v.toFixed(0)} Hz · ${noteName(v)}`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setBatterHz, home: 190 }),
              faderParam({ id: 'reso', label: 'RESO', value: resoHz, min: Math.round(SPEC.usefulHz[0] * 0.8), max: Math.round(SPEC.usefulHz[1] * 1.3), step: 1, format: (v) => `resonant (0,1) ${v.toFixed(0)} Hz · ${(12 * Math.log2(v / batterHz)).toFixed(1)} st vs batter`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setResoHz, home: batterHz }),
              optionsParam({ id: 'preset', label: 'SET', value: rel, options: RELATIONSHIPS.map((r) => ({ key: r.id, label: r.label, short: r.short, blurb: r.tends })), onChange: preset, sticky: false }),
              optionsParam({ id: 'view', label: 'VIEW', value: view, options: VIEWS, onChange: setView }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: pb.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: pb.stop, tint: colors.green },
            ],
            initialParam: 'reso',
            onTap: () => (pb.playing ? pb.stop() : pb.play()),
          },
          well: (
            <>
              <DrumStatus playing={pb.playing} pending={pb.pending} rendering={pb.status === 'rendering'} idle={`stopped · heard ${heard.size} of 3 relationships · SET one, press ▶ STRIKE`} label="the strike" />
              <Feedback tone="info">{`${relInfo.label}: ${relInfo.tends}`}</Feedback>
              <Body>Tune BATTER and RESO independently, or press SET for the three textbook relationships, then ▶ STRIKE and compare. SUSTAIN is the T60 measured from this render; LATE−EARLY is where the loudest part of the fundamental family sits at 0.9 s against where it started — the relationship's own apparent bend, on top of the strike's. Switch VIEW to PITCH to watch it.</Body>
              <Card>
                <Point title="What you are hearing">The two (0,1) modes of a two-headed drum: a lower one where the heads move together through the air (a weak radiator — it sings), a higher one where they squeeze it (a strong radiator — it dies fast). Equal heads share the energy; a detuned pair localises it on one head, and the resonant head, with no stick on it, keeps whatever lands on it longest.</Point>
                <Point title="So which is right?">The one that makes the sound the music needs on the drum you have. The strike's own glide (Chapter 1) rides on top of LATE−EARLY, the relationship's. Both are real; neither is a rule.</Point>
              </Card>
              <Card tone="accent">
                <Point title="Credit">Strike the drum with all three relationships set (RESO ↑, EQUAL, BATTER ↑). {heard.size} of 3 so far.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'depends', title: 'Why the same tuning sounds different', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>IT DEPENDS — AND HERE IS ON WHAT</SectionTitle>
              <Card>
                <Point title="Size">A deeper shell holds more air and couples the heads more softly; a bigger head sits lower and bends more at the same tension. A relationship that sings on a 12" can thud on a 16".</Point>
                <Point title="Construction">Shell material and thickness, the bearing edge profile, hoop type (die-cast hoops damp the head's edge more than triple-flanged) — each shifts sustain and overtone balance before you touch a rod.</Point>
                <Point title="Head choice">Single-ply, double-ply, coated, clear, a thin resonant head versus a thick one: head weight sets pitch at a given tension (f ∝ 1/√σ) and head damping sets how much ring there is to shape.</Point>
                <Point title="Playing style">A hard hitter drives the bend and the overtones; a light touch barely moves the resonant head. Tune for the stroke the drum will actually receive, from the seat.</Point>
              </Card>
              <Body>This is why the lab reports what each relationship TENDS to do, measured on its own simulated tom, and asks you to listen — not to copy a number.</Body>
            </>
          ),
        },
        {
          key: 'practice', title: 'Check your understanding', kind: 'PRACTICE', layout: 'read',
          body: <DrumScenarioDeck scenarios={WHOLE_SCENARIOS} onAnswered={onAnswered} intro="Three decisions about the two heads together." />,
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• The resonant head is half the instrument: it sets where the energy goes and how long it lasts.</Body>
                <Body>• Resonant higher, equal, batter higher — each is a sound, not a mistake and not a rule.</Body>
                <Body>• Size, construction, heads and playing style change what any relationship does.</Body>
                <Body>• Decide by striking the drum from the seat and listening for sustain and bend.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.whole} />
              <Body>{`Reference: the bend of a hard hit alone on this tom at ${batterHz} Hz is about ${fmtHz(bendCents(1, headAtHz(DRUM, batterHz, 'batter').tension))} cents.`}</Body>
            </>
          ),
        },
      ]}
    />
  );
}
