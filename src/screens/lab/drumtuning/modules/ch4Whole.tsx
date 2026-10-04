/**
 * Chapter 4 — Tuning the whole drum. LEARN (read: three contrasting
 * relationships and what each tends to do IN THIS MODEL — none of them
 * "correct", and drummers describe the bend both ways) → HEAR (rack:
 * "Compare head relationships" — batter and resonant tuned independently,
 * struck, compared for sustain and where the late sound sits, on the
 * waveform, the pitch trace and the vibration view; then ONE judgement:
 * which rang longest) → LEARN (read: why a drum's response also depends on
 * size, construction, heads and playing) → PRACTICE → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { faderParam, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumScenarioDeck, DrumStatus, Feedback, KeyButton, KeyTerms, Landing, Point, RecallCard, SectionTitle, WhyCard, YourRun, fmtHz, noteName } from '../kit';
import { DRUM_KEY_TERMS, RELATIONSHIPS, RELATIONSHIP_CAVEAT, WHOLE_SCENARIOS, type RelationshipId } from '../drumContent';
import { DRUMS, PITCH_CLAMP, bendCents, strikePartials, weightedCents, type StrikeParams } from '../drumEngine';
import { ANAT_ASPECT, AnatomyStage } from '../stagesDrum';
import { PITCH_ASPECT, PitchStage, VIB_ASPECT, VibrationStage, WAVE_ASPECT, WaveStage } from '../stagesSignal';
import { RENDER_BADGE, VIB_BADGE, fmtCents, fmtS, headAtHz, useStrike, type ChapterProps } from './shared';

const DRUM = 'rack' as const;
const SPEC = DRUMS[DRUM];
/** A relationship counts as HEARD after this much of it has sounded. */
const HEARD_AFTER_MS = 600;

type StageView = 'wave' | 'pitch' | 'vib';
const VIEWS: { key: StageView; label: string; short: string; blurb: string }[] = [
  { key: 'wave', label: 'The rendered strike', short: 'WAVE', blurb: 'The hit on its real time base: loudness and the green died-away mark.' },
  { key: 'pitch', label: 'The pitch trace', short: 'PITCH', blurb: 'The main note over time — where the late sound sits.' },
  { key: 'vib', label: 'See the vibration', short: 'VIBRATE', blurb: 'The head shape the sound was built from, fading with the hit.' },
];

