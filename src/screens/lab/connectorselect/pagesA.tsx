/**
 * Audio Connectors & Cable Selection Lab — pages 1–4.
 * P1 Station 1: connector, cable and signal are different things.
 * P2 Station 1: the same-plug comparison (TRS balanced mono vs stereo).
 * P3 Station 2: identification bench — analog (+ all-family search).
 * P4 Station 2: identification bench — loudspeaker connections.
 *
 * ALL COPY NEW (copy sheet docs/APE_CONNECTOR_SELECT_COPY_2026_09_11.md).
 * Connector facts render from the VERIFIED ConnectorRecords only.
 */
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { Body, Btn, Card, Eyebrow, Lead, Prompt } from '../tuning/components/primitives';
import { UnderstandingCheck } from '../tuning/components/check';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { getConnector } from '../cable/data/registry';
import type { ConnectorId, ConnectorRecord } from '../cable/cableTypes';
import { CARRIED_LABELS } from './labels';
import { ConceptList, ConnectorPhoto, GoalChips, LessonCard, StationTag, useVisitGoals } from './bits';
import { ExplodedCable } from './art';
import { BENCH_GROUPS, CABLE_PARTS, CARD_FLAGS, FOUR_QUESTIONS, ROSTER } from './data/roster';

/* ── shared bench card (used by pages 3–5) ───────────────────────────────── */

