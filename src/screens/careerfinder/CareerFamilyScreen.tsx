/**
 * Audio Career Finder — one career family (owner brief 2026-09-03).
 *
 * What the work is, why it matched (only when the user has results), the
 * three dimensions, where the work happens, how central audio is across the
 * family's titles, the Academy subjects and topics that lead into it (tap to
 * add to enrollments — the same gesture as the Explore tree), and BROWSE
 * CAREERS IN THIS FAMILY over the bundled index, filtered by exact family id.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { colors, fonts } from '../../theme/tokens';
import { sendFeedback } from '../../lib/feedback';
import { officialTopicName } from '../../data/officialTopicNames';
import { fetchV3Curriculum, flattenV3 } from '../../data/v3Curriculum';
import { toggleTopic, useEnrollment } from '../../features/enrollment/enrollmentStore';
import { computeResult, explainFamily } from '../../features/careerfinder/scoring';
import { CENTRALITY, careersInFamily, centralitySplit, familyFieldOf, familyView, type Career } from '../../features/careerfinder/careerIndex';
import { answeredCount, toggleSavedFamily, useCareerFinder } from '../../features/careerfinder/store';
import { useEffect } from 'react';
import { Body, Card, CentralityChip, CtaButton, DimChip, FinderShell, Lead, SectionLabel } from './kit';

const PAGE = 12;

export function CareerFamilyScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, 'CareerFamily'>>();
  const fam = familyView(params.id);
  const rec = useCareerFinder();
  const hasResults = rec.completed && answeredCount(rec) > 0;
  const result = useMemo(() => (hasResults ? computeResult(rec.responses, familyFieldOf) : null), [hasResults, rec.responses]);
  const rank = result?.ranked.find((r) => r.family.id === params.id)?.rank ?? null;
  const careers = useMemo(() => careersInFamily(params.id), [params.id]);
  const split = useMemo(() => centralitySplit(params.id), [params.id]);
  const [shown, setShown] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const saved = rec.saved.includes(params.id);

  // Live topic names for the family's curriculum links (gs → official name,
  // never "Topic gsN"), and the enrollment list for the + / ✓ affordance.
  const [names, setNames] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    let alive = true;
    void fetchV3Curriculum().then((fields) => { if (alive) setNames(new Map(flattenV3(fields).map((t) => [t.gs, t.name] as const))); });
    return () => { alive = false; };
  }, []);
  const enrolled = useEnrollment();
  const enrolledGs = useMemo(() => new Set(enrolled.map((e) => e.gs)), [enrolled]);

  if (!fam) {
    return (
      <FinderShell kicker="AUDIO CAREER FINDER" title="Career family" onBack={() => navigation.goBack()}>
        <Body>This family is not in the current index. Go back and choose another.</Body>
      </FinderShell>
    );
  }

  const correction = () => sendFeedback('correction', fam.name, { Screen: 'Career family', 'Family id': fam.id, 'Index version': 'grand-audio-career-index-v2-2026-09-04' });

  return (
    <FinderShell kicker={`CAREER FAMILY · ${fam.count} TITLES`} title={fam.name} onBack={() => navigation.goBack()} backLabel={params.from === 'results' ? 'Back to results' : 'Back'}>
      {rank != null && rank <= 5 ? <Text style={styles.rankLine}>RANKED #{rank} FOR YOU</Text> : rank != null ? <Text style={[styles.rankLine, { color: colors.textMuted }]}>RANKED #{rank} OF 42 FOR YOU</Text> : null}
      <Lead>{fam.description}</Lead>

      {result ? (
        <Card tone="raised">
          <SectionLabel tone="cyan">WHY IT MATCHED</SectionLabel>
          <Body>{explainFamily(fam, result.dims)}</Body>
          <View style={styles.chips}>{fam.dimensions.map((c, i) => <DimChip key={c} code={c} dims={result.dims} primary={i === 0} />)}</View>
        </Card>
      ) : (
        <Card>
          <SectionLabel>THE ACTIVITIES IT LEANS ON</SectionLabel>
          <View style={styles.chips}>{fam.dimensions.map((c, i) => <DimChip key={c} code={c} primary={i === 0} />)}</View>
          <Body muted>Primary first. Take the Career Finder to see how your own interests line up with them.</Body>
        </Card>
      )}

      <Card>
        <SectionLabel>REPRESENTATIVE CAREERS</SectionLabel>
        {fam.examples.map((e) => <Text key={e} style={styles.example}>▸ {e}</Text>)}
        <SectionLabel>WHERE THE WORK HAPPENS</SectionLabel>
        <Body>{fam.settings.map((s, i) => (i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)).join(' · ')}</Body>
        <SectionLabel>HOW CENTRAL AUDIO IS</SectionLabel>
        <View style={styles.chips}>
          {(['core', 'specialized', 'enabled'] as const).filter((k) => split[k] > 0).map((k) => <CentralityChip key={k} value={k} count={split[k]} />)}
        </View>
        <Body muted>{(['core', 'specialized', 'enabled'] as const).filter((k) => split[k] > 0).map((k) => `${CENTRALITY[k].label}: ${CENTRALITY[k].explain.charAt(0).toLowerCase()}${CENTRALITY[k].explain.slice(1)}`).join(' ')}</Body>
      </Card>

      <Card tone="ok">
        <SectionLabel tone="green">START LEARNING IN THE ACADEMY</SectionLabel>
        <Text style={styles.pathLine}>{fam.field} › {fam.subject}</Text>
        {fam.topicGs.length ? (
          <>
            <Body muted>Tap a topic to add it to your enrollments — the same list the Explore page builds.</Body>
            {fam.topicGs.map((gs) => {
              const on = enrolledGs.has(gs);
              const name = officialTopicName(gs, names.get(gs));
              return (
                <Pressable key={gs} style={styles.topicRow} onPress={() => toggleTopic(gs)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={on ? `Remove ${name} from enrollments` : `Add ${name} to enrollments`}>
                  <Text style={[styles.topicCheck, on && { color: colors.green }]}>{on ? '✓' : '+'}</Text>
                  <Text style={[styles.topicText, on && { color: '#7dffa1' }]}>{name}</Text>
                </Pressable>
              );
            })}
          </>
        ) : (
          <Body muted>The subject above is the place to begin; its topics are listed on the Explore page.</Body>
        )}
        <CtaButton label="OPEN THE CURRICULUM" onPress={() => navigation.navigate('Awards', { category: 'curriculum' })} hint="Opens the Explore page with every subject" />
      </Card>

      <View style={{ gap: 8 }}>
        <SectionLabel>BROWSE CAREERS IN THIS FAMILY</SectionLabel>
        <Body muted>{careers.length} titles from the Grand Audio Career Index. Some are the same occupation under different names, seniority levels or employers — that is how the industry actually talks.</Body>
        {careers.slice(0, shown).map((c) => <CareerRow key={c.id} c={c} open={openId === c.id} onToggle={() => setOpenId(openId === c.id ? null : c.id)} />)}
        {shown < careers.length ? (
          <CtaButton label={`SHOW ${Math.min(PAGE * 2, careers.length - shown)} MORE OF ${careers.length - shown}`} onPress={() => setShown(shown + PAGE * 2)} />
        ) : null}
      </View>

      <View style={styles.after}>
        <CtaButton label={saved ? '★ SAVED — TAP TO REMOVE' : '☆ SAVE THIS FAMILY'} onPress={() => toggleSavedFamily(fam.id)} a11y={saved ? 'Remove from saved families' : 'Save this family'} />
        {hasResults ? <CtaButton label="BACK TO RESULTS" tone="green" onPress={() => navigation.navigate('CareerFinderResults')} /> : <CtaButton label="TAKE THE CAREER FINDER" tone="green" onPress={() => navigation.navigate('CareerFinder')} />}
        {hasResults ? <CtaButton label="RETAKE CAREER FINDER" tone="quiet" onPress={() => navigation.navigate('CareerFinder')} hint="Opens the Career Finder start page" /> : null}
        <CtaButton label="SUGGEST A CORRECTION" tone="quiet" onPress={correction} hint="Opens your mail app with this family named" />
      </View>
    </FinderShell>
  );
}

function CareerRow({ c, open, onToggle }: { c: Career; open: boolean; onToggle: () => void }) {
  return (
    <View style={styles.careerCard}>
      <Pressable onPress={onToggle} style={styles.careerRow} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${c.title}, ${CENTRALITY[c.centrality].label}${c.regulated ? ', licence or credential may be required' : ''}`}>
        <Text style={styles.careerChevron}>{open ? '▾' : '▸'}</Text>
        <Text style={styles.careerTitle} numberOfLines={2}>{c.title}{c.regulated ? <Text style={styles.reg}>  ⚠</Text> : null}</Text>
        <CentralityChip value={c.centrality} />
      </Pressable>
      {open ? (
        <View style={styles.careerBody}>
          {c.alternates.length ? <Text style={styles.detail}><Text style={styles.detailLabel}>ALSO CALLED  </Text>{c.alternates.join(' · ')}</Text> : null}
          <Text style={styles.detail}><Text style={styles.detailLabel}>KIND OF ROLE  </Text>{c.titleClass} · {c.orientation}</Text>
          <Text style={styles.detail}><Text style={styles.detailLabel}>HOW PEOPLE WORK  </Text>{c.workModel}</Text>
          <Text style={styles.detail}><Text style={styles.detailLabel}>TYPICAL PREPARATION  </Text>{c.preparation}</Text>
          <Text style={styles.detail}><Text style={styles.detailLabel}>AUDIO IN THIS ROLE  </Text>{c.relationship} — {CENTRALITY[c.centrality].explain}</Text>
          {c.regulated ? <Text style={[styles.detail, { color: '#ffb060' }]}>⚠ Requirements vary by jurisdiction or employer: verify licences, credentials, eligibility or safety training before relying on this title.</Text> : null}
          <Text style={[styles.detail, { color: colors.textMuted }]}>{c.status}. Common pathways are described, not mandatory requirements.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rankLine: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  example: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22 },
  pathLine: { color: colors.textPrimary, fontFamily: fonts.oswaldMedium, fontSize: 15 },
  topicRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4, minHeight: 32 },
  topicCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, lineHeight: 22, color: colors.textSub, width: 14, textAlign: 'center' },
  topicText: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, lineHeight: 22, color: colors.textPrimary },
  careerCard: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#232323', borderRadius: 9, overflow: 'hidden' },
  careerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8, paddingHorizontal: 12 },
  careerChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.textSub, width: 12 },
  careerTitle: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  reg: { color: '#ff8a1e' },
  careerBody: { paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4, gap: 5, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  detail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19 },
  detailLabel: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 1.3 },
  after: { gap: 8, marginTop: 4 },
});