export function Ch4Whole({ onAnswered, onInteractive, answers }: ChapterProps) {
  const [batterHz, setBatterHz] = useState(190);
  const [resoHz, setResoHz] = useState(190);
  const strikeAmt = 0.85;
  const [view, setView] = useState<StageView>('wave');
  /** Relationship → the T60 measured when it was heard. */
  const [heard, setHeard] = useState<Map<RelationshipId, number>>(() => new Map());
  const [longest, setLongest] = useState<RelationshipId | null>(null);
  const [longestRight, setLongestRight] = useState<boolean | null>(null);
  const [firstLongest, setFirstLongest] = useState<RelationshipId | null>(null);
  const reported = useRef(false);

  const params = useMemo<StrikeParams>(() => ({ drum: DRUM, batter: headAtHz(DRUM, batterHz, 'batter'), reso: headAtHz(DRUM, resoHz, 'reso'), resoPresent: true, damping: 0, strike: strikeAmt, strikeR: 0.3, strikeTheta: 0 }), [batterHz, resoHz, strikeAmt]);
  const pb = useStrike(params);
  const parts = useMemo(() => strikePartials(params), [params]);
  const fund = parts.filter((p) => p.head === 'coupled');
  const traces = pb.rendered?.result.pitchTraces ?? [];
  const late = traces.length ? weightedCents(traces, Math.min(SPEC.seconds - 0.05, 0.9)) : null;
  const semis = 12 * Math.log2(resoHz / batterHz);
  const rel: RelationshipId = semis > 0.75 ? 'resoHigher' : semis < -0.75 ? 'batterHigher' : 'equal';
  const relInfo = RELATIONSHIPS.find((r) => r.id === rel)!;

  // HEARD = this relationship has sounded for HEARD_AFTER_MS (a tap-to-stop a
  // tenth of a second in does not count). Its measured T60 is remembered for
  // the judgement.
  const t60 = pb.rendered?.t60;
  useEffect(() => {
    if (!pb.playing || t60 == null) return;
    const id = setTimeout(() => setHeard((h) => (h.has(rel) ? h : new Map([...h, [rel, t60]]))), HEARD_AFTER_MS);
    return () => clearTimeout(id);
  }, [pb.playing, rel, t60]);
  const allHeard = heard.size >= 3;
  const measuredLongest = useMemo<RelationshipId | null>(() => {
    if (!allHeard) return null;
    let best: RelationshipId | null = null;
    for (const [k, v] of heard) if (best == null || v > (heard.get(best) ?? 0)) best = k;
    return best;
  }, [heard, allHeard]);
  const judge = (id: RelationshipId) => {
    if (!measuredLongest) return;
    setLongest(id);
    if (firstLongest == null) setFirstLongest(id);
    setLongestRight(id === measuredLongest);
  };
  // CREDIT: all three heard AND the right judgement reached (a retry is free).
  useEffect(() => {
    if (allHeard && longestRight && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [allHeard, longestRight, onInteractive]);

  const preset = (id: RelationshipId) => {
    const r = RELATIONSHIPS.find((x) => x.id === id)!;
    const st = id === 'resoHigher' ? r.semitones : id === 'batterHigher' ? -r.semitones : 0;
    setResoHz(Math.round(batterHz * Math.pow(2, st / 12)));
  };
  const resoCents = 1200 * Math.log2(resoHz / batterHz);
  const dom = fund.reduce((a, b) => (b.amp > a.amp ? b : a), fund[0]);
  const modesLabel = fund.map((f) => f.hz.toFixed(0)).join(' / ');
  const reached = WHOLE_SCENARIOS.filter((s) => s.id in answers).length;
  const rightFirst = WHOLE_SCENARIOS.filter((s) => answers[s.id] === true).length;

  return (
    <ChapterSteps
      steps={[
        {
          key: 'relationships', title: 'Three relationships', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <ExpandableFigure aspect={ANAT_ASPECT} badge="MODEL · the air couples the heads" title="THE AIR" render={(w, h) => <AnatomyStage width={w} height={h} part="air" />} />
              <SectionTitle>TWO HEADS, ONE INSTRUMENT</SectionTitle>
              <Body>Once each head is even, the drum's sound is set by how the two relate. The batter pushes the air; the air pushes the resonant head; the two trade the sound back and forth for as long as the note lasts. Where the resonant head sits against the batter decides where that energy ends up — and how long it stays.</Body>
              <Card>
                {RELATIONSHIPS.map((r) => (
                  <Point key={r.id} title={r.label}>{r.tends}</Point>
                ))}
              </Card>
              <Card tone="warn">
                <Point title="None of these is the correct one">{RELATIONSHIP_CAVEAT} Makers and players describe contrasting methods: one describes tuning the resonant head somewhat higher for a focused result; another describes tuning it lower to shape the pitch bend; many start equal. They are examples of methods for different sounds, not universal rules. The next step lets you hear all three on the same drum.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'compare', title: 'Compare head relationships', kind: 'HEAR', layout: 'rack',
          rack: {
            render: (w, h) =>
              view === 'wave' ? (
                <WaveStage width={w} height={h} ov={pb.rendered?.overview ?? null} envDb={pb.rendered?.envDb} t60={pb.rendered?.t60} seconds={SPEC.seconds} label={`${relInfo.short} · drum sounds ${modesLabel} Hz`} progress={pb.progress} playing={pb.playing} idle="making the sound…" />
              ) : view === 'pitch' ? (
                <PitchStage width={w} height={h} traces={traces} seconds={SPEC.seconds} resoCents={resoCents} progress={pb.progress} playing={pb.playing} label={`pitch trace · ${relInfo.short}`} />
              ) : (
                <VibrationStage width={w} height={h} n={0} s={1} mix={0} hz={dom?.hz ?? batterHz} label={`see the vibration · main note · ${relInfo.short}`} progress={pb.progress} envDb={pb.rendered?.envDb ?? null} seconds={SPEC.seconds} playing={pb.playing} />
              ),
            aspect: view === 'wave' ? WAVE_ASPECT : view === 'pitch' ? PITCH_ASPECT : VIB_ASPECT,
            size: 'L',
            badge: view === 'vib' ? VIB_BADGE : RENDER_BADGE,
            bezel: [
              { k: 'BATTER', v: `${batterHz} Hz`, tint: colors.cyan },
              { k: 'RESO', v: `${resoHz} Hz`, tint: colors.green },
              { k: 'REL', v: `${semis >= 0 ? '+' : ''}${semis.toFixed(1)} st`, flex: 1.1, tint: colors.amber },
              { k: 'SUSTAIN', v: fmtS(pb.rendered?.t60), tint: colors.green },
              { k: 'LATE SOUND', v: late != null ? `${Math.abs(late) >= PITCH_CLAMP ? '≈' : ''}${fmtCents(late)}` : '—', flex: 1.4, tint: colors.amber },
            ],
            params: [
              faderParam({ id: 'batter', label: 'BATTER', value: batterHz, min: SPEC.usefulHz[0], max: SPEC.usefulHz[1], step: 1, format: (v) => `batter's own pitch ${v.toFixed(0)} Hz (${noteName(v)}) — before the air couples it`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setBatterHz, home: 190 }),
              faderParam({ id: 'reso', label: 'RESO', value: resoHz, min: Math.round(SPEC.usefulHz[0] * 0.8), max: Math.round(SPEC.usefulHz[1] * 1.3), step: 1, format: (v) => `resonant head's own pitch ${v.toFixed(0)} Hz · ${(12 * Math.log2(v / batterHz)).toFixed(1)} st vs batter`, formatShort: (v) => `${v.toFixed(0)} Hz`, onChange: setResoHz, home: batterHz }),
              optionsParam({ id: 'preset', label: 'SET', value: rel, options: RELATIONSHIPS.map((r) => ({ key: r.id, label: r.label, short: r.short, blurb: r.tends })), onChange: preset, sticky: false }),
              optionsParam({ id: 'view', label: 'VIEW', value: view, options: VIEWS, onChange: setView }),
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: pb.play },
            ],
            initialParam: 'reso',
            onTap: () => (pb.playing ? pb.stop() : pb.play()),
          },
          well: (
            <>
              <Landing looking="one hit of the tom; the green mark is where it has died away." prompt="SET a relationship, ▶ STRIKE, compare — then say which rang longest." />
              <DrumStatus playing={pb.playing} pending={pb.pending} failed={pb.failed} rendering={pb.status === 'rendering'} idle={`stopped · heard ${heard.size} of 3 relationships · SET one, press ▶ STRIKE`} label="the strike" />
              <Feedback tone="info">{`${relInfo.label}: ${relInfo.tends}`}</Feedback>
              {allHeard ? (
                <Card tone="accent">
                  <Point title="WHICH ONE RANG LONGEST?">Checked against the three SUSTAIN readings you heard. Credit on the right answer; a retry is free.</Point>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {RELATIONSHIPS.map((r) => (
                      <KeyButton key={r.id} label={longest === r.id ? `▸ ${r.short}` : r.short} onPress={() => judge(r.id)} tint={longest === r.id ? (longestRight ? colors.green : colors.red) : undefined} />
                    ))}
                  </View>
                  {longest ? (
                    <Feedback tone={longestRight ? 'ok' : 'warn'}>
                      {longestRight
                        ? `Yes — ${RELATIONSHIPS.find((r) => r.id === longest)!.short} measured ${fmtS(heard.get(longest))}, the longest of the three (${RELATIONSHIPS.map((r) => `${r.short} ${fmtS(heard.get(r.id))}`).join(' · ')}).`
                        : `${RELATIONSHIPS.find((r) => r.id === longest)!.short} measured ${fmtS(heard.get(longest))}; one of the others rang longer. Strike them again back to back and read SUSTAIN.`}
                    </Feedback>
                  ) : null}
                </Card>
              ) : (
                <Card>
                  <Point title="Credit">Strike the drum with all three relationships set (RESO ↑, EQUAL, BATTER ↑) — {heard.size} of 3 so far — then answer one question.</Point>
                </Card>
              )}
              <WhyCard title="WHY · what you are hearing">
                <Body>SUSTAIN is the T60 measured from this render — the time the note takes to fall 60 dB. LATE SOUND is where the main note sits at 0.9 s against the batter's own pitch (clamped at ±{PITCH_CLAMP} ¢): above it with the resonant head high, at it when equal, below it with the resonant head low — in this model. The drum sounds TWO main notes, not one: a lower one where the heads move together through the air (a weak radiator — it sings) and a higher one where they squeeze it (a strong radiator — it dies fast); the glass label shows both. The strike's own glide (Chapter 1) rides on top. Switch VIEW to PITCH to watch it.</Body>
              </WhyCard>
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
                <Point title="Head choice">Single-ply, double-ply, coated, clear, a thin resonant head versus a thick one: a heavier head sits lower at a given tension, and a head's own damping sets how much ring there is to shape.</Point>
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
              <YourRun lines={[
                heard.size ? `Heard ${heard.size} of 3 relationships: ${[...heard].map(([k, v]) => `${RELATIONSHIPS.find((r) => r.id === k)!.short} ${fmtS(v)}`).join(' · ')}.` : 'No relationship heard yet.',
                firstLongest ? `Which rang longest: you first said ${RELATIONSHIPS.find((r) => r.id === firstLongest)!.short}${longestRight ? ' — right.' : measuredLongest ? `; the measurement says ${RELATIONSHIPS.find((r) => r.id === measuredLongest)!.short}.` : '.'}` : 'Which rang longest: not answered yet.',
                reached ? `Decisions: ${reached} of ${WHOLE_SCENARIOS.length} reached, ${rightFirst} right first time.` : 'Decisions: none answered yet.',
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="Which relationship tends to sustain longest in this model, and why?" a="Equal heads: the two trade the sound back and forth freely, and the resonant head — with no stick on it — keeps whatever lands on it longest." />
              <RecallCard q="Is one relationship the correct one?" a="No. Each is a different sound; drummers even describe the bend in opposite ways. Choose by listening to the drum in front of you." />
              <RecallCard q={'Why does the same relationship sound different on a 16" floor tom?'} a="Size, construction, head choice and playing style all change a drum's response." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• The resonant head is half the instrument: it sets where the energy goes and how long it lasts.</Body>
                <Body>• Resonant higher, equal, batter higher — each is a sound, not a mistake and not a rule.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.whole} />
              <Body>{`TRY NEXT: set the batter to ${batterHz} Hz and move RESO slowly from 3 st below to 3 st above, striking as you go — the bend of a hard hit alone on this tom is about ${fmtHz(bendCents(1, headAtHz(DRUM, batterHz, 'batter').tension))} cents; hear what the relationship adds.`}</Body>
            </>
          ),
        },
      ]}
    />
  );
}
