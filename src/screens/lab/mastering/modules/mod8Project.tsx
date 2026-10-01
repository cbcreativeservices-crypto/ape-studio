/**
 * Module 8 — Putting it all together: the fictional "Night Signal" EP.
 * 1 review the brief and mix files (read) → 2 identify what mastering can
 * address (practice, per track) → 3 choose listening checks and tools
 * (multi-select with a key) → 4 sequence the tracks and plan the delivery
 * (rack: the running order on the glass, GAP on the lane) → 5 the final QC
 * checklist (read; completes the module).
 */
import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { faderParam, optionsParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, Checklist, FieldRows, KeyTerms, Point, ScenarioCard, SectionTitle, levelTint, lufsTint } from '../kit';
import { KEY_TERMS, PROJECT_BRIEF, PROJECT_CHECKS, PROJECT_QC, PROJECT_SEQUENCES, PROJECT_TRACKS } from '../masteringContent';
import { layoutSequence, maxLoudnessStep, type SeqTrack } from '../masteringEngine';
import { SEQ_ASPECT, SequenceStage } from '../stages';
import type { ModuleProps } from './shared';

export function Mod8Project({ onAnswered, onQcComplete }: ModuleProps & { onQcComplete: (complete: boolean) => void }) {
  const [checks, setChecks] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [seqId, setSeqId] = useState(PROJECT_SEQUENCES[0].id);
  const [gap, setGap] = useState(2);
  const [crossfade, setCrossfade] = useState(false);
  const [qc, setQc] = useState<Set<string>>(new Set());
  const seq = PROJECT_SEQUENCES.find((s) => s.id === seqId) ?? PROJECT_SEQUENCES[0];
  const tracks = useMemo<SeqTrack[]>(
    () => seq.order.map((id) => {
      const t = PROJECT_TRACKS.find((x) => x.id === id)!;
      return { id: t.id, title: t.title, seconds: t.seconds, lufs: t.lufsEstimate, fadeOutSec: t.id === 'p2' ? 12 : 5 };
    }),
    [seq],
  );
  const laid = useMemo(() => layoutSequence(tracks, gap), [tracks, gap]);
  const step = maxLoudnessStep(tracks);
  const toggleCheck = (id: string) => setChecks((c) => { const n = new Set(c); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleQc = (id: string) => setQc((c) => {
    const n = new Set(c);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onQcComplete(n.size === PROJECT_QC.length);
    return n;
  });
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
                    {t.title.padEnd(14)} <Text style={{ color: lufsTint(t.lufsEstimate) }}>{t.lufsEstimate.toFixed(1)} LUFS</Text>  <Text style={{ color: levelTint(t.truePeakDb, -1) }}>{t.truePeakDb.toFixed(1)} dBTP</Text>
                  </Text>
                ))}
                <Body>Numbers from the inspection pass: integrated loudness estimates and true peaks of the mixes as delivered. 24-bit / 48 kHz WAV, stereo, all four.</Body>
              </Card>
            </>
          ),
        },
        {
          key: 'problems', title: 'What can mastering address?', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>One question per track. Decide whether the next step is a mastering adjustment, a mix revision, or more information from the client.</Body>
              {PROJECT_TRACKS.map((t) => (
                <ScenarioCard key={t.id} s={t.issue} keepOrder onAnswered={(ok) => onAnswered(t.issue.id, ok)} />
              ))}
            </>
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
                {!revealed ? (
                  <Text onPress={() => setRevealed(true)} style={{ color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.2, paddingVertical: 10 }} accessibilityRole="button" accessibilityLabel="Reveal the key">
                    REVEAL THE KEY ›
                  </Text>
                ) : null}
              </Card>
            </>
          ),
        },
        {
          key: 'sequence', title: 'Sequence and delivery plan', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <SequenceStage width={w} height={h} blocks={laid.blocks} totalSec={laid.totalSec} maxStepLu={step} crossfade={crossfade} />,
            aspect: SEQ_ASPECT,
            badge: 'PLAN · fictional EP, loudness estimates',
            bezel: [
              { k: 'ORDER', v: seq.label.toUpperCase(), flex: 2.2 },
              { k: 'GAP', v: `${gap.toFixed(1)} s` },
              { k: 'MAX STEP', v: `${step.toFixed(1)} LU`, tint: step > 6 ? colors.amber : colors.green },
              { k: 'TOTAL', v: `${Math.floor(laid.totalSec / 60)}:${String(Math.round(laid.totalSec % 60)).padStart(2, '0')}` },
            ],
            params: [
              faderParam({ id: 'gap', label: 'GAP', value: gap, min: 0, max: 6, step: 0.5, format: (v) => `${v.toFixed(1)} s between tracks`, formatShort: (v) => `${v.toFixed(1)} s`, onChange: setGap, home: 2 }),
              optionsParam({ id: 'order', label: 'ORDER', value: seqId, options: PROJECT_SEQUENCES.map((s) => ({ key: s.id, label: s.label, short: s.label.split(' ')[0].toUpperCase(), blurb: s.why })), onChange: setSeqId }),
              { kind: 'toggle', id: 'xf', label: 'CROSSFADE', value: crossfade, onToggle: () => setCrossfade((v) => !v) },
            ],
            initialParam: 'gap',
          },
          well: (
            <>
              <Body>Choose an ORDER, ride GAP, try CROSSFADE. The glass draws the running order on a real time base: block length is the track length, block height and colour are its loudness, the wedge is its fade-out. The largest loudness step between neighbours is the number sequencing watches — here the quiet song makes a step the client asked for, so the gap around it is a decision, not an accident.</Body>
              <Card tone="accent">
                <Point title={seq.label}>{seq.why}</Point>
              </Card>
              <SectionTitle>THE DELIVERY PLAN</SectionTitle>
              <Card>
                <Point title="Digital distribution first">Confirm the distributor's current file spec and the services' current loudness / true-peak guidance; deliver masters plus the instrumentals, named to the agreed convention, with ISRCs and titles.</Point>
                <Point title="CD a month later">Red Book: 16-bit / 44.1 kHz with dither at the final conversion; the plant's accepted master format (often a DDP image — confirm); CD-Text if wanted; the approved gaps and order.</Point>
                <Point title={'Vinyl "maybe"'}>Ask the cutting engineer before promising anything: side lengths, whether a less limited pre-master is preferred, bass centring.</Point>
                <Point title="Document it">A delivery note with what was sent where, and the measured numbers.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'qc', title: 'Final QC checklist', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>The exports are rendered. Work the checklist on the files themselves — every line ticked completes the module.</Body>
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
