/**
 * The instructor view's shared pieces (must-do E3): the header, the readout
 * window, section heads, the activity lamp and the three faces of a read.
 *
 * Studio-hardware language, like the rest of the app: numbers sit in a dark
 * recessed "display window" in the mono readout face, headings are engraved
 * Oswald, and colour carries meaning only with a word beside it.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeOrBackKey } from '../../components/nav/HomeOrBackKey';
import { BACK_HIT_SLOP } from '../../components/backHitSlop';
import { safeGoBack } from '../../lib/safeGoBack';
import { fitValue } from '../../theme/legibility';
import { colors, fonts } from '../../theme/tokens';
import { CLASS_COPY, SCHOOL_DATA_STATEMENT_DRAFT, type Recency } from '../../features/instructor/classRules';
import { sampleClassOn } from '../../features/instructor/sampleClass';

export const IC = {
  bg: '#0b0b0d',
  panel: '#131316',
  panelEdge: '#24252b',
  well: '#060607',
  wellEdge: '#1b1c21',
  amber: colors.amber,
  amberLabel: colors.amberLabel,
  green: '#46e06c',
  dim: '#55565d',
  text: colors.textPrimary,
  sub: colors.textSub,
  muted: colors.textMuted,
  red: '#ff6a5e',
};

export function InstructorHeader({ eyebrow, title, accent, sub }: { eyebrow: string; title: string; accent?: string; sub?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  return (
    <View style={[st.hdr, { paddingTop: insets.top + 8 }]}>
      <HomeOrBackKey onPress={() => safeGoBack(navigation)} hitSlop={BACK_HIT_SLOP} style={st.back} backStyle={st.backGlyph} />
      <View style={st.hdrText}>
        <Text style={st.eyebrow}>{eyebrow}</Text>
        <Text accessibilityRole="header" style={st.title}>
          {title}
          {accent ? <Text style={st.titleAccent}> {accent}</Text> : null}
        </Text>
        {sub}
      </View>
    </View>
  );
}

/** A small lamp for how recently the student studied. The words beside it
 *  always say the same thing, so colour is never the only signal. */
export function ActivityLamp({ recency }: { recency: Recency }) {
  const c = recency === 'today' || recency === 'week' ? IC.green : recency === 'month' ? IC.amber : IC.dim;
  const lit = recency !== 'none';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        st.lamp,
        lit ? { backgroundColor: c, shadowColor: c, borderColor: c } : st.lampOff,
      ]}
    />
  );
}

