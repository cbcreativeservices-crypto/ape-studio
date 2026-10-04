/**
 * Module 5 — The mastering workflow. LEARN (rack: the seven steps, one lit)
 * → PRACTICE (read: inspect the delivered mix — ready or revision?) →
 * LISTEN (rack: a considered change — a TILT EQ plus the +2 dB output trim
 * a "better" setting usually sneaks in — against the unprocessed mix at
 * matched level) → PRACTICE → REVIEW.
 */
import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { faderParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, FieldRows, KeyTerms, PlaybackStatus, Point, ScenarioDeck, SectionTitle, lufsTint, matchBezel, measureBezel, unmatchedWarning } from '../kit';
import { INSPECTION_SHEET, KEY_TERMS, WORKFLOW_SCENARIOS } from '../masteringContent';
import { FLOW_ASPECT, WORKFLOW_STEPS, WAVE_ASPECT, WaveOverviewStage, WorkflowStage } from '../stages';
import { SAFETY_CEILING_DB, useMasterPlayback, type MasterVariant } from '../useMasterPlayback';
import { RENDER_BADGE, type ModuleProps } from './shared';

/** The output trim that rides along with the EQ: the way a change usually
 *  arrives louder. Peak-safe through the lab's safety ceiling. */
const EQ_TRIM_DB = 2;
/** The LISTEN step's index in the steps below (pinned by test/perfDecisionsC_20261004). */
const LISTEN_STEP = 2;

