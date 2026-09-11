/**
 * Audio Connectors & Cable Selection Lab — pages 5–8.
 * P5 Station 2: identification bench — digital, data & MIDI.
 * P6 Station 3: same connector, different job (the matrix — the lab's
 *    most important interactive section).
 * P7 Station 3: declare before you connect (signal must be chosen before
 *    the app will call anything compatible).
 * P8 Station 4: what is inside the cable.
 */
import { useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row, useStableShuffle } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { ConnectorPhoto, GoalChips, LessonCard, StationTag, useVisitGoals } from './bits';
import { BenchCard } from './pagesA';
import { CrossSectionView } from './art';
import { BENCH_GROUPS } from './data/roster';
import { JOB_MATRIX, MATRIX_RULE, type JobMatrixEntry } from './data/jobs';
import { AES_VS_MIC, CROSS_SECTIONS, INSTRUMENT_VS_SPEAKER } from './data/practice';
import type { ConnectorId } from '../cable/cableTypes';

/* ── page 5: digital bench ───────────────────────────────────────────────── */

function PageBenchDigital({ ctx }: { ctx: PageCtx }) {
  const group = BENCH_GROUPS[2];
  const [open, setOpen] = useState<ReadonlySet<ConnectorId>>(new Set());
  const toggle = (id: ConnectorId) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const goals = [
    { label: 'Open four cards', hit: [...open].length >= 4 },
    { label: 'Open the MIDI card', hit: open.has('midi_din5') },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 2 · IDENTIFICATION BENCH — DIGITAL, DATA & MIDI</StationTag>
      <Lead>{group.blurb}</Lead>
      {group.ids.map((id) => (
        <BenchCard key={id} id={id} open={open.has(id)} onToggle={() => toggle(id)} />
      ))}
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 6: the jobs matrix ─────────────────────────────────────────────── */

function JobQuiz({ entry, onSolved }: { entry: JobMatrixEntry; onSolved: () => void }) {
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set());
  const [checked, setChecked] = useState(false);
  // Shuffled presentation (cognition pass: with authored order the impostor
  // was always the last row and the whole matrix solved by pattern).
  const { shuffled: jobs } = useStableShuffle(entry.jobs, entry.connector);
  const toggle = (id: string) => {
    if (checked) return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const allRight = entry.jobs.every((j) => (j.can ? marked.has(j.id) : !marked.has(j.id)));
  const check = () => {
    setChecked(true);
    if (allRight) {
      onSolved();
      AccessibilityInfo.announceForAccessibility?.('Correct. Every job matched.');
    } else {
      AccessibilityInfo.announceForAccessibility?.('Some marks are wrong — the marked-wrong rows are highlighted. Adjust and check again.');
    }
  };
  return (
    <View style={{ gap: 8 }}>
      <Prompt>{entry.headline}</Prompt>
      <Body>Mark every job this connector family CAN do. Leave the impostors unmarked, then check.</Body>
      {jobs.map((j) => {
        const on = marked.has(j.id);
        const verdict = checked ? (j.can === on ? 'right' : 'wrong') : null;
        return (
          <View key={j.id} style={{ gap: 3 }}>
            <Btn
              label={`${on ? '☑' : '☐'} ${j.label}`}
              tone={verdict === 'wrong' ? 'danger' : on ? 'primary' : 'plain'}
              selected={on}
              onPress={() => toggle(j.id)}
              a11y={`${j.label}: ${on ? 'marked as a real job' : 'unmarked'}${checked ? (verdict === 'right' ? ', judged correct' : ', judged wrong') : ''}`}
            />
            {/* Explanations appear only on a fully-correct set — a failed
                check highlights WHICH marks are wrong but withholds each
                row's direction, so try-again is real retrieval, not
                copying (design + cognition passes). */}
            {checked && allRight ? (
              <Text style={[styles.jobNote, { color: colors.green }]}>
                {j.can ? '✓ REAL JOB — ' : '✕ NOT A JOB — '}
                {j.explain}
              </Text>
            ) : null}
          </View>
        );
      })}
      {!checked ? (
        <Btn label="CHECK MY MARKS" tone="primary" onPress={check} a11y="Check the marked jobs" />
      ) : allRight ? (
        <Text style={[styles.jobNote, { color: colors.green }]}>✓ Every job matched — this family is yours.</Text>
      ) : (
        <Btn label="TRY AGAIN" onPress={() => setChecked(false)} a11y="Clear the judgment and try again" />
      )}
    </View>
  );
}

function PageJobsMatrix({ ctx }: { ctx: PageCtx }) {
  const [active, setActive] = useState<ConnectorId>(JOB_MATRIX[0].connector);
  const [solved, setSolved] = useState<ReadonlySet<ConnectorId>>(new Set());
  const entry = JOB_MATRIX.find((e) => e.connector === active)!;
  const goals = [{ label: 'Match all jobs on 3 connector families', hit: solved.size >= 3 }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 3 · SAME CONNECTOR, DIFFERENT JOB</StationTag>
      <Lead>This is the heart of the lab. Pick a connector, then decide which jobs it genuinely does — and which it only looks like it does.</Lead>
      <Card tone="note">
        <Body>{MATRIX_RULE}</Body>
      </Card>
      <Text style={styles.swipeCue}>{JOB_MATRIX.length} FAMILIES — SWIPE →</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.chipScroll}>
        {JOB_MATRIX.map((e) => (
          <Btn
            key={e.connector}
            label={`${solved.has(e.connector) ? '✓ ' : ''}${e.title}`}
            tone={active === e.connector ? 'primary' : 'plain'}
            selected={active === e.connector}
            onPress={() => setActive(e.connector)}
            a11y={`${e.title}${solved.has(e.connector) ? ', solved' : ''}`}
          />
        ))}
      </ScrollView>
      <Card>
        <ConnectorPhoto id={entry.connector} size={72} />
        <JobQuiz key={entry.connector} entry={entry} onSolved={() => setSolved((prev) => new Set(prev).add(entry.connector))} />
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 7: declare before you connect ──────────────────────────────────── */

type Declare = {
  id: string;
  setup: string;
  image: ConnectorId;
  /** Spoken name for the photo (assistive tech). */
  imageName: string;
  signalQ: string;
  signals: string[];
  correctSignal: number;
  cableQ: string;
  cables: string[];
  correctCable: number;
  verdict: string;
};

const DECLARES: readonly Declare[] = [
  {
    id: 'aes_wall',
    setup: 'A wall panel jack labeled “AES OUT” — a female XLR, identical to every mic jack in the building — must reach a processor’s AES input.',
    image: 'xlr3',
    imageName: 'XLR connector',
    signalQ: 'What signal does this equipment expect the connection to carry?',
    signals: ['AES3 digital audio', 'Analog microphone signal', 'Speaker-level audio'],
    correctSignal: 0,
    cableQ: 'And so the cable must be…',
    cables: ['110-ohm AES/digital XLR cable', 'Ordinary analog microphone cable', 'Heavy speaker cable with XLR ends'],
    correctCable: 0,
    verdict: 'COMPATIBLE — because you declared the signal first. The label said AES3; the cable is built for it. An analog mic cable in this run might work on a short patch and drop out on a long one.',
  },
  {
    id: 'coax_digital',
    setup: 'A CD player’s jack labeled “COAXIAL DIGITAL OUT” — an RCA, identical to its analog jacks — must reach a DAC.',
    image: 'rca',
    imageName: 'RCA connector',
    signalQ: 'What does this jack put on the cable?',
    signals: ['S/PDIF digital audio', 'Unbalanced analog line audio', 'Phono-level audio'],
    correctSignal: 0,
    cableQ: 'And so the cable must be…',
    cables: ['A true 75-ohm coaxial cable', 'Any RCA interconnect that fits', 'A shielded twisted-pair cable'],
    correctCable: 0,
    verdict: 'COMPATIBLE — S/PDIF is specified for 75-ohm cable. The analog interconnect FITS the same jack; on longer or marginal runs it drops out, and nothing on the plug warns you.',
  },
  {
    id: 'insert_jack',
    setup: 'A console jack labeled “CH 5 INSERT” — a 1/4-inch TRS, identical to the line inputs beside it — and a compressor that should process channel 5.',
    image: 'trs_quarter',
    imageName: 'quarter-inch TRS connector',
    signalQ: 'What does this jack actually do?',
    signals: ['Send AND return on one jack', 'Balanced mono line input', 'Stereo headphone output'],
    correctSignal: 0,
    cableQ: 'And so the cable must be…',
    cables: ['An insert cable: TRS to two plugs', 'One ordinary TRS line cable', 'A stereo headphone extension'],
    correctCable: 0,
    verdict: 'COMPATIBLE — the insert cable splits send and return to the processor. A balanced source or plain line cable patched into an insert lands on a send/return pair instead of an input: the channel goes silent or routes wrongly. Which contact sends is equipment-defined: verify in the manual.',
  },
];

function DeclareCard({ d, onSolved }: { d: Declare; onSolved: () => void }) {
  const [sig, setSig] = useState<number | null>(null); // ORIGINAL indices
  const [cab, setCab] = useState<number | null>(null);
  // Both option sets are shuffled — authored correct-first order made every
  // declaration solvable by "tap the top option" (cognition pass).
  const sigShuffle = useStableShuffle(d.signals, `${d.id}-sig`);
  const cabShuffle = useStableShuffle(d.cables, `${d.id}-cab`);
  const sigRight = sig === d.correctSignal;
  const cabRight = cab === d.correctCable;
  const done = sigRight && cabRight;
  return (
    <Card>
      <ConnectorPhoto id={d.image} size={64} single name={d.imageName} />
      <Body>{d.setup}</Body>
      <Prompt>{d.signalQ}</Prompt>
      <Row>
        {sigShuffle.shuffled.map((s, di) => {
          const i = sigShuffle.order[di];
          return (
            <Btn key={s} label={s} tone={sig === i ? (i === d.correctSignal ? 'primary' : 'danger') : 'plain'} selected={sig === i} onPress={() => {
              setSig(i);
              if (i !== d.correctSignal) AccessibilityInfo.announceForAccessibility?.('Not the declared signal — the panel label is the answer. Read it again.');
            }} a11y={s} />
          );
        })}
      </Row>
      {sig != null && !sigRight ? <Text style={styles.declareWrong}>The panel LABEL is the answer — read it again.</Text> : null}
      {sigRight ? (
        <View style={{ gap: 6 }}>
          <Prompt>{d.cableQ}</Prompt>
          <Row>
            {cabShuffle.shuffled.map((c, di) => {
              const i = cabShuffle.order[di];
              return (
                <Btn key={c} label={c} tone={cab === i ? (i === d.correctCable ? 'primary' : 'danger') : 'plain'} selected={cab === i} onPress={() => {
                  setCab(i);
                  if (i === d.correctCable) {
                    onSolved();
                    AccessibilityInfo.announceForAccessibility?.(d.verdict);
                  } else {
                    AccessibilityInfo.announceForAccessibility?.('Not that cable — the construction must match the signal you just declared.');
                  }
                }} a11y={c} />
              );
            })}
          </Row>
          {cab != null && !cabRight ? <Text style={styles.declareWrong}>The construction must match the signal you just declared.</Text> : null}
        </View>
      ) : (
        <Text style={styles.declareGate}>The app will not judge compatibility until you declare the signal. That is the point.</Text>
      )}
      {done ? <Text style={styles.declareVerdict}>✓ {d.verdict}</Text> : null}
    </Card>
  );
}

function PageDeclare({ ctx }: { ctx: PageCtx }) {
  const [solved, setSolved] = useState<ReadonlySet<string>>(new Set());
  const goals = [{ label: 'Declare and solve all 3 connections', hit: solved.size >= DECLARES.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 3 · DECLARE BEFORE YOU CONNECT</StationTag>
      <Lead>A professional names the signal BEFORE plugging. Each connection below stays unjudged until you declare what the equipment expects — then the cable choice gets its verdict.</Lead>
      {DECLARES.map((d) => (
        <DeclareCard key={d.id} d={d} onSolved={() => setSolved((prev) => new Set(prev).add(d.id))} />
      ))}
      <LessonCard />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 8: inside the cable ────────────────────────────────────────────── */

function PageInside({ ctx }: { ctx: PageCtx }) {
  const [active, setActive] = useState(CROSS_SECTIONS[0].id);
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set([CROSS_SECTIONS[0].id]));
  const [checkOk, setCheckOk] = useState(false);
  const section = CROSS_SECTIONS.find((s) => s.id === active)!;
  const goals = [
    { label: 'View all 8 constructions', hit: seen.size >= CROSS_SECTIONS.length },
    { label: 'Pass the check', hit: checkOk },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 4 · WHAT IS INSIDE THE CABLE</StationTag>
      <Lead>The jacket hides the part that actually decides whether a connection works. Cut eight cables open and compare.</Lead>
      <Text style={styles.swipeCue}>{CROSS_SECTIONS.length} CONSTRUCTIONS — SWIPE →</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.chipScroll}>
        {CROSS_SECTIONS.map((s) => (
          <Btn key={s.id} label={seen.has(s.id) ? `✓ ${s.name}` : s.name} tone={active === s.id ? 'primary' : 'plain'} selected={active === s.id} onPress={() => { setActive(s.id); setSeen((prev) => new Set(prev).add(s.id)); }} a11y={s.name} />
        ))}
      </ScrollView>
      <Card>
        <View style={{ alignItems: 'center' }} accessible accessibilityRole="image" accessibilityLabel={`Cross-section diagram: ${section.name}. Layers from outside in: ${section.layers.join(', ')}.`}>
          <CrossSectionView kind={section.id} />
        </View>
        <Prompt>{section.name}</Prompt>
        <Body>{section.blurb}</Body>
        <View style={styles.layerRow}>
          {section.layers.map((l, i) => (
            <Text key={l} style={styles.layer}>{i + 1}. {l}</Text>
          ))}
        </View>
        <Text style={styles.jobLine}>BUILT FOR: {section.job}</Text>
      </Card>
      <Card tone="warn">
        <Eyebrow>THE REQUIRED COMPARISON</Eyebrow>
        <Body>{INSTRUMENT_VS_SPEAKER}</Body>
      </Card>
      <Card tone="note">
        <Body>{AES_VS_MIC}</Body>
      </Card>
      <UnderstandingCheck
        question="Two cables on the bench both wear 1/4-inch TS plugs. What reliably tells the instrument cable from the speaker cable?"
        options={[
          'The jacket printing and the construction inside',
          'A continuity test across both ends',
          'The color of the plug barrels',
          'Whichever one is thicker is the speaker cable',
        ]}
        correct={0}
        explain="Only the declared construction can be trusted: read the jacket, and when in doubt look at what is inside. The plug is identical on both."
        wrong={[
          undefined,
          'Both cables PASS a continuity test identically — the tester is blind to gauge and shielding.',
          'Barrel finish is cosmetic; nothing about the plug differs.',
          'Thickness is a hint, not an identification — heavy instrument cables and slim speaker cables both exist.',
        ]}
        onCorrect={() => setCheckOk(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const CONNECTOR_PAGES_B: PageDef[] = [
  { title: 'The bench: digital & MIDI', short: 'Bench 3', Component: PageBenchDigital, manualDone: true },
  { title: 'Same connector, different job', short: 'The matrix', Component: PageJobsMatrix, manualDone: true },
  { title: 'Declare before you connect', short: 'Declare', Component: PageDeclare, manualDone: true },
  { title: 'Inside the cable', short: 'Cross-sections', Component: PageInside, manualDone: true },
];

const styles = StyleSheet.create({
  chipScroll: { flexDirection: 'row', gap: 8, paddingVertical: 2, paddingRight: 12 },
  swipeCue: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  jobNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, paddingHorizontal: 4 },
  declareWrong: { color: colors.red, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  declareGate: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  declareVerdict: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18 },
  layerRow: { gap: 2 },
  layer: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5 },
  jobLine: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1 },
});