/** The recessed display window: readouts side by side, never "of" anything. */
export function ReadoutWindow({ items, style }: { items: { value: number; label: string }[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.window, style]} accessible accessibilityLabel={items.map((i) => `${i.value} ${i.label.toLowerCase()}`).join(', ')}>
      {items.map((it, i) => (
        <View key={it.label} style={[st.cell, i > 0 && st.cellRule]}>
          <Text style={[st.value, it.value === 0 && st.valueZero]} {...fitValue(24)}>
            {it.value}
          </Text>
          <Text style={st.cellLabel} {...fitValue(10)}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** An engraved section head with a rule running to the edge. */
export function SectionHead({ children, right, note }: { children: string; right?: string; note?: string }) {
  return (
    <View style={st.secWrap}>
      <View style={st.secRow}>
        <Text style={st.sec} accessibilityRole="header">
          {children}
        </Text>
        <View style={st.secRule} />
        {right ? <Text style={st.secRight}>{right}</Text> : null}
      </View>
      {note ? <Text style={st.secNote}>{note}</Text> : null}
    </View>
  );
}

export function LoadingFace({ label }: { label: string }) {
  return (
    <View style={st.face} accessibilityLiveRegion="polite">
      <ActivityIndicator color={IC.amber} />
      <Text style={st.faceText}>{label}</Text>
    </View>
  );
}

export function FailedFace({ text, onRetry, title }: { text: string; onRetry?: () => void; title?: string }) {
  return (
    <View style={st.facePanel}>
      {title ? <Text style={st.faceTitle}>{title}</Text> : null}
      <Text style={st.faceBody}>{text}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [st.retry, pressed && st.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={st.retryText}>{CLASS_COPY.tryAgain}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** What the instructor never sees — the same list the student reads in
 *  Profile → MY INSTRUCTOR (shareRules SHARE_COPY.never). */
export function NeverShown() {
  return (
    <View style={st.never}>
      <Text style={st.neverHead}>{CLASS_COPY.neverHead}</Text>
      <Text style={st.neverBody}>{CLASS_COPY.never}</Text>
    </View>
  );
}

/** ⚠ The student-data statement is a DRAFT awaiting the owner's wording. It
 *  draws only on the dev sample, stamped, and never in a release build. */
export function SchoolStatementDraft() {
  if (!sampleClassOn()) return null;
  return (
    <View style={st.draft}>
      <Text style={st.draftStamp}>DRAFT · NOT APPROVED · SAMPLE HARNESS ONLY</Text>
      <Text style={st.draftHead}>{SCHOOL_DATA_STATEMENT_DRAFT.head}</Text>
      {SCHOOL_DATA_STATEMENT_DRAFT.paragraphs.map((p) => (
        <Text key={p.slice(0, 24)} style={st.draftBody}>
          {p}
        </Text>
      ))}
    </View>
  );
}

/** Says so on every sample screen, so a made-up student is never taken for real. */
export function SampleStamp() {
  if (!sampleClassOn()) return null;
  return <Text style={st.sample}>SAMPLE DATA · EVERY STUDENT HERE IS MADE UP</Text>;
}

export const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: IC.bg },
  pressed: { opacity: 0.72 },
  hdr: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: IC.panelEdge,
    backgroundColor: '#0e0e11',
  },
  back: { width: 40, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 34, lineHeight: 38, color: IC.amber, fontFamily: fonts.oswaldMedium },
  hdrText: { flex: 1, paddingTop: 2, gap: 2 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: IC.amberLabel },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 25, lineHeight: 31, color: IC.text },
  titleAccent: { color: IC.amber },
  lamp: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  lampOff: { borderColor: '#4a4b52', backgroundColor: 'transparent' },
  window: {
    flexDirection: 'row',
    backgroundColor: IC.well,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IC.wellEdge,
    borderTopColor: '#000000',
    paddingVertical: 9,
  },
  cell: { flex: 1, alignItems: 'center', paddingHorizontal: 4, gap: 1 },
  cellRule: { borderLeftWidth: 1, borderLeftColor: '#17181c' },
  value: { fontFamily: fonts.mono, fontSize: 24, lineHeight: 28, color: IC.amber },
  valueZero: { color: '#4d4e55' },
  cellLabel: { fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.2, color: IC.sub },
  secWrap: { marginTop: 26, marginBottom: 10, gap: 5 },
  secRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sec: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.8, color: IC.amberLabel },
  secRule: { flex: 1, height: 1, backgroundColor: '#25262c' },
  secRight: { fontFamily: fonts.mono, fontSize: 12, color: IC.sub },
  secNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: IC.muted },
  face: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  faceText: { fontFamily: fonts.barlowRegular, fontSize: 14, color: IC.sub },
  facePanel: {
    marginTop: 18,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: IC.panelEdge,
    backgroundColor: IC.panel,
    gap: 10,
  },
  faceTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 17, letterSpacing: 0.3, color: IC.text },
  faceBody: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  retry: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IC.amber,
  },
  retryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: IC.amber },
  never: {
    marginTop: 28,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,106,94,0.32)',
    backgroundColor: 'rgba(255,106,94,0.06)',
    gap: 4,
  },
  neverHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.6, color: IC.red },
  neverBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: IC.sub },
  draft: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#c9a6ff',
    backgroundColor: 'rgba(201,166,255,0.05)',
    gap: 8,
  },
  draftStamp: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, color: '#c9a6ff' },
  draftHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5, color: IC.text },
  draftBody: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: IC.sub },
  sample: {
    marginTop: 12,
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: '#7fd4ff',
    textAlign: 'center',
  },
});
