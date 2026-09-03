/**
 * HomeV3Sketch — DEV + WEB ONLY layout harness for the Home rebuild.
 *
 * Home is currently `CourseSelectionScreen`, whose deck is assembled from the
 * deprecated v1 `public_courses` catalog (9 courses / 54 topics). That catalog
 * is being removed, so Home has to be repointed onto the v3 model first. v3 is
 * a different shape and a much larger one:
 *
 *     ~180 active topics · 20 named fields · 128 certificates (3 topics each)
 *     · 36 programs (~27 topics each)
 *
 * Nine course cards do not translate to that. This harness renders three
 * candidate arrangements against the LIVE v3 data so the owner can choose one
 * before anything is committed to the real screen. Nothing here is wired into
 * the app: reachable only at `localhost:8090/#homesketch` in a dev web build.
 *
 * Free topics come from `achievements.always_free` via `V3Topic.free`, which is
 * the real v3 signal that replaces v1's hardcoded `FREE_TOPIC_GS = [0, 36]`.
 */
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import {
  fetchV3Certs,
  fetchV3Curriculum,
  fetchV3Programs,
  flattenV3,
  type V3Credential,
  type V3Field,
  type V3Topic,
} from '../../data/v3Curriculum';

type Layout = 'programs' | 'fields' | 'certs';

const LAYOUTS: { id: Layout; label: string; blurb: string }[] = [
  { id: 'programs', label: 'A · PROGRAMS', blurb: 'Programs are the top level. Big goals first, topics inside them.' },
  { id: 'fields', label: 'B · FIELDS', blurb: 'The field and subject hierarchy is the top level. Scales to any topic count.' },
  { id: 'certs', label: 'C · CERTIFICATES', blurb: 'The thing you earn is the top level. Needs a field filter to stay usable.' },
];

/* ── shell ─────────────────────────────────────────────────────────────── */

export function HomeV3Sketch() {
  return (
    <SafeAreaProvider>
      <Sketch />
    </SafeAreaProvider>
  );
}

function Sketch() {
  const insets = useSafeAreaInsets();
  const [layout, setLayout] = useState<Layout>('fields');
  const [fields, setFields] = useState<V3Field[] | null>(null);
  const [certs, setCerts] = useState<V3Credential[]>([]);
  const [programs, setPrograms] = useState<V3Credential[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void Promise.all([fetchV3Curriculum(), fetchV3Certs(), fetchV3Programs()])
      .then(([f, c, p]) => {
        if (!alive) return;
        setFields(f);
        setCerts(c);
        setPrograms(p);
        setFailed(f.length === 0);
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const topics = useMemo(() => (fields ? flattenV3(fields) : []), [fields]);
  const byGs = useMemo(() => new Map(topics.map((t) => [t.gs, t])), [topics]);
  const freeTopics = useMemo(() => topics.filter((t) => t.free), [topics]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.kicker}>HOME REBUILD · LAYOUT SKETCH · NOT WIRED INTO THE APP</Text>
      <Text style={styles.h1}>Three ways Home could present v3</Text>

      <View style={styles.seg}>
        {LAYOUTS.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => setLayout(l.id)}
            style={[styles.segBtn, layout === l.id && styles.segBtnOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: layout === l.id }}
            accessibilityLabel={`${l.label}. ${l.blurb}`}
          >
            <Text style={[styles.segText, layout === l.id && styles.segTextOn]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.blurb}>{LAYOUTS.find((l) => l.id === layout)!.blurb}</Text>

      {fields === null ? (
        <View style={styles.center}><ActivityIndicator color={colors.cyanBright} /><Text style={styles.muted}>Loading live v3 data…</Text></View>
      ) : failed ? (
        <View style={styles.center}>
          <Text style={styles.warn}>No v3 data came back.</Text>
          <Text style={styles.muted}>
            The harness reads the live tables through the same client the app uses. An empty result usually means
            this browser session has no Supabase auth, not that the layout is wrong.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.counts}>
            {topics.length} active topics · {fields.length} fields · {certs.length} certificates · {programs.length} programs
            {freeTopics.length ? ` · ${freeTopics.length} free` : ''}
          </Text>
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}>
            {layout === 'programs' ? <ProgramsFirst programs={programs} byGs={byGs} /> : null}
            {layout === 'fields' ? <FieldBrowse fields={fields} /> : null}
            {layout === 'certs' ? <CertsFirst certs={certs} byGs={byGs} /> : null}
            <FreeStrip free={freeTopics} />
          </ScrollView>
        </>
      )}
    </View>
  );
}

/* ── A · programs first ────────────────────────────────────────────────── */

