/**
 * Audio Connectors & Cable Selection Lab — shared page bits.
 * ALL COPY IN THIS LAB IS NEW (owner brief 2026-09-11; copy sheet
 * docs/APE_CONNECTOR_SELECT_COPY_2026_09_11.md — pending ratification).
 *
 * Idioms carried from the patchbay/mixing labs: sticky visit-goal latches
 * with announced chips, short-button ConceptList (never prose in a button
 * label), preview-safe cross-lab links, and 44 pt targets throughout.
 */
import { useRef, useState } from 'react';
import { AccessibilityInfo, Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { useMarkWhen, Btn } from '../tuning/components/primitives';
import { navigationRef } from '../../../navigation/navigationRef';
import type { PageCtx } from '../kit/PagedLab';
import type { ConnectorId } from '../cable/cableTypes';
import { connectorImages } from '../cable/connectorImages';
import { CENTRAL_LESSON } from './data/roster';
import type { Verdict } from './engine/evaluate';

/** The central lesson card — repeated on purpose (brief). */
export function LessonCard() {
  return (
    <View style={styles.mantra}>
      <Text style={styles.mantraEyebrow}>THE CENTRAL LESSON</Text>
      <Text style={styles.mantraText}>{CENTRAL_LESSON}</Text>
    </View>
  );
}

/** Sticky exploration goals (patchbay idiom): each goal latches once its
 *  predicate has been true; when ALL have latched the page marks itself
 *  done. Announces each new latch for assistive tech. */
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

/** Short button + left-aligned prose beneath (design-pass grammar). */
export function ConceptList({
  items,
  opened,
  onOpen,
}: {
  items: readonly { id: string; name: string; blurb: string }[];
  opened: ReadonlySet<string>;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((it) => {
        const open = opened.has(it.id);
        return (
          <View key={it.id} style={{ gap: 4 }}>
            <Btn label={open ? `✓ ${it.name}` : it.name} tone={open ? 'primary' : 'plain'} selected={open} onPress={() => onOpen(it.id)} a11y={open ? `${it.name}: ${it.blurb}` : `Open ${it.name}`} />
            {open ? <Text style={styles.conceptNote}>{it.blurb}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

/** Cross-lab link — navigates the root stack; inert in the web preview
 *  harness (route absent), guarded so it never throws. */
export function OpenLabLink({ route, label }: { route: string; label: string }) {
  return (
    <Btn
      label={label}
      onPress={() => {
        try {
          if (navigationRef.isReady()) (navigationRef as { navigate: (r: string) => void }).navigate(route);
        } catch {
          /* preview harness: no-op */
        }
      }}
      a11y={label}
    />
  );
}

/** Verified connector photo(s) — the glossary-bucket images the owner
 *  ruled ideal for identification. Multi-view connectors render a labeled
 *  row; unmapped ids render nothing (never a placeholder). */
export function ConnectorPhoto({ id, size = 96, single, name }: {
  id: ConnectorId;
  size?: number;
  /** Show only the primary view — for dense contexts like the cable tray. */
  single?: boolean;
  /** Spoken name for assistive tech. DELIBERATELY OMITTED on assessment
   *  identification questions — naming the connector there would leak the
   *  answer; the generic label is the honest choice in that one context. */
  name?: string;
}) {
  const all = connectorImages(id);
  const images = single ? all.slice(0, 1) : all;
  if (!images.length) return null;
  return (
    <View style={styles.photoRow}>
      {images.map((img) => (
        <View key={img.url + img.label} style={{ alignItems: 'center', gap: 2 }}>
          <Image source={{ uri: img.url }} style={[styles.photo, { width: size, height: size }]} resizeMode="contain" accessibilityIgnoresInvertColors accessible accessibilityLabel={name ? `Photo: ${name}${img.label ? `, ${img.label.toLowerCase()} view` : ''}` : img.label ? `Photo: ${img.label.toLowerCase()} view` : 'Connector photo'} />
          {img.label ? <Text style={styles.photoLabel}>{img.label}</Text> : null}
        </View>
      ))}
    </View>
  );
}

/** The four-question verdict readout (Station 5): one row per question,
 *  pass/fail marks paired with words — never color alone. */
export function VerdictRows({ verdict }: { verdict: Verdict }) {
  // fits_but_verify: only FIT is genuinely known — rows 2–4 render as amber
  // "?" because the app must never claim what it teaches you not to claim
  // (cognition pass). unknown outranks the boolean for those rows.
  const rows: { name: string; ok: boolean; unknown?: boolean }[] = [
    { name: '1 · Physically fits', ok: verdict.fit },
    { name: '2 · Signal the equipment expects', ok: verdict.signal, unknown: verdict.unverified },
    { name: '3 · Cable construction correct', ok: verdict.construction, unknown: verdict.unverified },
    { name: '4 · Connection safe', ok: verdict.safe, unknown: verdict.unverified },
  ];
  return (
    // No live region here: ScenarioCard announces the verdict explicitly on
    // pick (works on BOTH platforms); a live region too would double-speak
    // on Android (design pass).
    <View style={styles.verdictBox}>
      {rows.map((r) => (
        <View key={r.name} style={styles.verdictRow} accessible accessibilityLabel={`${r.name}: ${r.unknown ? 'UNVERIFIED' : r.ok ? 'passes' : 'FAILS'}`}>
          <Text style={[styles.verdictMark, { color: r.unknown ? colors.gold : r.ok ? colors.green : colors.red }]}>{r.unknown ? '?' : r.ok ? '✓' : '✕'}</Text>
          <Text style={[styles.verdictName, r.unknown ? { color: colors.gold } : !r.ok ? { color: colors.red } : null]}>{r.name}{r.unknown ? ' — UNVERIFIED' : ''}</Text>
        </View>
      ))}
      <Text style={[styles.verdictLabel, { color: verdict.overall ? colors.green : verdict.problem === 'fits_but_verify' ? colors.gold : colors.red }]}>
        {verdict.overall ? '✓ CORRECT CABLE' : verdict.label}
      </Text>
      <Text style={styles.verdictExplain}>{verdict.explain}</Text>
    </View>
  );
}

/** Station eyebrow header. */
export function StationTag({ children }: { children: string }) {
  return <Text style={styles.station}>{children}</Text>;
}

const styles = StyleSheet.create({
  mantra: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,.4)', backgroundColor: 'rgba(255,198,77,.06)', padding: 12, gap: 5 },
  mantraEyebrow: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
  mantraText: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', paddingHorizontal: 9, paddingVertical: 6, minHeight: 32, justifyContent: 'center' },
  chipDone: { borderColor: colors.green, backgroundColor: '#0f2416' },
  chipText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
  conceptNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, paddingHorizontal: 4 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' },
  // Softened white ground + hairline edge so the tiles don't glare on the
  // dark UI (design pass) — the photos themselves are untouched.
  photo: { borderRadius: 10, backgroundColor: '#f4f4f5', borderWidth: 1, borderColor: colors.hairline },
  photoLabel: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.2 },
  verdictBox: { borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 10, gap: 6 },
  verdictRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  verdictMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, width: 16, textAlign: 'center' },
  verdictName: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  verdictLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2, marginTop: 2 },
  verdictExplain: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  station: { color: colors.cyanBright, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 2 },
});
