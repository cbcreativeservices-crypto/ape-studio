/**
 * Module 6 — Loudness, dynamics and translation. LEARN (rack: the four
 * numbers, on the Visual Audio Analysis lab's own meters) → LISTEN (rack:
 * quieter vs louder master at matched level, limiter drive on the lane) →
 * LEARN (read: normalization, translation checks) → EXPLORE (rack:
 * translation — the master as heard on other systems) → PRACTICE → REVIEW.
 */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { colors, fonts } from '../../../../theme/tokens';
import { SText } from '../../stageScale';
import { requireVizMeters } from '../../meter/skiaGate';
import { SIGNAL_LABELS, type SignalKey } from '../../meter/meterEngine';
import { VizUnavailableCard } from '../../foundations/bits';
import { powerSpectrumDb } from '../../../../features/ear/earDsp';
import { faderParam, flipFader, optionsParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, KeyTerms, Point, ScenarioCard, SectionTitle, VersionRow, lufsTint, measureBezel } from '../kit';
import { KEY_TERMS, LOUDNESS_SCENARIOS } from '../masteringContent';
import { PLAYBACK_SYSTEMS, TRANSLATION_ASPECT, TranslationStage, WAVE_ASPECT, WaveOverviewStage } from '../stages';
import { programmeIfRendered, useMasterPlayback, type MasterVariant } from '../useMasterPlayback';
import { MODEL_BADGE, RENDER_BADGE, type ModuleProps } from './shared';

const CEILING = -1.0;
const METER_SIGNALS: readonly { id: SignalKey; name: string; blurb: string }[] = [
  { id: 'music', name: SIGNAL_LABELS.music, blurb: 'A full mix: peaks ride far above the average — the LUFS-vs-peak lesson.' },
  { id: 'speech', name: SIGNAL_LABELS.speech, blurb: 'Bursts and gaps: the integrated number sits well below the peaks.' },
  { id: 'kick', name: SIGNAL_LABELS.kick, blurb: 'Huge peak, tiny average — what a limiter sees first.' },
  { id: 'organ', name: SIGNAL_LABELS.organ, blurb: 'Sustained: peak and loudness sit close — little dynamic range to trade.' },
];

type MeterKind = 'peak' | 'loudness';
const METER_KINDS: readonly { key: MeterKind; label: string; short: string; blurb: string }[] = [
  { key: 'peak', label: 'Peak programme meter', short: 'PEAK', blurb: 'Sample peak per channel with an OVER lamp — one instant at a time, and a crest-factor line underneath.' },
  { key: 'loudness', label: 'Loudness meter (BS.1770-style)', short: 'LUFS', blurb: 'Momentary, short-term and INTEGRATED loudness, plus loudness range — how loud the piece is, not how high its peak is. No target line: the right number depends on content and destination.' },
];

/** The Visual Audio Analysis lab's own meter on the glass — the peak meter or
 *  the loudness meter, full width (the loudness face needs the room). The
 *  loudness meter is drawn WITHOUT its −14 target line (targetLufs null). */
function MetersStage({ width, height, signal, gainDb, kind }: { width: number; height: number; signal: SignalKey; gainDb: number; kind: MeterKind }) {
  const viz = requireVizMeters();
  const focused = useIsFocused();
  if (!viz) return <View style={{ width, height, justifyContent: 'center' }}><VizUnavailableCard /></View>;
  return <MetersStageInner viz={viz} width={width} height={height} signal={signal} gainDb={gainDb} focused={focused} kind={kind} />;
}
function MetersStageInner({ viz, width, height, signal, gainDb, focused, kind }: { viz: NonNullable<ReturnType<typeof requireVizMeters>>; width: number; height: number; signal: SignalKey; gainDb: number; focused: boolean; kind: MeterKind }) {
  const phase = viz.usePhaseClock(focused, 0.6);
  return (
    <View style={{ width, height }}>
      {kind === 'peak' ? (
        <viz.PeakMeterView width={width} height={height} signal={signal} gain={Math.pow(10, gainDb / 20)} phase={phase} />
      ) : (
        <viz.LoudnessView width={width} height={height} signal={signal} phase={phase} targetLufs={null} />
      )}
    </View>
  );
}

