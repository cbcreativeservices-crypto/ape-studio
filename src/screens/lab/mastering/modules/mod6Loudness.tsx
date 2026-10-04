/**
 * Module 6 — Loudness, dynamics and translation. LEARN (rack: the four
 * numbers, on the Visual Audio Analysis lab's own meters — PEAK, TRUE PK
 * and LUFS all on the bezel, all moving with GAIN) → LISTEN (rack: quieter
 * vs louder master at matched level, limiter drive on the lane) → LEARN
 * (read: normalization, translation checks) → EXPLORE (rack: translation —
 * the master as heard on other systems) → PRACTICE → REVIEW.
 */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { colors, fonts } from '../../../../theme/tokens';
import { SText } from '../../stageScale';
import { requireVizMeters } from '../../meter/skiaGate';
import { SIGNAL_LABELS, db as linDb, peakOf, renderSignal, simulateLoudness, type SignalKey } from '../../meter/meterEngine';
import { VizUnavailableCard } from '../../foundations/bits';
import { powerSpectrumDb } from '../../../../features/ear/earDsp';
import { faderParam, flipFader, optionsParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, KeyTerms, PlaybackStatus, Point, ScenarioDeck, SectionTitle, levelTint, lufsTint, matchBezel, measureBezel, unmatchedWarning } from '../kit';
import { KEY_TERMS, LOUDNESS_SCENARIOS } from '../masteringContent';
import { PLAYBACK_SYSTEMS, TRANSLATION_ASPECT, TranslationStage, WAVE_ASPECT, WaveOverviewStage } from '../stages';
import { programmeIfRendered, useDrawProgramme, useMasterPlayback, type MasterVariant } from '../useMasterPlayback';
import { MODEL_BADGE, RENDER_BADGE, type ModuleProps } from './shared';