export function Mod5Workflow({ onAnswered }: ModuleProps) {
  const [step, setStep] = useState(0);
  const [tilt, setTilt] = useState(1.5);
  const [matched, setMatched] = useState(true);
  // The considered change: a broad tonal lean (the tilt EQ) plus a +2 dB
  // trim. The tilt moves the loudness estimate up or down depending on
  // where the programme's energy sits; the trim makes sure the "better"
  // version arrives louder — which is exactly why the bypass must be
  // matched before it is judged.
  const variants = useMemo<MasterVariant[]>(
    () => [
      { id: 'mix', label: 'BYPASS', process: {}, matchGroup: 'g' },
      { id: 'eq', label: 'WITH EQ', process: { tiltDb: tilt, trimDb: EQ_TRIM_DB }, matchGroup: 'g' },
    ],
    [tilt],
  );
  // LISTEN_STEP: the index of the step below whose display plays `pb` —
  // landing there pre-renders quietly (perf decisions 2026-10-04).
  const pb = useMasterPlayback(variants, matched, LISTEN_STEP);
  const shown = pb.active ?? pb.pending ?? 'eq';
  const m = pb.measured[shown];
  const mix = pb.measured.mix;
  const eq = pb.measured.eq;
  // A fader change keeps the last render on the glass until the next one,
  // so pb.measured can belong to an EARLIER setting; only a READY render is
  // this one. The volume warning used to quote the step measured for the
  // previous TILT after the fader had moved on.
  const fresh = pb.status === 'ready';
  // The MEASURES belong to the TILT they were rendered at; only the match
  // gains change with MATCH (toddler pass 2: the bezel read the old tilt's
  // numbers beside the new fader; the glass said "matched" after MATCH off).
  const current = pb.current;
  const cur = WORKFLOW_STEPS[step];
  const fmtTilt = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB end to end (±${(Math.abs(v) / 2).toFixed(1)})`;

  return (
    <ModuleSteps
      steps={[
        {
          key: 'flow', title: 'A common workflow', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <WorkflowStage width={w} height={h} index={step} />,
            aspect: FLOW_ASPECT,
            badge: 'DIAGRAM · order and scope vary',
            bezel: [
              { k: 'FLOW', v: `${step + 1} / ${WORKFLOW_STEPS.length}` },
              { k: 'NAME', v: cur.name.toUpperCase(), flex: 2.6 },
            ],
            params: [
              faderParam({ id: 'flow', label: 'FLOW', value: step, min: 0, max: WORKFLOW_STEPS.length - 1, step: 1, format: (v) => WORKFLOW_STEPS[Math.round(v)].name, formatShort: (v) => WORKFLOW_STEPS[Math.round(v)].short, onChange: (v) => setStep(Math.round(v)), home: 0 }),
            ],
            initialParam: 'flow',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride FLOW through a common mastering workflow. The order and the scope vary from project to project; the habits do not. The glass carries each stage's detail.</Body>
              <Card tone="accent">
                <Point title={`${step + 1} · ${cur.name}`}>{cur.detail}</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'inspect', title: 'Inspect the delivery', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>A mix has arrived for the EP. Read the inspection sheet — the flags are what a careful first look turns up before a single note is heard at level.</Body>
              <FieldRows rows={INSPECTION_SHEET} />
              <Card>
                <Point title="Decide">Is this mix ready to master? Three questions back to the client — the version, the bus limiter and the CD deliverable — cost less than a master of the wrong file.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'listen', title: 'A considered change, matched', kind: 'LISTEN', layout: 'rack',
          rack: {
            render: (w, h) => (
              <WaveOverviewStage width={w} height={h} ov={m?.overview ?? null} grDb={m?.grDb} maxGrDb={m?.maxGrDb} ceilingDb={shown === 'eq' ? SAFETY_CEILING_DB : null} label={variants.find((v) => v.id === shown)?.label ?? ''} matchDb={fresh ? m?.matchDb : undefined} progress={pb.progress} playing={pb.active != null} pending={pb.pending != null} preparing={pb.preparing} onTap={() => (pb.active || pb.pending ? pb.stop() : pb.play(shown))} />
            ),
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              ...measureBezel(current ? m : undefined),
              matchBezel(matched, fresh ? eq?.matchDb : undefined, 'WITH EQ'),
            ],
            params: [
              faderParam({ id: 'tilt', label: 'TILT', value: tilt, min: -4, max: 4, step: 0.5, format: fmtTilt, formatShort: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`, onChange: setTilt, home: 0 }),
              { kind: 'toggle', id: 'match', label: 'MATCH LEVEL', value: matched, onToggle: () => setMatched((v) => !v) },
              { kind: 'action', id: 'a', label: '▶ BYPASS', onPress: () => pb.play('mix') },
              { kind: 'action', id: 'b', label: '▶ WITH EQ', onPress: () => pb.play('eq') },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: pb.stop, tint: colors.green },
            ],
            initialParam: 'tilt',
          },
          well: (
            <>
              <PlaybackStatus versions={variants} active={pb.active} pending={pb.pending} rendering={pb.status === 'rendering'} matched={matched} matchDb={m?.matchDb} labels="▶ BYPASS or ▶ WITH EQ" loud="WITH EQ" />
              <Body>Set a TILT (a broad brighten or warm; "+4 dB end to end" is ±2 dB at the extremes), then compare WITH EQ against BYPASS. WITH EQ also carries a +{EQ_TRIM_DB} dB output trim, the way a "better" setting usually sneaks in louder (peak-safe: the lab's ceiling at {SAFETY_CEILING_DB} dBFS holds it). A tilt changes the loudness estimate as well as the tone — up or down depending on where the programme's energy sits — so watch which way the LUFS cell moves; with MATCH LEVEL on, whichever version reads louder is turned down by the difference between the two loudness estimates, in LU (1 LU = 1 dB), and the tonal decision is the only thing you judge. A change you keep is one that still wins at matched level. With MATCH on, a moved fader re-renders and replays the sounding version.</Body>
              {fresh && mix && eq ? (
                <Card tone="accent">
                  <Text style={{ color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 }}>
                    Measured: BYPASS <Text style={{ color: lufsTint(mix.lufs) }}>{mix.lufs.toFixed(1)} LUFS</Text> · WITH EQ <Text style={{ color: lufsTint(eq.lufs) }}>{eq.lufs.toFixed(1)} LUFS</Text> ({eq.lufs - mix.lufs >= 0 ? '+' : ''}{(eq.lufs - mix.lufs).toFixed(1)} LU).
                    {matched ? ` Matched: ${eq.matchDb < 0 ? `WITH EQ is played at ${eq.matchDb.toFixed(1)} dB` : mix.matchDb < 0 ? `BYPASS is played at ${mix.matchDb.toFixed(1)} dB` : 'both play as rendered'} so both sit at ${Math.min(mix.lufs, eq.lufs).toFixed(1)} LUFS.` : ' Unmatched: the louder one will read better simply because it is louder.'}
                  </Text>
                </Card>
              ) : null}
              <Card tone="warn">
                <Point title="Before you switch MATCH off">{unmatchedWarning(current ? mix?.lufs : undefined, current ? eq?.lufs : undefined, 'WITH EQ', '2–3')} Unmatched, nothing replays by itself after a change — you press ▶ each time.</Point>
              </Card>
              <Card>
                <Point title="The habit">Make the change for a reason you can name. Bypass. Match. Listen again. Keep it only if it serves the goal.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Workflow decisions', kind: 'PRACTICE', layout: 'read',
          body: <ScenarioDeck scenarios={WORKFLOW_SCENARIOS} onAnswered={onAnswered} />,
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Inspect (peak meter and DC-offset check before monitoring at level), listen, decide, change, sequence, deliver, check — in roughly that order, with the scope set by the project.</Body>
                <Body>• Every processing decision is a bypass comparison at matched level.</Body>
                <Body>• Deliverables follow the destination's CURRENT spec; QC is on the files you send.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.workflow} />
            </>
          ),
        },
      ]}
    />
  );
}
