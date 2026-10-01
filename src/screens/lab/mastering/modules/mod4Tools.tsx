/**
 * Module 4 — Mastering equipment and tools, grouped by the decisions they
 * help make. LEARN (read: the groups) → EXPLORE (rack: the tool shelf —
 * every group draws its own display and AMOUNT changes the picture) → LEARN
 * (read: analog and digital) → PRACTICE (choose a tool for the job) → REVIEW.
 */
import { useMemo, useState } from 'react';
import { faderParam, flipFader } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, KeyTerms, Point, ScenarioCard, SectionTitle } from '../kit';
import { KEY_TERMS, TOOL_GROUPS, TOOL_SCENARIOS } from '../masteringContent';
import { overview } from '../masteringEngine';
import { TOOL_ASPECT, ToolStage, dynamicsLawDb, widthCorrelation, type ToolView } from '../stages';
import { programmeIfRendered } from '../useMasterPlayback';
import { MODEL_BADGE, type ModuleProps } from './shared';

const TOOL_SHORT: Record<ToolView, string> = {
  playback: 'EDITING', monitor: 'MONITORS', eq: 'EQ', dyn: 'DYNAMICS', stereo: 'STEREO', meters: 'METERS', analog: 'ANALOG',
};
const AMOUNT_LABEL: Record<ToolView, string> = {
  playback: 'FADE', monitor: 'LEVEL', eq: 'TILT', dyn: 'RATIO', stereo: 'WIDTH', meters: 'LEVEL', analog: 'COLOUR',
};

function amountText(view: ToolView, a: number): string {
  switch (view) {
    case 'eq': return `${(a * 3) > 0 ? '+' : ''}${(a * 3).toFixed(1)} dB tilt`;
    case 'analog': return `${(a * 3) > 0 ? '+' : ''}${(a * 3).toFixed(1)} dB colour`;
    case 'dyn': return `${(1 + Math.max(0, a) * 19).toFixed(1)} : 1`;
    case 'stereo': return `×${(Math.max(0, a) * 2).toFixed(2)} width`;
    case 'meters': return `${(-12 + Math.max(0, a) * 12).toFixed(1)} dBFS peak`;
    case 'monitor': return `${Math.round(70 + Math.max(0, a) * 20)} dB SPL`;
    default: return `${(Math.max(0, a) * 4).toFixed(1)} s fade`;
  }
}