const CEILING = -1.0;
/** The LISTEN step's index in the steps below (pinned by test/perfDecisionsC_20261004). */
const LISTEN_STEP = 1;
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
 *  the loudness meter, full width (the loudness face needs the whole glass;
 *  at 390 wide two faces side by side would be unreadable, so the three
 *  numbers share the BEZEL instead). The loudness meter is drawn WITHOUT its
 *  −14 target line (targetLufs null) and WITH the lab's additive gain. */
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
        <viz.LoudnessView width={width} height={height} signal={signal} phase={phase} targetLufs={null} gainDb={gainDb} />
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
  // LISTEN_STEP: the index of the step below whose display plays `pb` —
  // landing there pre-renders quietly (perf decisions 2026-10-04).
  const pb = useMasterPlayback(variants, matched, LISTEN_STEP);
  const shown = pb.active ?? pb.pending ?? 'loud';
  const m = pb.measured[shown];
  const q = pb.measured.quiet;
  const l = pb.measured.loud;
  // A fader change keeps the last render on the glass until the next one,
  // so pb.measured can belong to an EARLIER setting; only a READY render is
  // this one. The volume warning used to quote that stale step (e.g. 0 dB
  // measured at DRIVE 0, then DRIVE 14 and MATCH off: a ~10 dB jump).
  const fresh = pb.status === 'ready';
  // The MEASURES (peak, LUFS, PLR) belong to the DRIVE they were rendered
  // at; only the match gains change with MATCH. After a DRIVE move the bezel
  // read the old drive's numbers beside the new fader, and after MATCH off
  // the glass still said "played at −x dB · matched" (toddler pass 2).
  const current = pb.current;
  const system = PLAYBACK_SYSTEMS.find((s) => s.id === systemId) ?? PLAYBACK_SYSTEMS[0];
  // The teaching signal's three numbers for the LEARN bezel — the same
  // simulations the meters draw, offset by GAIN, so PEAK, TRUE PK and LUFS
  // are read together and move together.
  const teach = useMemo(() => {
    const sim = simulateLoudness(signal);
    const peak = linDb(peakOf(renderSignal(signal)));
    return { peak, tp: sim.truePeakDbtp, lufs: sim.integratedLufs };
  }, [signal]);
  // The programme's third-octave-ish spectrum for the translation picture —
  // free if a LISTEN page already rendered it; DRAW MIX renders it on request
  // (no audio, no gate); never at mount.
  const [drawn, setDrawn] = useState(0);
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
  }, [pb.status, drawn]);
  const draw = useDrawProgramme(() => setDrawn((d) => d + 1));

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
              { k: 'PEAK', v: `${(teach.peak + meterGain).toFixed(1)}`, tint: levelTint(teach.peak + meterGain) },
              { k: 'TRUE PK', v: `${(teach.tp + meterGain).toFixed(1)}`, tint: levelTint(teach.tp + meterGain) },
              { k: 'LUFS', v: `${(teach.lufs + meterGain).toFixed(1)}`, tint: lufsTint(teach.lufs + meterGain) },
              { k: 'GAIN', v: `${meterGain > 0 ? '+' : ''}${meterGain.toFixed(1)} dB`, tint: colors.amber },
              { k: 'FACE', v: meterKind === 'peak' ? 'PEAK' : 'LUFS' },
            ],
            params: [
              faderParam({ id: 'gain', label: 'GAIN', value: meterGain, min: -12, max: 6, step: 0.5, format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`, onChange: setMeterGain, home: 0, level: true }),
              optionsParam({ id: 'meter', label: 'FACE', value: meterKind, options: METER_KINDS.map((k) => ({ key: k.key, label: k.label, short: k.short, blurb: k.blurb })), onChange: setMeterKind }),
              flipFader({ id: 'sig', label: 'SIGNAL', items: METER_SIGNALS, selectedId: signal, onSelect: (id) => setSignal(id as SignalKey), name: (s) => s.name, blurb: (s) => s.blurb, title: 'TEACHING SIGNAL', sticky: true }),
            ],
            initialParam: 'gain',
          },
          well: (
            <>
              <Body>The Visual Audio Analysis lab's own meters on the glass. Ride GAIN: PEAK, TRUE PK and LUFS on the bezel all move by the same amount — a gain change is the one thing that moves every number together — and the face moves with them. Switch FACE between the peak programme meter and the loudness meter; change SIGNAL to see how the GAP between peak and loudness depends on the material (that gap is what a limiter spends). The loudness meter here draws no target line on purpose.</Body>
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
              <WaveOverviewStage width={w} height={h} ov={m?.overview ?? null} grDb={m?.grDb} maxGrDb={m?.maxGrDb} ceilingDb={CEILING} label={variants.find((v) => v.id === shown)?.label ?? ''} matchDb={fresh ? m?.matchDb : undefined} progress={pb.progress} playing={pb.active != null} pending={pb.pending != null} preparing={pb.preparing} onTap={() => (pb.active || pb.pending ? pb.stop() : pb.play(shown))} />
            ),
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              ...measureBezel(current ? m : undefined, CEILING),
              matchBezel(matched, fresh ? l?.matchDb : undefined, 'LOUDER'),
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
              <PlaybackStatus versions={variants} active={pb.active} pending={pb.pending} rendering={pb.status === 'rendering'} matched={matched} matchDb={m?.matchDb} labels="▶ QUIETER or ▶ LOUDER" />
              <Body>DRIVE pushes the mix into a peak limiter whose ceiling is {CEILING} dBFS. QUIETER is the same limiter with no drive. With MATCH LEVEL on, both are played at the loudness of the quieter one: the louder render is attenuated by the difference between the two loudness estimates, in LU (1 LU = 1 dB), a BS.1770-style K-weighted estimate, so what remains is the dynamics. The gain-reduction strip shows where the limiter worked; TRUE PK shows what a sample-peak ceiling lets through between samples.</Body>
              <Card tone="warn">
                <Point title="Before you switch MATCH off">{unmatchedWarning(current ? q?.lufs : undefined, current ? l?.lufs : undefined, 'LOUDER')} Unmatched, nothing replays by itself after a DRIVE change — you press ▶ each time.</Point>
              </Card>
              {fresh && q && l ? (
                <Card tone="accent">
                  <SText style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 }}>
                    QUIETER <SText style={{ color: lufsTint(q.lufs) }}>{q.lufs.toFixed(1)} LUFS</SText>, PLR {q.plr.toFixed(1)} · LOUDER <SText style={{ color: lufsTint(l.lufs) }}>{l.lufs.toFixed(1)} LUFS</SText>, PLR {l.plr.toFixed(1)}, true peak {l.truePeakDb.toFixed(1)} dBTP, max GR {l.maxGrDb.toFixed(1)} dB.{matched ? ` Matched: LOUDER plays at ${l.matchDb.toFixed(1)} dB.` : ' Unmatched.'}
                  </SText>
                </Card>
              ) : null}
              <Card>
                <Point title="This lab's limiter, honestly">A miniature: a plain sample-peak clamp with no look-ahead, which is why TRUE PK can read over the ceiling. Real mastering limiters use look-ahead and true-peak detection (oversampling) — that is what holds a −1 dBTP ceiling in practice.</Point>
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
                <Body>Many services and players turn every track to a similar playback loudness. That does not make careful mastering irrelevant: normalization is a playback gain. Aggressive processing still changes the dynamics and the sound, and a heavily limited master can end up played at the same loudness as, or quieter than, a dynamic one, having spent its transients for nothing — and services differ on whether they turn quiet masters up.</Body>
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
              ...(!spectrum.length ? [{ kind: 'action' as const, id: 'draw', label: draw.drawing ? '… DRAWING' : '▶ DRAW MIX', onPress: draw.draw }] : []),
            ],
            initialParam: 'sys',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride SYSTEM. The dashed line is the programme's spectrum as mastered (measured from the render); the solid line is a MODEL of how a typical system of that kind presents it — bandwidth, a mid bump, a mono fold. On the main monitors the two coincide, so only the solid line is drawn. Illustrative shapes, not measurements of any product.</Body>
              <Card tone="accent">
                <Point title={system.name}>{system.note}</Point>
              </Card>
              {!spectrum.length ? <Card><Point title="Nothing drawn yet">Press ▶ DRAW MIX in the dock: the lab renders the client's mix once (no sound) and measures its spectrum for this picture. Playing a version on a LISTEN page does the same.</Point></Card> : null}
            </>
          ),
        },
        {
          key: 'practice', title: 'Loudness decisions', kind: 'PRACTICE', layout: 'read',
          body: <ScenarioDeck scenarios={LOUDNESS_SCENARIOS} onAnswered={onAnswered} />,
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
