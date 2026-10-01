/**
 * Module 4 — Mastering equipment and tools, grouped by the decisions they
 * help make. LEARN (read: the groups) → EXPLORE (rack: the tool shelf —
 * every group draws its own display and AMOUNT changes the picture) → LEARN
 * (read: analog and digital) → PRACTICE (choose a tool for the job) → REVIEW.
 */
import { useState } from 'react';
import { faderParam, flipFader } from '../MasteringRack';
import { ModuleSteps } from '../steps';
import { Body, Card, KeyTerms, Point, ScenarioDeck, SectionTitle } from '../kit';
import { KEY_TERMS, TOOL_GROUPS, TOOL_SCENARIOS } from '../masteringContent';
import { overview, type Overview } from '../masteringEngine';
import { TOOL_ASPECT, ToolStage, dynamicsLawDb, widthCorrelation, type ToolView } from '../stages';
import { programme, programmeIfRendered } from '../useMasterPlayback';
import { MODEL_BADGE, type ModuleProps } from './shared';

/** ONE short-name table for the key, the bezel and the tray (cognitive
 *  review 2026-10-01, finding 14). */
const TOOL_SHORT: Record<ToolView, string> = {
  playback: 'EDITING', monitor: 'MONITORS', eq: 'EQ', dyn: 'DYNAMICS', stereo: 'STEREO', meters: 'METERS', analog: 'ANALOG',
};
const AMOUNT_LABEL: Record<ToolView, string> = {
  playback: 'FADE', monitor: 'LEVEL', eq: 'TILT', dyn: 'RATIO', stereo: 'WIDTH', meters: 'LEVEL', analog: 'COLOUR',
};

/** The AMOUNT readout. A tilt is ± the same number at the two ends. */
function amountText(view: ToolView, a: number): string {
  switch (view) {
    case 'eq': return `±${Math.abs(a * 3).toFixed(1)} dB ${a > 0 ? 'brighter' : a < 0 ? 'warmer' : 'flat'}`;
    case 'analog': return `±${Math.abs(a * 3).toFixed(1)} dB ${a > 0 ? 'brighter' : a < 0 ? 'warmer' : 'flat'}`;
    case 'dyn': return `${(1 + Math.max(0, a) * 19).toFixed(1)} : 1`;
    case 'stereo': return `×${(Math.max(0, a) * 2).toFixed(2)}`;
    case 'meters': return `${(-12 + Math.max(0, a) * 12).toFixed(1)} dBFS pk`;
    case 'monitor': return `${Math.round(70 + Math.max(0, a) * 20)} dB SPL (C)`;
    default: return `${(Math.max(0, a) * 4).toFixed(1)} s`;
  }
}

/** A second readout only where it adds a number the AMOUNT cell lacks. */
function secondReadout(view: ToolView, a: number): { k: string; v: string } | null {
  switch (view) {
    case 'dyn': return { k: 'OUT AT 0 IN', v: `${dynamicsLawDb(0, -12, 1 + Math.max(0, a) * 19).toFixed(1)} dB` };
    case 'stereo': return { k: 'CORRELATION', v: widthCorrelation(Math.max(0, a) * 2).toFixed(2) };
    case 'meters': return { k: 'LUFS', v: `${(-24 + Math.max(0, a) * 12).toFixed(1)}` };
    default: return null;
  }
}

export function Mod4Tools({ onAnswered }: ModuleProps) {
  const [view, setView] = useState<ToolView>('eq');
  const [amount, setAmount] = useState(0.5);
  // The programme's picture: free if a LISTEN page already rendered it;
  // otherwise DRAW MIX renders it on request (no audio, no gate) — a tool
  // shelf must never pay for a 10 s render at mount.
  const [ov, setOv] = useState<Overview | null>(() => {
    const p = programmeIfRendered();
    return p ? overview(p, 120) : null;
  });
  const drawMix = () => setOv(overview(programme(), 120));
  const group = TOOL_GROUPS.find((g) => g.id === view) ?? TOOL_GROUPS[2];
  // Bipolar amounts for the EQ views; 0..1 for the rest.
  const bipolar = view === 'eq' || view === 'analog';
  const a = bipolar ? amount : Math.max(0, amount);
  const second = secondReadout(view, a);
  const needsProgramme = (view === 'playback' || view === 'meters') && !ov;

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
              { k: AMOUNT_LABEL[view], v: amountText(view, a), flex: 1.5 },
              ...(second ? [{ k: second.k, v: second.v, flex: 1.2 }] : []),
            ],
            params: [
              faderParam({ id: 'amount', label: AMOUNT_LABEL[view], value: amount, min: bipolar ? -1 : 0, max: 1, step: 0.01, format: (v) => amountText(view, v), onChange: setAmount, home: bipolar ? 0 : undefined }),
              flipFader({ id: 'tool', label: 'TOOL', items: TOOL_GROUPS, selectedId: view, onSelect: (id) => { setView(id as ToolView); setAmount(0.5); }, name: (g) => g.title, short: (g) => TOOL_SHORT[g.id as ToolView] ?? g.title.split(' ')[0].toUpperCase(), blurb: (g) => g.decision, title: 'TOOL GROUP', sticky: true }),
              ...(needsProgramme ? [{ kind: 'action' as const, id: 'draw', label: '▶ DRAW MIX', onPress: drawMix }] : []),
            ],
            initialParam: 'amount',
          },
          well: (
            <>
              <Body>Pick a TOOL group, then ride {AMOUNT_LABEL[view]}: every group draws the display a mastering engineer actually looks at for that decision, and the control changes the picture. The groups are a shelf, not a chain.</Body>
              {needsProgramme ? (
                <Card tone="accent">
                  <Point title="This view draws the programme">Press ▶ DRAW MIX in the dock: the lab renders the client's mix once (no sound, nothing plays) and the EDITING and METERS views fill in.</Point>
                </Card>
              ) : null}
              <Card tone="accent">
                <Point title={group.title}>{group.decision}. {group.items.join(' · ')}.</Point>
              </Card>
              <Card>
                <Point title="EQ">Broad tonal shaping (shelves, tilt) and problem correction (narrow). Compared at matched level — a shelf changes loudness as well as tone.</Point>
                <Point title="Dynamics">Compression for density and shape, limiting for a peak ceiling, other dynamics tools where a goal asks for them. The curve on the glass is static — attack, release and knee are not shown.</Point>
                <Point title="Stereo / spatial">Width or channel balance — always with a mono-compatibility check, because width that only lives in the sides vanishes in a fold.</Point>
                <Point title="Meters and analysis">Peak and true-peak, loudness (the BS.1770 family), phase correlation, spectrum. They verify a decision made by listening; they do not make it. The TP bar here is a model (+0.6 over the sample peak); real material runs 0.3–1 dB over.</Point>
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
            <ScenarioDeck scenarios={TOOL_SCENARIOS} keepOrder compact onAnswered={onAnswered} intro="A listening goal → which tool, or which next CHECK, might help. The feedback emphasises listening and verification; there are no preset answers in a real session either." />
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