function ProgramsFirst({ programs, byGs }: { programs: V3Credential[]; byGs: Map<number, V3Topic> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionHead}>PROGRAMS · {programs.length}</Text>
      {programs.map((p) => {
        const isOpen = open === p.id;
        const named = p.topicsGs.map((gs) => byGs.get(gs)).filter(Boolean) as V3Topic[];
        return (
          <View key={p.id}>
            <Pressable
              onPress={() => setOpen(isOpen ? null : p.id)}
              style={[styles.card, isOpen && styles.cardOn]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${p.name}, ${p.topicsGs.length} topics`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{p.name}</Text>
                <Text style={styles.cardMeta}>
                  {p.topicsGs.length} topics{p.electivesGs?.length ? ` · ${p.electivesGs.length} electives` : ''}
                </Text>
              </View>
              <Text style={styles.chev}>{isOpen ? '▴' : '▾'}</Text>
            </Pressable>
            {isOpen ? (
              <View style={styles.nest}>
                {named.slice(0, 10).map((t) => (
                  <Text key={t.gs} style={styles.leaf}>· {t.name}{t.free ? '  FREE' : ''}</Text>
                ))}
                {named.length > 10 ? <Text style={styles.leafMuted}>and {named.length - 10} more</Text> : null}
                {named.length === 0 ? <Text style={styles.leafMuted}>No member topics resolved from the active curriculum.</Text> : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/* ── B · field browse ──────────────────────────────────────────────────── */

function FieldBrowse({ fields }: { fields: V3Field[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const sorted = useMemo(
    () => [...fields].sort((a, b) =>
      b.subjects.reduce((n, s) => n + s.topics.length, 0) - a.subjects.reduce((n, s) => n + s.topics.length, 0)),
    [fields],
  );
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionHead}>FIELDS · {fields.length}</Text>
      {sorted.map((f) => {
        const count = f.subjects.reduce((n, s) => n + s.topics.length, 0);
        const isOpen = open === f.field;
        return (
          <View key={f.field}>
            <Pressable
              onPress={() => setOpen(isOpen ? null : f.field)}
              style={[styles.card, isOpen && styles.cardOn]}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${f.field}, ${f.subjects.length} subjects, ${count} topics`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{f.field}</Text>
                <Text style={styles.cardMeta}>{f.subjects.length} subjects · {count} topics</Text>
              </View>
              <Text style={styles.chev}>{isOpen ? '▴' : '▾'}</Text>
            </Pressable>
            {isOpen ? (
              <View style={styles.nest}>
                {f.subjects.map((s) => (
                  <View key={s.subject} style={{ marginBottom: 8 }}>
                    <Text style={styles.subHead}>{s.subject.toUpperCase()}</Text>
                    {s.topics.map((t) => (
                      <Text key={t.gs} style={styles.leaf}>· {t.name}{t.free ? '  FREE' : ''}</Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

/* ── C · certificates first ────────────────────────────────────────────── */

function CertsFirst({ certs, byGs }: { certs: V3Credential[]; byGs: Map<number, V3Topic> }) {
  const [field, setField] = useState<string>('ALL');
  const fieldOf = (c: V3Credential) => {
    const first = c.topicsGs.map((gs) => byGs.get(gs)).find(Boolean);
    return first?.field ?? 'Unfiled';
  };
  const allFields = useMemo(() => {
    const s = new Set(certs.map(fieldOf));
    return ['ALL', ...[...s].sort()];
  }, [certs, byGs]);
  const shown = field === 'ALL' ? certs : certs.filter((c) => fieldOf(c) === field);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionHead}>CERTIFICATES · {shown.length} OF {certs.length}</Text>
      <View style={styles.chipWrap}>
        {allFields.map((f) => (
          <Pressable
            key={f}
            onPress={() => setField(f)}
            style={[styles.chip, field === f && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: field === f }}
            accessibilityLabel={`Filter to ${f}`}
          >
            <Text style={[styles.chipText, field === f && styles.chipTextOn]} numberOfLines={1}>{f}</Text>
          </Pressable>
        ))}
      </View>
      {shown.map((c) => {
        const named = c.topicsGs.map((gs) => byGs.get(gs)).filter(Boolean) as V3Topic[];
        return (
          <View key={c.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.cardMeta}>{named.map((t) => t.name).join(' · ') || `${c.topicsGs.length} topics`}</Text>
            </View>
          </View>
        );
      })}
      {shown.length > 24 ? (
        <Text style={styles.note}>
          Showing every certificate in one list is the density problem this option has to solve. A filter is the
          minimum; search or grouping under fields would be the next step.
        </Text>
      ) : null}
    </View>
  );
}

/* ── the free cards, from always_free ──────────────────────────────────── */

function FreeStrip({ free }: { free: V3Topic[] }) {
  return (
    <View style={styles.freeBox}>
      <Text style={styles.sectionHead}>FREE, FROM `always_free` · {free.length}</Text>
      {free.length ? (
        free.map((t) => <Text key={t.gs} style={styles.leaf}>· {t.name}  ·  {t.field}</Text>)
      ) : (
        <Text style={styles.leafMuted}>
          No topic is flagged `always_free` in the active curriculum. v1 hardcoded gs 0 and 36 instead, which is
          exactly the coupling the rebuild removes, so this needs a decision either way.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg, paddingHorizontal: 16 },
  kicker: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 9.5, letterSpacing: 1.4 },
  h1: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 19, marginTop: 2, marginBottom: 10 },
  seg: { flexDirection: 'row', gap: 6 },
  segBtn: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315' },
  segBtnOn: { borderColor: colors.cyanBright, backgroundColor: '#10242b' },
  segText: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 0.8 },
  segTextOn: { color: colors.cyanBright },
  blurb: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, marginTop: 8, lineHeight: 17 },
  counts: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 11.5, marginTop: 8, marginBottom: 4 },
  scroll: { gap: 10, paddingTop: 6 },
  sectionHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.4, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013' },
  cardOn: { borderColor: colors.cyanBright },
  cardTitle: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 0.3 },
  cardMeta: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, marginTop: 2 },
  chev: { color: colors.textMuted, fontSize: 15, paddingHorizontal: 4 },
  nest: { paddingLeft: 14, paddingTop: 8, paddingBottom: 4, gap: 2 },
  subHead: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.1, marginBottom: 3 },
  leaf: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18 },
  leafMuted: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#131315', maxWidth: 220 },
  chipOn: { borderColor: colors.cyanBright, backgroundColor: '#10242b' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 11.5 },
  chipTextOn: { color: colors.cyanBright },
  freeBox: { marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.hairlineDim, backgroundColor: '#0d0f0e', gap: 2 },
  note: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, marginTop: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  muted: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  warn: { color: colors.gold, fontFamily: fonts.oswaldMedium, fontSize: 13 },
});