export function Mod4Tools({ onAnswered }: ModuleProps) {
  const [view, setView] = useState<ToolView>('eq');
  const [amount, setAmount] = useState(0.5);
  // The programme's picture, only once a LISTEN page has rendered it — a
  // tool shelf must never pay for a 10 s render at mount.
  const ov = useMemo(() => {
    const p = programmeIfRendered();
    return p ? overview(p, 120) : null;
  }, []);
  const group = TOOL_GROUPS.find((g) => g.id === view) ?? TOOL_GROUPS[2];
  // Bipolar amounts for the EQ views; 0..1 for the rest.
  const bipolar = view === 'eq' || view === 'analog';
  const a = bipolar ? amount : Math.max(0, amount);
  const readout = view === 'dyn' ? `${dynamicsLawDb(0, -12, 1 + Math.max(0, a) * 19).toFixed(1)} dB out at 0 in` : view === 'stereo' ? `corr ${widthCorrelation(Math.max(0, a) * 2).toFixed(2)}` : view === 'meters' ? `${(-24 + Math.max(0, a) * 12).toFixed(1)} LUFS` : view === 'eq' || view === 'analog' ? (a > 0 ? 'brighter' : a < 0 ? 'warmer' : 'flat') : amountText(view, a);

  return (
    <ModuleSteps
      steps={[
        {
          key: 'groups', title: 'Tools by the decision they serve', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <Body>There is no required chain. Order and equipment vary by engineer, by room and by project; what stays constant is the set of DECISIONS a mastering session makes. Group the tools by those.</Body>
              {TOOL_GROUPS.map((g) => (
                <Card key={g.id}>
                  <Point title={`${g.title} — ${g.decision}`}>{g.items.join(' · ')}</Point>
                </Card>
              ))}
            </>
          ),
        },
        {
          key: 'shelf', title: 'The tool shelf', kind: 'EXPLORE', layout: 'rack',
          rack: {
            render: (w, h) => <ToolStage width={w} height={h} view={view} amount={a} ov={ov} />,
            aspect: TOOL_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'TOOL', v: TOOL_SHORT[view], flex: 1.1 },
              { k: AMOUNT_LABEL[view], v: amountText(view, a), flex: 1.3 },
              { k: 'READS', v: readout, flex: 1.4 },
            ],
            params: [
              faderParam({ id: 'amount', label: AMOUNT_LABEL[view], value: amount, min: bipolar ? -1 : 0, max: 1, step: 0.01, format: (v) => amountText(view, v), onChange: setAmount, home: bipolar ? 0 : undefined }),
              flipFader({ id: 'tool', label: 'TOOL', items: TOOL_GROUPS, selectedId: view, onSelect: (id) => { setView(id as ToolView); setAmount(id === 'eq' || id === 'analog' ? 0.5 : 0.5); }, name: (g) => g.title, short: (g) => g.title.split(' ')[0].toUpperCase(), blurb: (g) => g.decision, title: 'TOOL GROUP', sticky: true }),
            ],
            initialParam: 'amount',
          },
          well: (
            <>
              <Body>Pick a TOOL group, then ride {AMOUNT_LABEL[view]}: every group draws the display a mastering engineer actually looks at for that decision, and the control changes the picture. The groups are a shelf, not a chain.</Body>
              <Card tone="accent">
                <Point title={group.title}>{group.decision}. {group.items.join(' · ')}.</Point>
              </Card>
              <Card>
                <Point title="EQ">Broad tonal shaping (shelves, tilt) and problem correction (narrow). Compared at matched level — a shelf changes loudness as well as tone.</Point>
                <Point title="Dynamics">Compression for density and shape, limiting for a peak ceiling, other dynamics tools where a goal asks for them.</Point>
                <Point title="Stereo / spatial">Width or channel balance — always with a mono-compatibility check, because width that only lives in the sides vanishes in a fold.</Point>
                <Point title="Meters and analysis">Peak and true-peak, loudness (the BS.1770 family), phase correlation, spectrum. They verify a decision made by listening; they do not make it.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'analog', title: 'Analog and digital', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <SectionTitle>ANALOG EQUIPMENT (OPTIONAL)</SectionTitle>
              <Card>
                <Point title="What it is">Optional EQs, compressors, converters and routing in the analog domain, inserted around the digital session.</Point>
                <Point title="What it is not">A requirement, or a mark of quality. Excellent masters are made entirely in the box and entirely out of it.</Point>
                <Point title="How to compare honestly">The same way as everything else: the same goal, matched level, a bypass, a second system. Neither analog nor digital is superior; they are different tools with different conveniences — recall, precision, workflow, colour.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'practice', title: 'Choose a tool for the job', kind: 'PRACTICE', layout: 'read',
          body: (
            <>
              <Body>A listening goal → which tool, or which next CHECK, might help. The feedback emphasises listening and verification; there are no preset answers in a real session either.</Body>
              {TOOL_SCENARIOS.map((s) => (
                <ScenarioCard key={s.id} s={s} keepOrder onAnswered={(ok) => onAnswered(s.id, ok)} />
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
                <Body>• Tools are grouped by decision: playback/editing, monitoring, EQ, dynamics, stereo, meters, optional analog.</Body>
                <Body>• No required chain. Choose by the goal; confirm by listening at matched level; verify with a meter.</Body>
                <Body>• Width is never touched without a mono check.</Body>
              </Card>
              <KeyTerms terms={KEY_TERMS.tools} />
            </>
          ),
        },
      ]}
    />
  );
}
