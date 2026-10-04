/**
 * Miking Labs kit — the reading and decision pieces every page uses. Prose,
 * card, point and takeaway are the Mastering Lab's own (re-exported, not
 * copied — the drumtuning/kit.tsx precedent).
 *
 *   ProvenanceTag   SOURCED / TRIAL / ILLUSTRATIVE — colour never alone: the
 *                   word is always printed.
 *   TendencyNote    a zone's tendency, in words, with its source.
 *   MikingScenarioCard  one scenario, judged BY VALUE; reports once, when the
 *                   right option is reached, with whether the FIRST pick was
 *                   right (a retry is free and explained).
 *   SymptomCard     a troubleshooting row: observation → first checks.
 *   NowLine         the scene's live summary in words (a polite live region).
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { Card } from '../../mastering/kit';
import type { DocumentedZone, MikingScenario, Provenance, Symptom } from './model/types.ts';

export { Body, Card, Point, SectionTitle, TakeawayCard, KeyButton } from '../../mastering/kit';

const BLUE = '#6fa8ff';
const AMBER = '#ffc64d';
const GREY = '#aab0bd';

export function ProvenanceTag({ kind }: { kind: 'sourced' | 'trial' | 'illustrative' | 'unknown' }) {
  const label = kind === 'sourced' ? 'SOURCED' : kind === 'trial' ? 'TRIAL' : kind === 'illustrative' ? 'ILLUSTRATIVE' : 'UNKNOWN';
  const tone = kind === 'sourced' ? BLUE : kind === 'trial' ? AMBER : GREY;
  return (
    <Text style={[styles.tag, { color: tone, borderColor: tone, borderStyle: kind === 'trial' ? 'dashed' : 'solid' }]} accessibilityLabel={`${label.toLowerCase()} value`}>
      {label}
    </Text>
  );
}

export function provKind(p: Provenance): 'sourced' | 'trial' | 'illustrative' | 'unknown' {
  return p.kind;
}

/** A documented zone in words: its band, the source's own words, the tendency. */
export function ZoneCard({ z }: { z: DocumentedZone }) {
  return (
    <View style={[styles.zone, { borderLeftColor: z.kind === 'trial' ? AMBER : BLUE }]}>
      <View style={styles.zoneHead}>
        <ProvenanceTag kind={z.kind} />
        <Text style={styles.zoneLabel}>{z.label}</Text>
      </View>
      <Text style={styles.zoneBand}>{z.band}</Text>
      <Text style={styles.quote}>“{z.quote}”</Text>
      {z.bandProv ? <Text style={styles.small}>{`Band drawn by the lab: ${z.bandProv.kind === 'illustrative' ? z.bandProv.reason : z.bandProv.kind === 'trial' ? z.bandProv.note : ''}`}</Text> : null}
      <Text style={styles.tendency}>{`TENDENCY · ${z.tendency}`}</Text>
      <Text style={styles.small}>{`CHECK · ${z.checks.join(' · ')}`}</Text>
    </View>
  );
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}
function shuffled(n: number, seed: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  let s = seed >>> 0 || 1;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Pickable = { id: string; prompt: string; options: readonly string[]; correct: string; explain: string };

export function MikingScenarioCard({ s, onAnswered, answered }: { s: Pickable; onAnswered: (firstRight: boolean) => void; answered?: boolean }) {
  const order = useMemo(() => shuffled(s.options.length, hashId(s.id)), [s]);
  const [picked, setPicked] = useState<string | null>(answered ? s.correct : null);
  const [wrong, setWrong] = useState<string[]>([]);
  const reported = useRef(!!answered);
  const firstWrong = useRef(false);
  const correct = picked === s.correct;
  return (
    <Card tone="accent">
      <Text style={styles.q}>{s.prompt}</Text>
      <View style={{ gap: 6 }}>
        {order.map((i) => {
          const o = s.options[i];
          const isRight = correct && o === s.correct;
          const isWrongPick = picked === o && !correct;
          const wasWrong = wrong.includes(o);
          return (
            <Pressable
              key={o}
              disabled={correct}
              onPress={() => {
                const ok = o === s.correct;
                setPicked(o);
                if (!ok) {
                  setWrong((w) => (w.includes(o) ? w : [...w, o]));
                  firstWrong.current = true;
                }
                if (ok && !reported.current) {
                  reported.current = true;
                  onAnswered(!firstWrong.current);
                }
                AccessibilityInfo.announceForAccessibility?.(ok ? 'Correct.' : `${o}: not the best fit. Choose again.`);
              }}
              style={[styles.opt, isRight && styles.optRight, isWrongPick && styles.optWrong, wasWrong && !isWrongPick && styles.optDim]}
              accessibilityRole="button"
              accessibilityState={{ disabled: correct, selected: picked === o }}
              accessibilityLabel={o}
            >
              <Text style={[styles.optText, isRight && { color: colors.green }, isWrongPick && { color: colors.red }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked != null ? (
        <Text style={[styles.explain, { color: correct ? colors.green : colors.gold }]}>
          {correct ? `✓ ${s.explain}` : `✗ "${picked}" is not the best fit here. Choose again; the explanation comes with the option that fits.`}
        </Text>
      ) : null}
    </Card>
  );
}

export function ScenarioList({ items, answers, onAnswered }: { items: readonly MikingScenario[]; answers: Readonly<Record<string, boolean>>; onAnswered: (id: string, firstRight: boolean) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {items.map((s) => (
        <MikingScenarioCard key={s.id} s={s} answered={s.id in answers} onAnswered={(ok) => onAnswered(s.id, ok)} />
      ))}
    </View>
  );
}

export function SymptomCard({ s, answered, onAnswered }: { s: Symptom; answered: boolean; onAnswered: (firstRight: boolean) => void }) {
  return <MikingScenarioCard s={{ id: s.id, prompt: `OBSERVATION · ${s.observation}. What do you check first?`, options: s.options, correct: s.correct, explain: s.explain }} answered={answered} onAnswered={onAnswered} />;
}

/** The scene's live summary in words (blueprint §9). */
export function NowLine({ text }: { text: string }) {
  return (
    <Text style={styles.now} accessibilityLiveRegion="polite">
      {`NOW · ${text}`}
    </Text>
  );
}

export function Landing({ looking, prompt }: { looking: string; prompt: string }) {
  return (
    <View style={{ gap: 3 }}>
      <Text style={styles.landing}>{`YOU ARE LOOKING AT: ${looking}`}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
    </View>
  );
}

export function Note({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'ok' }) {
  return (
    <View style={[styles.note, tone === 'warn' && { borderLeftColor: colors.gold }, tone === 'ok' && { borderLeftColor: colors.green }]}>
      <Text style={[styles.noteText, tone === 'warn' && { color: colors.gold }, tone === 'ok' && { color: colors.green }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, alignSelf: 'flex-start', overflow: 'hidden' },
  zone: { borderLeftWidth: 3, paddingLeft: 10, gap: 4 },
  zoneHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  zoneLabel: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14, lineHeight: 18, flexShrink: 1 },
  zoneBand: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 12, letterSpacing: 0.6, lineHeight: 16 },
  quote: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13, lineHeight: 18 },
  tendency: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  small: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  q: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 19 },
  opt: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  optRight: { borderColor: colors.green, backgroundColor: '#0f1d14' },
  optWrong: { borderColor: colors.red },
  optDim: { opacity: 0.55 },
  optText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 18 },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  now: { color: colors.cyanBright, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  landing: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, lineHeight: 15 },
  prompt: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 19 },
  note: { borderLeftWidth: 2, borderLeftColor: colors.cyan, paddingLeft: 10, paddingVertical: 2 },
  noteText: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