export function Mod6Loudness({ onAnswered }: ModuleProps) {
  const [signal, setSignal] = useState<SignalKey>('music');
  const [meterGain, setMeterGain] = useState(0);
  const [meterKind, setMeterKind] = useState<MeterKind>('peak');
  const [drive, setDrive] = useState(6);
  const [matched, setMatched] = useState(true);
  const [systemId, setSystemId] = useState('mains');
  const variants = useMemo<MasterVariant[]>(
    () => [
      { id: 'quiet', label: 'QUIETER', process: { driveDb: 0, ceilingDb: CEILING }, matchGroup: 'g' },
      { id: 'loud', label: 'LOUDER', process: { driveDb: drive, ceilingDb: CEILING }, matchGroup: 'g' },
    ],
    [drive],
  );
  const pb = useMasterPlayback(variants, matched);
  const shown = pb.active ?? pb.pending ?? 'loud';
  const m = pb.measured[shown];
  const q = pb.measured.quiet;
  const l = pb.measured.loud;
  const system = PLAYBACK_SYSTEMS.find((s) => s.id === systemId) ?? PLAYBACK_SYSTEMS[0];
  // The programme's third-octave-ish spectrum for the translation picture —
  // only once it has been rendered by a LISTEN page (never at mount).
  const spectrum = useMemo(() => {
    const p = programmeIfRendered();
    if (!p) return [] as { f: number; db: number }[];
    const { freqs, db } = powerSpectrumDb(p.l, 8192, Math.round(p.l.length / 3));
    const out: { f: number; db: number }[] = [];
    let ref = -Infinity;
    for (let f = 25; f <= 18000; f *= 1.19) {
      let acc = 0;
      let n = 0;
      for (let i = 0; i < freqs.length; i++) if (freqs[i] >= f / 1.09 && freqs[i] < f * 1.09) { acc += Math.pow(10, db[i] / 10); n++; }
      const v = n ? 10 * Math.log10(acc / n) : -90;
      out.push({ f, db: v });
      if (f > 150 && f < 3000 && v > ref) ref = v;
    }
    return out.map((o) => ({ f: o.f, db: o.db - ref - 3 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pb.status]);

  return (
    <ModuleSteps
      steps={[
        {
          key: 'numbers', title: 'The four numbers', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <MetersStage width={w} height={h} signal={signal} gainDb={meterGain} kind={meterKind} />,
            aspect: 360 / 230,
            size: 'L',
            badge: 'SYNTHESIZED TEACHING SIGNAL · MODEL meters (Visual Audio Analysis lab)',
            bezel: [
              { k: 'METER', v: meterKind === 'peak' ? 'PEAK' : 'LOUDNESS', flex: 1.1 },
              { k: 'SIGNAL', v: SIGNAL_LABELS[signal].toUpperCase(), flex: 1.5 },
              { k: 'GAIN', v: `${meterGain > 0 ? '+' : ''}${meterGain.toFixed(1)} dB`, tint: colors.amber },
            ],
            params: [
              faderParam({ id: 'gain', label: 'GAIN', value: meterGain, min: -12, max: 6, step: 0.5, format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`, onChange: setMeterGain, home: 0, level: true }),
              optionsParam({ id: 'meter', label: 'METER', value: meterKind, options: METER_KINDS.map((m) => ({ key: m.key, label: m.label, short: m.short, blurb: m.blurb })), onChange: setMeterKind }),
              flipFader({ id: 'sig', label: 'SIGNAL', items: METER_SIGNALS, selectedId: signal, onSelect: (id) => setSignal(id as SignalKey), name: (s) => s.name, blurb: (s) => s.blurb, title: 'TEACHING SIGNAL', sticky: true }),
            ],
            initialParam: 'gain',
          },
          well: (
            <>
              <Body>The Visual Audio Analysis lab's own meters on the glass: switch METER between the peak programme meter and the loudness meter, ride GAIN and watch which numbers move together and which do not, and change SIGNAL to see how the gap between peak and loudness depends on the material. The loudness meter here draws no target line on purpose.</Body>
              <Card>
                <Point title="Peak level (dBFS)">The highest sample. It tells you about one instant, not about how loud the piece is.</Point>
                <Point title="True peak (dBTP)">An estimate of the reconstructed waveform BETWEEN samples (oversampled). It can exceed the sample peak; converters and lossy encoders see it.</Point>
                <Point title="Integrated loudness (LUFS / LKFS)">A gated, frequency-weighted average of the whole programme — the ITU-R BS.1770 measurement the loudness world shares. One number for how loud the piece is.</Point>
                <Point title="Dynamic range">How far the peaks sit above the average (PLR, crest factor) and how much the loudness moves over time (loudness range). Limiting spends it.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'listen', title: 'Quieter and louder, matched', kind: 'LISTEN', layout: 'rack',
          rack: {
            render: (w, h) => (
              <WaveOverviewStage width={w} height={h} ov={m?.overview ?? null} grDb={m?.grDb} maxGrDb={m?.maxGrDb} ceilingDb={CEILING} label={variants.find((v) => v.id === shown)?.label ?? ''} matchDb={m?.matchDb} progress={pb.progress} playing={pb.active != null} />
            ),
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              ...measureBezel(m, CEILING),
              { k: 'MATCH', v: matched ? (m && m.matchDb ? `${m.matchDb.toFixed(1)} dB` : 'ON') : 'OFF', tint: matched ? colors.cyan : colors.textMuted },
            ],
            params: [
              faderParam({ id: 'drive', label: 'DRIVE', value: drive, min: 0, max: 14, step: 0.5, format: (v) => `+${v.toFixed(1)} dB into the limiter`, formatShort: (v) => `+${v.toFixed(1)} dB`, onChange: setDrive, home: 0, level: true }),
              { kind: 'toggle', id: 'match', label: 'MATCH LEVEL', value: matched, onToggle: () => setMatched((v) => !v) },
              { kind: 'action', id: 'a', label: '▶ QUIETER', onPress: () => pb.play('quiet') },
              { kind: 'action', id: 'b', label: '▶ LOUDER', onPress: () => pb.play('loud') },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: pb.stop, tint: colors.green },
            ],
            initialParam: 'drive',
          },
          well: (
            <>
              <VersionRow versions={variants} active={pb.active} pending={pb.pending} rendering={pb.status === 'rendering'} onPlay={pb.play} onStop={pb.stop} />
              <Body>DRIVE pushes the mix into a peak limiter whose ceiling is {CEILING} dBFS. QUIETER is the same limiter with no drive. With MATCH LEVEL on, both are played at the loudness of the quieter one: the louder render is attenuated by (quieter LUFS − louder LUFS), a BS.1770-style K-weighted estimate, so what remains is the dynamics. The gain-reduction strip shows where the limiter worked; TRUE PK shows what a sample-peak ceiling lets through between samples.</Body>
              {q && l ? (
                <Card tone="accent">
                  <SText style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 }}>
                    QUIETER <SText style={{ color: lufsTint(q.lufs) }}>{q.lufs.toFixed(1)} LUFS</SText>, PLR {q.plr.toFixed(1)} · LOUDER <SText style={{ color: lufsTint(l.lufs) }}>{l.lufs.toFixed(1)} LUFS</SText>, PLR {l.plr.toFixed(1)}, true peak {l.truePeakDb.toFixed(1)} dBTP, max GR {l.maxGrDb.toFixed(1)} dB.{matched ? ` Matched: LOUDER plays at ${l.matchDb.toFixed(1)} dB.` : ' Unmatched.'}
                  </SText>
                </Card>
              ) : null}
              <Card>
                <Point title="There is no fixed target in this lab">The correct loudness depends on the content and the destination. A dense rock mix and a solo piano piece do not share a number; destinations publish their requirements and change them. The lab shows you the trade; the spec sheet of the day gives you the number.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'normal', title: 'Normalization and translation', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>PLAYBACK LOUDNESS NORMALIZATION</SectionTitle>
              <Card>
                <Body>Many services and players turn every track to a similar playback loudness. That does not make careful mastering irrelevant: normalization is a playback gain. Aggressive processing still changes the dynamics and the sound, and a heavily limited master can end up played QUIETER than a dynamic one, having spent its transients for nothing.</Body>
              </Card>
              <SectionTitle>TRANSLATION CHECKS</SectionTitle>
              <Card>
                <Point title="Headphones, small speakers, a car, a phone">Each reveals something the room did not: a bass decision, a width decision, a vocal that disappears. They are translation CHECKS — observations to carry back to the accurate room, where the decision is made.</Point>
                <Point title="Not substitutes">None of them replaces an accurate monitoring room. A master "fixed" on earbuds is a master mixed for earbuds.</Point>
              </Card>
              <Body>The AES and ITU material on loudness treats measurement and normalization as part of production and distribution practice, not as a single universal target. That is the stance this lab takes too.</Body>
            </>
          ),
        },
        {
          key: 'translate', title: 'As heard elsewhere', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <TranslationStage width={w} height={h} system={system} programmeDb={spectrum} />,
            aspect: TRANSLATION_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'SYSTEM', v: system.name.toUpperCase().split(' (')[0], flex: 2 },
              { k: 'FOLD', v: system.mono ? 'MONO' : 'STEREO', tint: system.mono ? colors.orange : colors.green },
            ],
            params: [
              flipFader({ id: 'sys', label: 'SYSTEM', items: PLAYBACK_SYSTEMS, selectedId: systemId, onSelect: setSystemId, name: (s) => s.name, short: (s) => s.name.split(' ')[0].toUpperCase(), blurb: (s) => s.note, title: 'PLAYBACK SYSTEM', sticky: true }),
            ],
            initialParam: 'sys',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride SYSTEM. The dashed line is the programme's spectrum as mastered (measured from the render once a LISTEN page has produced it); the solid line is a MODEL of how a typical system of that kind presents it — bandwidth, a mid bump, a mono fold. Illustrative shapes, not measurements of any product.</Body>
              <Card tone="accent">
                <Point title={system.name}>{system.note}</Point>
              </Card>
              {!spectrum.length ? <Card><Body>Play a version on a LISTEN page first and the programme's own spectrum appears here.</Body></Card> : null}
            </>
          ),
        },
        {
          key: 'practice', title: 'Loudness decisions', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              {LOUDNESS_SCENARIOS.map((s) => (
                <ScenarioCard key={s.id} s={s} onAnswered={(ok) => onAnswered(s.id, ok)} />
              ))}
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Peak, true peak, integrated loudness, dynamic range: four different questions.</Body>
                <Body>• The right loudness depends on content and destination; verify the current spec.</Body>
                <Body>• Normalization is a playback gain. Limiting is a permanent decision about dynamics.</Body>
                <Body>• Translation checks inform; the room decides.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.loudness} />
            </>
          ),
        },
      ]}
    />
  );
}
