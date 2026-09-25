/**
 * Sound Systems Lab — shared page bits.
 *
 * Idioms carried from the connector and patchbay labs: sticky visit-goal
 * latches with announced chips, preview-safe cross-lab links, short button
 * labels with prose beneath, colours always paired with words. Prose
 * primitives come from tuning/components/primitives (the de-facto lab kit).
 */
import { useRef, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { navigationRef } from '../../../navigation/navigationRef';
import type { PageCtx } from '../kit/PagedLab';
import { Btn, useMarkWhen } from '../tuning/components/primitives';

/** Sticky exploration goals: each latches once its predicate has been true;
 *  when ALL have latched the page marks itself done. */
export function useVisitGoals(ctx: PageCtx, goals: { label: string; hit: boolean }[]): boolean[] {
  const seen = useRef<boolean[]>(goals.map(() => false));
  goals.forEach((g, i) => {
    if (g.hit && !seen.current[i]) {
      seen.current[i] = true;
      AccessibilityInfo.announceForAccessibility?.(`Goal complete: ${g.label}`);
    }
  });
  const all = seen.current.every(Boolean);
  useMarkWhen(all, () => {
    if (!ctx.isDone) ctx.markDone();
  });
  return [...seen.current];
}

export function GoalChips({ goals, latched }: { goals: { label: string }[]; latched: boolean[] }) {
  return (
    <View style={styles.chips} accessibilityRole="list">
      {goals.map((g, i) => (
        <View key={g.label} style={[styles.chip, latched[i] && styles.chipDone]} accessible accessibilityLabel={`${g.label}: ${latched[i] ? 'done' : 'not yet'}`}>
          <Text style={[styles.chipText, latched[i] && { color: colors.green }]}>
            {latched[i] ? '✓ ' : '○ '}
            {g.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Navigate the root stack by name; inert in a preview harness. */
function go(route: string, params?: object) {
  try {
    if (navigationRef.isReady()) (navigationRef as unknown as { navigate: (r: string, p?: object) => void }).navigate(route, params);
  } catch {
    /* preview harness: no-op */
  }
}

/** Cross-lab link — the "go deeper" row the owner asked for (link out, never duplicate). */
export function LabLink({ route, label, params }: { route: string; label: string; params?: object }) {
  return <Btn label={`${label} ›`} onPress={() => go(route, params)} a11y={`Open ${label}`} />;
}

/** Open a calculator workspace — every number on a page has one of these beside it. */
export function CalcLink({ id, label }: { id: string; label: string }) {
  return <Btn label={`Σ ${label} ›`} onPress={() => go('CalcWorkspace', { id })} a11y={`Open the ${label} calculator`} />;
}

/** Open a measurement tool's page. */
export function ToolLink({ toolKey, label }: { toolKey: string; label: string }) {
  return <Btn label={`${label} ›`} onPress={() => go('ToolInfo', { toolKey })} a11y={`Open the ${label} tool`} />;
}

/** A row of "go deeper" links under a chapter. */
export function DeeperRow({ children }: { children: ReactNode }) {
  return (
    <View style={styles.deeper}>
      <Text style={styles.deeperEyebrow}>GO DEEPER</Text>
      <View style={styles.deeperRow}>{children}</View>
    </View>
  );
}

/** Chapter eyebrow. */
export function ChapterTag({ n, children }: { n: number; children: string }) {
  return (
    <Text style={styles.chapter}>
      CHAPTER {n} · {children}
    </Text>
  );
}

/** A key fact, set apart. */
export function KeyFact({ children }: { children: ReactNode }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factEyebrow}>THE RULE</Text>
      <Text style={styles.factText}>{children}</Text>
    </View>
  );
}

/** A tappable option tile with a selected state (system pickers, config pickers). */
export function PickTile({ label, sub, selected, onPress, done }: { label: string; sub?: string; selected: boolean; onPress: () => void; done?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tile, selected && styles.tileSelected, done && !selected && styles.tileDone]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      aria-pressed={selected}
      accessibilityLabel={`${label}${sub ? `, ${sub}` : ''}${done ? ', viewed' : ''}`}
    >
      <Text style={[styles.tileLabel, selected && { color: colors.cyanBright }, done && !selected && { color: colors.textPrimary }]} numberOfLines={3}>
        {done && !selected ? '✓ ' : ''}
        {label}
      </Text>
      {sub ? <Text style={styles.tileSub} numberOfLines={2}>{sub}</Text> : null}
    </Pressable>
  );
}

/** Verdict line: mark + words, never colour alone. */
export function VerdictLine({ ok, warn, children }: { ok: boolean; warn?: boolean; children: ReactNode }) {
  const c = ok ? colors.green : warn ? colors.gold : colors.red;
  return (
    <View style={styles.verdict} accessible accessibilityLiveRegion="polite">
      <Text style={[styles.verdictMark, { color: c }]}>{ok ? '✓' : warn ? '△' : '✕'}</Text>
      <Text style={[styles.verdictText, { color: c }]}>{children}</Text>
    </View>
  );
}

/** A requirement checklist row (capstones). */
export function ReqRow({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.req} accessible accessibilityLabel={`${text}: ${met ? 'met' : 'not yet'}`}>
      <View style={[styles.reqBox, met && styles.reqBoxOn]}>{met ? <Text style={styles.reqCheck}>✓</Text> : null}</View>
      <Text style={[styles.reqText, met && { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );
}

/** Small mono readout pill. */
export function Readout({ k, v, tint }: { k: string; v: string; tint?: string }) {
  return (
    <View style={styles.readout} accessible accessibilityLabel={`${k}: ${v}`}>
      <Text style={styles.readoutK}>{k}</Text>
      <Text style={[styles.readoutV, tint ? { color: tint } : null]}>{v}</Text>
    </View>
  );
}

export function ReadoutRow({ children }: { children: ReactNode }) {
  return <View style={styles.readoutRow}>{children}</View>;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingHorizontal: 9, paddingVertical: 6, minHeight: 32, justifyContent: 'center', maxWidth: '100%', flexShrink: 1 },
  chipDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  chipText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
  deeper: { gap: 6, marginTop: 2 },
  deeperEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
  deeperRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chapter: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
  fact: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: 'rgba(255,198,77,.06)', padding: 12, gap: 5 },
  factEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
  factText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21 },
  tile: { minWidth: 96, flexGrow: 1, flexBasis: '30%', borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 9, gap: 3, minHeight: 48, justifyContent: 'center' },
  tileSelected: { borderColor: colors.cyanBright, backgroundColor: '#0f1a22' },
  tileDone: { borderColor: '#2f4a3a' },
  tileLabel: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6 },
  tileSub: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11, lineHeight: 14 },
  verdict: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  verdictMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, width: 16, textAlign: 'center' },
  verdictText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  req: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
  reqBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  reqBoxOn: { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,.15)' },
  reqCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.green, marginTop: -1 },
  reqText: { flex: 1, color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  readoutRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  readout: { borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#0e0f13', paddingHorizontal: 9, paddingVertical: 5, minWidth: 74 },
  readoutK: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1.4 },
  readoutV: { color: colors.amber, fontFamily: fonts.mono, fontSize: 14, marginTop: 1 },
});
