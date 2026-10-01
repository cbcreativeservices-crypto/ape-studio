/**
 * Module 5 — The mastering workflow. LEARN (rack: the seven steps, one lit)
 * → PRACTICE (read: inspect the delivered mix — ready or revision?) →
 * LISTEN (rack: a considered change — gentle bus compression — against the
 * unprocessed mix at matched level) → PRACTICE → REVIEW.
 */
import { useMemo, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, FieldRows, KeyTerms, Point, ScenarioCard, SectionTitle, VersionRow, measureBezel } from '../kit';
import { INSPECTION_SHEET, KEY_TERMS, WORKFLOW_SCENARIOS } from '../masteringContent';
import { FLOW_ASPECT, WORKFLOW_STEPS, WAVE_ASPECT, WaveOverviewStage, WorkflowStage } from '../stages';
import { useMasterPlayback, type MasterVariant } from '../useMasterPlayback';
import { RENDER_BADGE, type ModuleProps } from './shared';

export function Mod5Workflow({ onAnswered }: ModuleProps) {
  const [step, setStep] = useState(0);
  const [tilt, setTilt] = useState(1.5);
  const [matched, setMatched] = useState(true);
  // The considered change: a broad tonal lean (the tilt EQ) — the move that
  // changes LEVEL as well as tone, which is exactly why the bypass must be
  // matched before it is judged.
  const variants = useMemo<MasterVariant[]>(
    () => [
      { id: 'mix', label: 'BYPASS', process: {}, matchGroup: 'g' },
      { id: 'eq', label: 'WITH EQ', process: { tiltDb: tilt }, matchGroup: 'g' },
    ],
    [tilt],
  );
  const pb = useMasterPlayback(variants, matched);
  const shown = pb.active ?? pb.pending ?? 'eq';
  const m = pb.measured[shown];
  const cur = WORKFLOW_STEPS[step];

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
              { k: 'STEP', v: `${step + 1} / ${WORKFLOW_STEPS.length}` },
              { k: 'NAME', v: cur.name.toUpperCase(), flex: 2.6 },
            ],
            params: [
              faderParam({ id: 'step', label: 'STEP', value: step, min: 0, max: WORKFLOW_STEPS.length - 1, step: 1, format: (v) => WORKFLOW_STEPS[Math.round(v)].name, formatShort: (v) => WORKFLOW_STEPS[Math.round(v)].short, onChange: (v) => setStep(Math.round(v)), home: 0 }),
            ],
            initialParam: 'step',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride STEP through a common mastering workflow. The order and the scope vary from project to project; the habits do not.</Body>
              <Card tone="accent">
                <Point title={`${step + 1} · ${cur.name}`}>{cur.detail}</Point>
              </Card>
              <Card>
                <Point title="1 · Receive and inspect">Format, version, sample rate, bit depth, channel layout, the mixer's notes, references, delivery requirements. Confirm the version before anything else.</Point>
                <Point title="2 · Listen before processing">The whole mix. Strengths, concerns; compare to the goals and references.</Point>
                <Point title="3 · Decide whether the mix is ready">What mastering can address versus what needs a revision — and say so now.</Point>
                <Point title="4 · Make considered changes">Process only when it serves the goal, and compare against the unprocessed mix at MATCHED playback level so "louder" is not mistaken for "better".</Point>
                <Point title="5 · Sequence and shape the release">Order, spacing, fades, consistency.</Point>
                <Point title="6 · Prepare deliverables">Requirements vary by destination; verify the current spec rather than assume one universal setting.</Point>
                <Point title="7 · Quality-check the exports">Reopen and audition: beginning and end, fades, channel count, file naming, metadata, requested technical limits.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'inspect', title: 'Inspect the delivery', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>A mix has arrived for the EP. Read the inspection sheet — the flags are what a careful first look turns up before a single note is heard.</Body>
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
              <WaveOverviewStage width={w} height={h} ov={m?.overview ?? null} label={variants.find((v) => v.id === shown)?.label ?? ''} matchDb={m?.matchDb} progress={pb.progress} playing={pb.active != null} />
            ),
            aspect: WAVE_ASPECT,
            size: 'L',
            badge: RENDER_BADGE,
            bezel: [
              ...measureBezel(m),
              { k: 'MATCH', v: matched ? (m && m.matchDb ? `${m.matchDb.toFixed(1)} dB` : 'ON') : 'OFF', tint: matched ? colors.cyan : colors.textMuted },
            ],
            params: [
              faderParam({ id: 'tilt', label: 'TILT', value: tilt, min: -4, max: 4, step: 0.5, format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB tilt`, formatShort: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`, onChange: setTilt, home: 0 }),
              { kind: 'toggle', id: 'match', label: 'MATCH LEVEL', value: matched, onToggle: () => setMatched((v) => !v) },
              { kind: 'action', id: 'a', label: '▶ BYPASS', onPress: () => pb.play('mix') },
              { kind: 'action', id: 'b', label: '▶ WITH EQ', onPress: () => pb.play('eq') },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: pb.stop, tint: colors.green },
            ],
            initialParam: 'tilt',
          },
          well: (
            <>
              <VersionRow versions={variants} active={pb.active} pending={pb.pending} rendering={pb.status === 'rendering'} onPlay={pb.play} onStop={pb.stop} />
              <Body>Set a TILT (a broad brighten or warm), then compare WITH EQ against BYPASS. A brightening shelf raises the loudness estimate as well as the tone; with MATCH LEVEL on, the louder of the two is turned down by the difference in LUFS so the tonal decision is the only thing you judge. A change you keep is one that still wins at matched level. If the control is on, the stage draws the sounding version; a moved fader re-renders and replays it.</Body>
              <Card>
                <Point title="The habit">Make the change for a reason you can name. Bypass. Match. Listen again. Keep it only if it serves the goal.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Workflow decisions', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              {WORKFLOW_SCENARIOS.map((s) => (
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
                <Body>• Inspect, listen, decide, change, sequence, deliver, check — in roughly that order, with the scope set by the project.</Body>
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
