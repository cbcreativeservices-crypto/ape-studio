/**
 * Module 8 — Putting it all together: the fictional "Night Signal" EP.
 * 1 review the brief and mix files (read) → 2 identify what mastering can
 * address (practice, per track) → 3 choose listening checks and tools
 * (multi-select with a key) → 4 sequence the tracks and plan the delivery
 * (rack: the running order on the glass with the three transitions zoomed,
 * GAP on the lane) → 5 the final QC checklist (read; completes the module).
 *
 * The ticked checks and QC lines are handed to the host (onProjectState) so
 * they persist under the guest rule and survive a remount.
 */
import { useMemo, useRef, useState } from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { faderParam, optionsParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, Checklist, FieldRows, KeyButton, KeyTerms, Point, ScenarioDeck, SectionTitle, levelTint, lufsTint } from '../kit';
import { KEY_TERMS, PROJECT_BRIEF, PROJECT_CHECKS, PROJECT_QC, PROJECT_SEQUENCES, PROJECT_TRACKS } from '../masteringContent';
import { XF_OVERLAP_SEC, layoutSequence, maxLoudnessStep, type SeqTrack } from '../masteringEngine';
import { SEQ_ASPECT, SequenceStage } from '../stages';
import type { ModuleProps } from './shared';

export function Mod8Project({ onAnswered, onQcComplete, savedChecks, savedQc, onProjectState }: ModuleProps & {
  onQcComplete: (complete: boolean) => void;
  savedChecks?: readonly string[];
  savedQc?: readonly string[];
  onProjectState?: (checks: string[], qc: string[]) => void;
}) {
  const [checks, setChecks] = useState<Set<string>>(() => new Set(savedChecks ?? []));
  const [revealed, setRevealed] = useState(false);
  const [seqId, setSeqId] = useState(PROJECT_SEQUENCES[0].id);
  const [gap, setGap] = useState(2);
  const [crossfade, setCrossfade] = useState(false);
  const [qc, setQc] = useState<Set<string>>(() => new Set(savedQc ?? []));
  const seq = PROJECT_SEQUENCES.find((s) => s.id === seqId) ?? PROJECT_SEQUENCES[0];
  const tracks = useMemo<SeqTrack[]>(
    () => seq.order.map((id) => {
      const t = PROJECT_TRACKS.find((x) => x.id === id)!;
      return { id: t.id, title: t.title, seconds: t.seconds, lufs: t.lufsEstimate, fadeOutSec: t.id === 'p2' ? 12 : 5 };
    }),
    [seq],
  );
  const laid = useMemo(() => layoutSequence(tracks, gap, crossfade), [tracks, gap, crossfade]);
  const step = maxLoudnessStep(tracks);
  // The latest lists live in refs and the host is told OUTSIDE the state
  // updaters: an updater can be re-run by React (and a queued one runs during
  // this component's render), so the host setState + store write inside it
  // fired during render / twice, and a fast double-tap reported a stale list
  // (bug pass 2026-10-01).
  const checksRef = useRef(checks);
  const qcRef = useRef(qc);
  const toggleCheck = (id: string) => {
    const n = new Set(checksRef.current);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    checksRef.current = n;
    setChecks(n);
    onProjectState?.([...n], [...qcRef.current]);
  };
  const toggleQc = (id: string) => {
    const n = new Set(qcRef.current);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    qcRef.current = n;
    setQc(n);
    onQcComplete(n.size === PROJECT_QC.length);
    onProjectState?.([...checksRef.current], [...n]);
  };
  const checkScore = PROJECT_CHECKS.filter((c) => checks.has(c.id) === c.needed).length;

  return (
    <ModuleSteps
      steps={[
        {
          key: 'brief', title: 'The brief and the mix files', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <Card tone="accent">
                <Point title={`${PROJECT_BRIEF.title} — ${PROJECT_BRIEF.artist}`}>{PROJECT_BRIEF.from}</Point>
                {PROJECT_BRIEF.lines.map((l) => <Body key={l}>“{l}”</Body>)}
              </Card>
              <SectionTitle>THE MIX FILES, AS INSPECTED</SectionTitle>
              <FieldRows rows={PROJECT_TRACKS.map((t) => ({ field: t.title, value: `${Math.floor(t.seconds / 60)}:${String(t.seconds % 60).padStart(2, '0')} · ${t.note}` }))} />
              <Card>
                {PROJECT_TRACKS.map((t) => (
                  <Text key={t.id} style={{ color: colors.textSecondary, fontFamily: fonts.mono, fontSize: 12 }}>
                    {t.title.padEnd(14)} <Text style={{ color: lufsTint(t.lufsEstimate) }}>{t.lufsEstimate.toFixed(1)} LUFS</Text>  <Text style={{ color: levelTint(t.truePeakDb) }}>{t.truePeakDb.toFixed(1)} dBTP</Text>
                  </Text>
                ))}
                <Body>Numbers from the inspection pass: integrated loudness estimates and true peaks of the mixes as delivered (tinted against 0 dBTP). 24-bit / 48 kHz WAV, stereo, all four.</Body>
              </Card>
            </>
          ),
        },
        {
          key: 'problems', title: 'What can mastering address?', kind: 'PRACTICE', layout: 'read',
          body: (
            <ScenarioDeck scenarios={PROJECT_TRACKS.map((t) => t.issue)} keepOrder onAnswered={onAnswered} intro="One question per track. Decide whether the next step is a mastering adjustment, a mix revision, or more information from the client." />
          ),
        },
        {
          key: 'checks', title: 'Listening checks and tools', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>Tick the checks and tools this EP needs. Then reveal the key: the point is the reasoning, not the score.</Body>
              <Checklist items={PROJECT_CHECKS} chosen={checks} onToggle={toggleCheck} reveal={revealed} />
              <Card tone="accent">
                <Point title={revealed ? `${checkScore} of ${PROJECT_CHECKS.length} match the key` : 'Ready?'}>
                  {revealed ? 'Read the lines that differ — each explains the decision the EP needed.' : 'Tap REVEAL THE KEY when your list is complete.'}
                </Point>
                {!revealed ? <KeyButton label="REVEAL THE KEY ›" onPress={() => setRevealed(true)} tint={colors.green} /> : null}
              </Card>
            </>
          ),
        },
        {
          key: 'sequence', title: 'Sequence and delivery plan', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <SequenceStage width={w} height={h} blocks={laid.blocks} totalSec={laid.totalSec} maxStepLu={step} crossfade={crossfade} gapSec={gap} />,
            aspect: SEQ_ASPECT,
            size: 'L',
            badge: 'PLAN · fictional EP, loudness estimates',
            bezel: [
              { k: 'ORDER', v: seq.short, flex: 1.8 },
              { k: 'GAP', v: crossfade ? 'XF' : `${gap.toFixed(1)} s`, tint: crossfade ? colors.cyan : colors.amber },
              { k: 'MAX STEP', v: `${step.toFixed(1)} LU`, tint: step > 6 ? colors.amber : colors.green },
              { k: 'TOTAL', v: `${Math.floor(laid.totalSec / 60)}:${String(Math.round(laid.totalSec % 60)).padStart(2, '0')}` },
            ],
            params: [
              faderParam({ id: 'gap', label: 'GAP', value: gap, min: 0, max: 6, step: 0.5, format: (v) => (crossfade ? `crossfade on — ${XF_OVERLAP_SEC} s overlap, gap 0` : `${v.toFixed(1)} s between tracks`), formatShort: (v) => (crossfade ? 'XF' : `${v.toFixed(1)} s`), onChange: setGap, home: 2 }),
              optionsParam({ id: 'order', label: 'ORDER', value: seqId, options: PROJECT_SEQUENCES.map((s) => ({ key: s.id, label: s.label, short: s.short, blurb: s.why })), onChange: setSeqId }),
              { kind: 'toggle', id: 'xf', label: 'CROSSFADE', value: crossfade, onToggle: () => setCrossfade((v) => !v) },
            ],
            initialParam: 'gap',
          },
          well: (
            <>
              <Body>Choose an ORDER, ride GAP, try CROSSFADE. The top strip is the running order on a real time base: block length is the track length, block height and colour are its loudness, the wedge is its fade-out. The lower strip zooms the three transitions to ±15 s so the gap, the fade wedge and a crossfade overlap are all visible and all move with the fader; with CROSSFADE on the gap is 0 and the next track starts inside the fade. The largest loudness step between neighbours is the number sequencing watches (steps over 6 LU flagged) — here the quiet song makes a step the client asked for, so the gap around it is a decision, not an accident.</Body>
              <Card tone="accent">
                <Point title={seq.label}>{seq.why}</Point>
              </Card>
              <SectionTitle>THE DELIVERY PLAN</SectionTitle>
              <Card>
                <Point title="Digital distribution first">Confirm the distributor's current file spec and the services' current loudness / true-peak guidance; deliver masters plus the instrumentals, named to the agreed convention, with ISRCs and titles. No dither on the 24-bit deliverables.</Point>
                <Point title="CD a month later">Red Book: sample-rate conversion 48 → 44.1 kHz first, dither to 16-bit as the very last step; the plant's accepted master format (often a DDP image — confirm); an ISRC per track and the UPC/EAN; CD-Text if wanted; the approved gaps and order.</Point>
                <Point title={'Vinyl "maybe"'}>Ask the cutting engineer before promising anything: side lengths, whether a less limited pre-master is preferred, bass centring, and which song sits at the inner groove.</Point>
                <Point title="Document it">A delivery note with what was sent where, and the measured numbers.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'qc', title: 'Final QC checklist', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>The exports are rendered. Work the checklist on the files themselves — every line ticked, with the four track decisions on step 2 answered, completes the module. Your ticks are kept.</Body>
              <Checklist items={PROJECT_QC} chosen={qc} onToggle={toggleQc} />
              <Card tone={qc.size === PROJECT_QC.length ? 'accent' : 'plain'}>
                <Point title={qc.size === PROJECT_QC.length ? 'Delivered' : `${qc.size} of ${PROJECT_QC.length}`}>
                  {qc.size === PROJECT_QC.length ? 'Every file reopened, measured, named and documented. That is a mastering job finished.' : 'QC happens on the files you send, not on the session that made them.'}
                </Point>
              </Card>
              <KeyTerms terms={KEY_TERMS.project} />
            </>
          ),
        },
      ]}
    />
  );
}