function factLine(label: string, value: string) {
  return (
    <View style={styles.factRow} key={label}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

export function BenchCard({ id, open, onToggle }: { id: ConnectorId; open: boolean; onToggle: () => void }) {
  const rec = getConnector(id);
  if (!rec) return null;
  const flag = CARD_FLAGS[id];
  const contacts = rec.pinouts[0]?.contacts ?? [];
  return (
    <Card>
      <Btn label={open ? `✓ ${rec.displayName}` : rec.displayName} tone={open ? 'primary' : 'plain'} selected={open} onPress={onToggle} a11y={`${rec.displayName}${open ? ', open' : ', tap to open the card'}`} />
      {open ? (
        <View style={{ gap: 8 }}>
          {flag ? (
            <View style={styles.flagBox}>
              <Text style={styles.flagText}>{flag}</Text>
            </View>
          ) : null}
          <ConnectorPhoto id={id} />
          {rec.aliases.length ? factLine('ALSO CALLED', rec.aliases.slice(0, 3).join(' · ')) : null}
          {factLine('CONTACTS', contacts.length ? `${contacts.length}: ${contacts.map((c) => c.label).join(', ')}` : 'See card views')}
          {factLine('MAY CARRY', rec.carried.map((c) => CARRIED_LABELS[c]).join(' · '))}
          {factLine('TYPICALLY FROM', rec.typicalSources.slice(0, 3).join(' · '))}
          {factLine('TYPICALLY INTO', rec.typicalDestinations.slice(0, 3).join(' · '))}
          {factLine('RETENTION', rec.locking.method === 'none' || rec.locking.method === 'friction' ? 'Friction only — no lock' : `Locks: ${rec.locking.method.replace('_', '-')}`)}
          {rec.constructionNote ? factLine('CABLE BEHIND IT', rec.constructionNote) : null}
          <View style={styles.mistakeBox}>
            <Text style={styles.mistakeEyebrow}>MOST COMMON MISTAKE</Text>
            <Text style={styles.mistakeText}>{rec.commonMistakes[0]}</Text>
          </View>
          {rec.safety.cautions.length ? (
            <View style={styles.cautionBox}>
              <Text style={styles.cautionEyebrow}>SAFETY</Text>
              <Text style={styles.cautionText}>{rec.safety.cautions[0]}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

/** One bench page's state + goal wiring. */
function useBench(ctx: PageCtx, ids: readonly ConnectorId[], requiredOpens: number, extraGoals: { label: string; hit: boolean }[] = []) {
  const [open, setOpen] = useState<ReadonlySet<ConnectorId>>(new Set());
  const toggleId = (id: ConnectorId) => setOpen((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const openedCount = ids.filter((id) => open.has(id)).length;
  const goals = [{ label: `Open ${requiredOpens} connector cards`, hit: openedCount >= requiredOpens }, ...extraGoals];
  const latched = useVisitGoals(ctx, goals);
  return { open, toggleId, goals, latched };
}

/** All-family search (page 3): filters the entire roster by name/alias.
 *  Open-state is OWNED BY THE PAGE (design pass: a card opened through
 *  search must count toward the page goal and stay in sync with the same
 *  card in the bench list below — two disconnected copies contradicted
 *  each other). Results render as siblings, not nested Card-in-Card. */
function BenchSearch({ open, onToggle }: { open: ReadonlySet<ConnectorId>; onToggle: (id: ConnectorId) => void }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [] as ConnectorRecord[];
    return ROSTER.map((id) => getConnector(id)!).filter(
      (r) => r.displayName.toLowerCase().includes(q) || r.aliases.some((a) => a.toLowerCase().includes(q)),
    );
  }, [query]);
  useEffect(() => {
    if (query.trim().length >= 2) {
      AccessibilityInfo.announceForAccessibility?.(matches.length ? `${matches.length} connector${matches.length === 1 ? '' : 's'} match.` : 'No connector matches.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches.length]);
  return (
    <View style={{ gap: 10 }}>
      <Card>
        <Eyebrow>FIND A CONNECTOR — ALL FAMILIES</Eyebrow>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Type a name or nickname (e.g. aux, phono, headset)…"
          placeholderTextColor={colors.textMuted}
          style={styles.search}
          accessibilityLabel="Search every connector family by name or nickname"
        />
        {query.trim().length >= 2 && !matches.length ? <Body>No connector matches “{query.trim()}” — try another name or nickname.</Body> : null}
      </Card>
      {matches.map((r) => (
        <BenchCard key={r.id} id={r.id} open={open.has(r.id)} onToggle={() => onToggle(r.id)} />
      ))}
    </View>
  );
}

/* ── page 1 ──────────────────────────────────────────────────────────────── */

function PageThreeThings({ ctx }: { ctx: PageCtx }) {
  const [part, setPart] = useState<string | null>(null);
  const [seenParts, setSeenParts] = useState<ReadonlySet<string>>(new Set());
  const [seenQs, setSeenQs] = useState<ReadonlySet<string>>(new Set());
  const selectPart = (id: string) => {
    setPart(id);
    setSeenParts((prev) => new Set(prev).add(id));
  };
  const goals = [
    { label: 'Tap all 8 cable parts', hit: seenParts.size >= CABLE_PARTS.length },
    { label: 'Open all 4 questions', hit: seenQs.size >= FOUR_QUESTIONS.length },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 1 · CONNECTOR, CABLE AND SIGNAL</StationTag>
      <Lead>Three different things live in your hand when you hold a cable: the CONNECTOR you can see, the CABLE construction you mostly can’t, and the SIGNAL that isn’t in either until the equipment puts it there.</Lead>
      <LessonCard />
      <Card>
        <Eyebrow>THE EXPLODED CABLE — TAP A ZONE OR A PART BELOW</Eyebrow>
        <ExplodedCable selected={part} onSelect={selectPart} />
        <ConceptList
          items={CABLE_PARTS.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb }))}
          opened={seenParts}
          onOpen={selectPart}
        />
      </Card>
      <Card tone="note">
        <Eyebrow>ASK THESE FOUR QUESTIONS — EVERY TIME, FOREVER</Eyebrow>
        <ConceptList
          items={FOUR_QUESTIONS.map((f) => ({ id: f.q, name: f.q, blurb: f.why }))}
          opened={seenQs}
          onOpen={(id) => setSeenQs((prev) => new Set(prev).add(id))}
        />
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── page 2 ──────────────────────────────────────────────────────────────── */

function PageSamePlug({ ctx }: { ctx: PageCtx }) {
  const rec = getConnector('trs_quarter')!;
  const balanced = rec.pinouts.find((p) => p.id === 'balanced_mono')!;
  const stereo = rec.pinouts.find((p) => p.id === 'unbalanced_stereo')!;
  const [mode, setMode] = useState<'balanced' | 'stereo'>('balanced');
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set(['balanced']));
  const [checkOk, setCheckOk] = useState(false);
  const active = mode === 'balanced' ? balanced : stereo;
  const goals = [
    { label: 'View both jobs', hit: seen.size >= 2 },
    { label: 'Pass the check', hit: checkOk },
  ];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 1 · THE SAME PLUG, TWO JOBS</StationTag>
      <Lead>Here is the whole lab in one plug. Two 1/4-inch TRS cables, identical to the eye — one carries a balanced MONO line signal, the other carries unbalanced STEREO headphones.</Lead>
      <Card>
        <ConnectorPhoto id="trs_quarter" />
        <View style={styles.toggleRow}>
          <Btn label="BALANCED MONO" tone={mode === 'balanced' ? 'primary' : 'plain'} selected={mode === 'balanced'} onPress={() => { setMode('balanced'); setSeen((p) => new Set(p).add('balanced')); }} a11y="Show the balanced mono job" />
          <Btn label="STEREO PHONES" tone={mode === 'stereo' ? 'primary' : 'plain'} selected={mode === 'stereo'} onPress={() => { setMode('stereo'); setSeen((p) => new Set(p).add('stereo')); }} a11y="Show the stereo headphone job" />
        </View>
        <Prompt>{active.application}</Prompt>
        {active.contacts.map((c) => (
          <View key={c.label} style={styles.factRow}>
            <Text style={styles.factLabel}>{c.label.toUpperCase()}</Text>
            <Text style={styles.factValue}>{c.role}{c.note ? ` — ${c.note}` : ''}</Text>
          </View>
        ))}
      </Card>
      <Body>Same tip, same ring, same sleeve — different ASSIGNMENT. TRS does not mean stereo, and it does not mean balanced. It means three contacts; the equipment decides the rest.</Body>
      <UnderstandingCheck
        question="A 1/4-inch TRS jack sits on a rear panel. What tells you whether it is balanced mono, stereo, or an insert point?"
        options={[
          'The panel label and the equipment’s documentation',
          'The number of contacts on the plug',
          'The thickness of the cable in the jack',
          'Whether the plug clicks when it seats',
        ]}
        correct={0}
        explain="Three contacts serve all three jobs — only the equipment’s labeling and documentation say which one this jack performs."
        wrong={[
          undefined,
          'The contact count is identical for all three jobs — that is exactly why the plug can’t tell you.',
          'Construction matters for the CABLE question, but it doesn’t reveal the jack’s job.',
          'TRS jacks are friction-fit either way — seating feel carries no signal information.',
        ]}
        onCorrect={() => setCheckOk(true)}
      />
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── pages 3–4: benches ──────────────────────────────────────────────────── */

function PageBenchAnalog({ ctx }: { ctx: PageCtx }) {
  const group = BENCH_GROUPS[0];
  const bench = useBench(ctx, group.ids, 4);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 2 · IDENTIFICATION BENCH — ANALOG</StationTag>
      <Lead>{group.blurb} Open a card to see the connector’s verified facts: contacts, signals it may carry, typical uses — and the mistake people make with it most.</Lead>
      <BenchSearch open={bench.open} onToggle={bench.toggleId} />
      {group.ids.map((id) => (
        <BenchCard key={id} id={id} open={bench.open.has(id)} onToggle={() => bench.toggleId(id)} />
      ))}
      <GoalChips goals={bench.goals} latched={bench.latched} />
    </View>
  );
}

function PageBenchSpeaker({ ctx }: { ctx: PageCtx }) {
  const group = BENCH_GROUPS[1];
  const bench = useBench(ctx, group.ids, 3);
  return (
    <View style={{ gap: 10 }}>
      <StationTag>STATION 2 · IDENTIFICATION BENCH — LOUDSPEAKER</StationTag>
      <Lead>{group.blurb}</Lead>
      <Card tone="warn">
        <Eyebrow>THE FAMILY RULE</Eyebrow>
        <Body>Everything on this bench carries AMPLIFIER POWER, not signal. Heavy unshielded conductors, connections made with the amplifier OFF — and never, ever into an input.</Body>
      </Card>
      {group.ids.map((id) => (
        <BenchCard key={id} id={id} open={bench.open.has(id)} onToggle={() => bench.toggleId(id)} />
      ))}
      <GoalChips goals={bench.goals} latched={bench.latched} />
    </View>
  );
}

export const CONNECTOR_PAGES_A: PageDef[] = [
  { title: 'Connector, cable, signal', short: 'Three things', Component: PageThreeThings, manualDone: true },
  { title: 'The same plug, two jobs', short: 'Same plug', Component: PageSamePlug, manualDone: true },
  { title: 'The bench: analog', short: 'Bench 1', Component: PageBenchAnalog, manualDone: true },
  { title: 'The bench: loudspeaker', short: 'Bench 2', Component: PageBenchSpeaker, manualDone: true },
];

const styles = StyleSheet.create({
  factRow: { gap: 1 },
  factLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  factValue: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  flagBox: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,198,77,.5)', backgroundColor: 'rgba(255,198,77,.08)', padding: 9 },
  flagText: { color: colors.gold, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18 },
  mistakeBox: { borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#141416', padding: 9, gap: 3 },
  mistakeEyebrow: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  mistakeText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  cautionBox: { borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,75,58,.45)', backgroundColor: 'rgba(255,75,58,.07)', padding: 9, gap: 3 },
  cautionEyebrow: { color: colors.red, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.5 },
  cautionText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  search: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0c0d0f', color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 13.5, paddingHorizontal: 12 },
});
